"use client"

import { useState, useEffect } from "react"
import { CircleZone } from "@/components/circle-zone"
import { StickyNote } from "@/components/sticky-note"
import { NextActionsDialog } from "@/components/next-actions-dialog"
import { ZoneSummary } from "@/components/zone-summary"
import { ShareBoardDialog } from "@/components/share-board-dialog"
import { CreateBoardDialog } from "@/components/create-board-dialog"
import { ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LogOut, Plus, Share2, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRealtimeSync } from "@/hooks/use-realtime-sync"
import { useRouter } from "next/navigation"

// Import supabase client
import { supabase } from "@/lib/supabase"

// Types
type Zone = "wwtf" | "wtf" | "clarity"
interface Action {
  id: string
  text: string
  completed: boolean
}
interface Note {
  id: string
  text: string
  zone: Zone
  nextActions: Action[]
}

interface Board {
  id: string
  title: string
  isShared?: boolean
  ownerId?: string
  user_id?: string
}

export default function Home() {
  const { toast } = useToast()
  const router = useRouter()
  const [notes, setNotes] = useState<Note[]>([])
  const [myBoards, setMyBoards] = useState<Board[]>([])
  const [sharedBoards, setSharedBoards] = useState<Board[]>([])
  const [activeBoardId, setActiveBoardId] = useState<string | null>(null)
  const [noteInput, setNoteInput] = useState("")
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const [isCreateBoardDialogOpen, setIsCreateBoardDialogOpen] = useState(false)
  const [isGuest, setIsGuest] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  // Set up real-time sync
  const { isSyncing, error: syncError } = useRealtimeSync(activeBoardId || "", notes, setNotes)

  // Combine all boards for the dropdown
  const allBoards = [...myBoards, ...sharedBoards]

  // Check if the user is authenticated and fetch their boards
  useEffect(() => {
    async function checkAuth() {
      try {
        // Get the current user
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          console.error("Auth error:", error.message)
          // Handle auth error by falling back to demo mode
          setupDemoMode()
          return
        }

        if (data.session?.user) {
          setUserId(data.session.user.id)
          await fetchUserBoards(data.session.user.id)
        } else {
          console.log("No authenticated user found, using demo mode")
          // No authenticated user, show demo mode
          setupDemoMode()
        }
      } catch (error) {
        console.error("Error checking authentication:", error)
        toast({
          title: "Authentication Error",
          description: "Failed to check authentication status, using demo mode",
          variant: "destructive",
        })

        // Fall back to demo mode
        setupDemoMode()
      }
    }

    checkAuth()
  }, [])

  // Fetch user's boards
  const fetchUserBoards = async (userId: string) => {
    setIsLoading(true)

    try {
      // Fetch boards owned by the user
      const { data: ownedBoards, error: ownedError } = await supabase
        .from("boards")
        .select("id, title, shared")
        .eq("user_id", userId)

      if (ownedError) throw ownedError

      // Fetch boards shared with the user
      const { data: sharedWithUser, error: sharedError } = await supabase
        .from("shared_boards")
        .select("board_id, boards(id, title, user_id)")
        .eq("user_id", userId)

      if (sharedError) throw sharedError

      // Format the boards
      const formattedOwnedBoards = ownedBoards.map((board) => ({
        id: board.id,
        title: board.title,
        isShared: board.shared,
      }))

      const formattedSharedBoards = sharedWithUser.map((item) => ({
        id: item.boards.id,
        title: item.boards.title,
        isShared: true,
        ownerId: item.boards.user_id,
      }))

      setMyBoards(formattedOwnedBoards)
      setSharedBoards(formattedSharedBoards)

      // Set the active board to the first board if there is one
      if (formattedOwnedBoards.length > 0) {
        setActiveBoardId(formattedOwnedBoards[0].id)
        await fetchBoardData(formattedOwnedBoards[0].id)
      } else if (formattedSharedBoards.length > 0) {
        setActiveBoardId(formattedSharedBoards[0].id)
        await fetchBoardData(formattedSharedBoards[0].id)
      } else {
        setIsLoading(false)
      }
    } catch (error) {
      console.error("Error fetching boards:", error)
      toast({
        title: "Error",
        description: "Failed to fetch your boards",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  // Add a function to set up demo data
  const setupDemoMode = () => {
    setMyBoards([
      { id: "demo-board-1", title: "Demo Board 1" },
      { id: "demo-board-2", title: "Demo Board 2" },
    ])
    setActiveBoardId("demo-board-1")

    // Add some sample notes
    setNotes([
      {
        id: "note-1",
        text: "Where's the code? Github",
        zone: "wwtf",
        nextActions: [],
      },
      {
        id: "note-2",
        text: "Access db to see prompts",
        zone: "wwtf",
        nextActions: [{ id: "action-1", text: "Set up database access", completed: false }],
      },
      {
        id: "note-3",
        text: "Are stories written?",
        zone: "wtf",
        nextActions: [],
      },
      {
        id: "note-4",
        text: "My roadmap - stories to be completed for MVP",
        zone: "clarity",
        nextActions: [
          { id: "action-2", text: "Define MVP features", completed: true },
          { id: "action-3", text: "Create timeline", completed: false },
        ],
      },
    ])

    setIsLoading(false)
  }

  // Fetch board data
  const fetchBoardData = async (boardId: string) => {
    setIsLoading(true)

    try {
      const { data, error } = await supabase.from("boards").select("content").eq("id", boardId).single()

      if (error) throw error

      if (data && data.content) {
        setNotes(data.content)
      } else {
        setNotes([])
      }
    } catch (error) {
      console.error("Error fetching board data:", error)
      toast({
        title: "Error",
        description: "Failed to fetch board data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Check if we're viewing a shared board as a guest
  useEffect(() => {
    async function checkSharedBoard() {
      // Check if window is available (client-side)
      if (typeof window === 'undefined') return
      
      // This would check the URL path to see if we're on a shared board link
      const path = window.location.pathname
      if (path.includes("/board/share/")) {
        const sharedBoardId = path.split("/").pop()
        if (sharedBoardId) {
          setIsGuest(true)
          setActiveBoardId(sharedBoardId)

          // Fetch the shared board data
          try {
            const { data, error } = await supabase
              .from("boards")
              .select("content, title, shared")
              .eq("id", sharedBoardId)
              .single()

            if (error) throw error

            if (!data || !data.shared) {
              toast({
                title: "Access Denied",
                description: "This board doesn't exist or is not shared",
                variant: "destructive",
              })
              return
            }

            setNotes(data.content || [])
            setMyBoards([{ id: sharedBoardId, title: data.title }])
          } catch (error) {
            console.error("Error fetching shared board:", error)
            toast({
              title: "Error",
              description: "Failed to fetch shared board",
            })
          } finally {
            setIsLoading(false)
          }
        }
      }
    }

    checkSharedBoard()
  }, [])

  const handleAddNote = async () => {
    if (noteInput.trim() === "") return

    const newNote: Note = {
      id: `note-${Date.now()}-${Math.random()}`,
      text: noteInput,
      zone: "wwtf",
      nextActions: [],
    }

    // Update local state
    const updatedNotes = [...notes, newNote]
    setNotes(updatedNotes)
    setNoteInput("")

    // If we have an active board and we're not in demo mode, update in database
    if (activeBoardId && userId) {
      try {
        const { error } = await supabase
          .from("boards")
          .update({
            content: updatedNotes,
            updated_at: new Date().toISOString(),
          })
          .eq("id", activeBoardId)

        if (error) throw error
      } catch (error) {
        console.error("Error adding note:", error)
        toast({
          title: "Error",
          description: "Failed to save note",
          variant: "destructive",
        })
      }
    }
  }

  const handleMoveNote = async (noteId: string, targetZone: Zone) => {
    // Update local state
    const updatedNotes = notes.map((note) => (note.id === noteId ? { ...note, zone: targetZone } : note))

    setNotes(updatedNotes)

    // If we have an active board and we're not in demo mode, update in database
    if (activeBoardId && userId) {
      try {
        const { error } = await supabase
          .from("boards")
          .update({
            content: updatedNotes,
            updated_at: new Date().toISOString(),
          })
          .eq("id", activeBoardId)

        if (error) throw error
      } catch (error) {
        console.error("Error moving note:", error)
        toast({
          title: "Error",
          description: "Failed to update note position",
          variant: "destructive",
        })
      }
    }
  }

  const handleNoteDoubleClick = (noteId: string) => {
    setEditingNoteId(noteId)
  }

  const handleCloseModal = () => {
    setEditingNoteId(null)
  }

  const handleAddAction = async (noteId: string, actionText: string) => {
    const newAction: Action = {
      id: `action-${Date.now()}-${Math.random()}`,
      text: actionText,
      completed: false,
    }

    // Update local state
    const updatedNotes = notes.map((note) =>
      note.id === noteId ? { ...note, nextActions: [...(note.nextActions || []), newAction] } : note,
    )

    setNotes(updatedNotes)

    // If we have an active board and we're not in demo mode, update in database
    if (activeBoardId && userId) {
      try {
        const { error } = await supabase
          .from("boards")
          .update({
            content: updatedNotes,
            updated_at: new Date().toISOString(),
          })
          .eq("id", activeBoardId)

        if (error) throw error
      } catch (error) {
        console.error("Error adding action:", error)
        toast({
          title: "Error",
          description: "Failed to save action",
          variant: "destructive",
        })
      }
    }
  }

  const handleToggleAction = async (noteId: string, actionId: string) => {
    // Update local state
    const updatedNotes = notes.map((note) =>
      note.id === noteId
        ? {
            ...note,
            nextActions: (note.nextActions || []).map((action) =>
              action.id === actionId ? { ...action, completed: !action.completed } : action,
            ),
          }
        : note,
    )

    setNotes(updatedNotes)

    // If we have an active board and we're not in demo mode, update in database
    if (activeBoardId && userId) {
      try {
        const { error } = await supabase
          .from("boards")
          .update({
            content: updatedNotes,
            updated_at: new Date().toISOString(),
          })
          .eq("id", activeBoardId)

        if (error) throw error
      } catch (error) {
        console.error("Error toggling action:", error)
        toast({
          title: "Error",
          description: "Failed to update action",
          variant: "destructive",
        })
      }
    }
  }

  const handleCreateBoard = async (boardName: string) => {
    if (!boardName.trim()) return

    setIsLoading(true)

    // Check if we're in demo mode
    if (!userId) {
      // In demo mode, just create a local board
      const newBoardId = `demo-board-${Date.now()}`
      const newBoard: Board = {
        id: newBoardId,
        title: boardName,
      }

      setMyBoards((prev) => [...prev, newBoard])
      setActiveBoardId(newBoardId)
      setNotes([])

      toast({
        title: "Demo Mode",
        description: `Board "${boardName}" created in demo mode (not saved to database)`,
      })

      setIsLoading(false)
      return
    }

    try {
      // Get the current session to ensure we have a valid user
      const { data: sessionData } = await supabase.auth.getSession()

      if (!sessionData.session) {
        throw new Error("No active session found")
      }

      // Create a new board in Supabase with the current authenticated user
      const { data, error } = await supabase
        .from("boards")
        .insert({
          title: boardName,
          content: [],
          shared: false,
          user_id: sessionData.session.user.id, // Use the session user ID
        })
        .select()

      if (error) throw error

      // Add the new board to the list
      const newBoard: Board = {
        id: data[0].id,
        title: boardName,
      }

      setMyBoards((prev) => [...prev, newBoard])
      setActiveBoardId(newBoard.id)
      setNotes([])

      toast({
        title: "Success",
        description: `Board "${boardName}" created successfully`,
      })
    } catch (error) {
      console.error("Error creating board:", error)
      toast({
        title: "Error",
        description: "Failed to create board: " + (error instanceof Error ? error.message : "Unknown error"),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleBoardSelectChange = async (selectedBoardId: string) => {
    if (selectedBoardId === activeBoardId) return

    setActiveBoardId(selectedBoardId)
    await fetchBoardData(selectedBoardId)
  }

  const currentEditingNote = notes.find((note) => note.id === editingNoteId) || null
  const activeBoard = allBoards.find((board) => board.id === activeBoardId)
  const isSharedBoard = sharedBoards.some((board) => board.id === activeBoardId)
  const canShareBoard = !isGuest && !isSharedBoard

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div>
                <h1 className="text-2xl font-bold">WTF Circles</h1>
                <p className="text-sm text-muted-foreground">Clarity for when you're clueless</p>
              </div>

              {!isGuest && (
                <div className="flex items-center gap-2">
                  <Select value={activeBoardId || ""} onValueChange={handleBoardSelectChange}>
                    <SelectTrigger className="w-[220px] h-9 text-lg font-medium border-0 p-0 focus:ring-0">
                      <SelectValue placeholder="Select a board" />
                    </SelectTrigger>
                    <SelectContent>
                      {allBoards.map((board) => (
                        <SelectItem key={board.id} value={board.id} className={board.isShared ? "italic" : ""}>
                          {board.title} {board.isShared && "(shared)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="flex items-center">
                    {myBoards.some((board) => board.id === activeBoardId) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsShareDialogOpen(true)}
                        className="h-8 w-8"
                        aria-label="Share board"
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsCreateBoardDialogOpen(true)}
                      className="h-8 w-8"
                      aria-label="Create new board"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {isGuest && (
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-medium">{activeBoard?.title || activeBoardId}</h2>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {userId ? (
                <>
                  <span className="text-sm text-muted-foreground">Logged in as: {userId}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      await supabase.auth.signOut()
                      if (typeof window !== 'undefined') {
                        window.location.reload()
                      }
                    }}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <span className="text-sm text-muted-foreground">Demo Mode</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      router.push("/auth")
                    }}
                  >
                    Sign in
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container py-6 relative">
        {/* Error message */}
        {syncError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
            <p>{syncError}</p>
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Input
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
                placeholder="Enter new idea..."
                className="w-full md:w-[300px]"
              />
              <Button onClick={handleAddNote} disabled={noteInput.trim() === "" || !activeBoardId || isLoading}>
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
          </div>
        </div>

        {isLoading && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-50">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading board...</p>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && activeBoardId && notes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
            <div className="text-center p-6 max-w-md">
              <h3 className="text-lg font-medium mb-2">This board is empty</h3>
              <p className="text-muted-foreground mb-4">Add your first note using the input field above</p>
            </div>
          </div>
        )}

        {/* No boards state */}
        {!isLoading && !activeBoardId && allBoards.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="text-center p-6 max-w-md">
              <h3 className="text-lg font-medium mb-2">No boards found</h3>
              <p className="text-muted-foreground mb-4">Create your first board to get started</p>
              <Button onClick={() => setIsCreateBoardDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Board
              </Button>
            </div>
          </div>
        )}

        {/* Whiteboard and Summary */}
        <ResizablePanelGroup direction="horizontal" className="min-h-[600px] rounded-lg border">
          <ResizablePanel defaultSize={80} minSize={50}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 h-full bg-muted/30">
              <CircleZone title="WWTF" onDropNote={handleMoveNote}>
                <div className="flex flex-wrap gap-2 p-2 min-h-[200px]">
                  {notes
                    .filter((note) => note.zone === "wwtf")
                    .map((note) => (
                      <StickyNote key={note.id} note={note} onDoubleClick={handleNoteDoubleClick} />
                    ))}
                </div>
              </CircleZone>

              <CircleZone title="WTF" onDropNote={handleMoveNote}>
                <div className="flex flex-wrap gap-2 p-2 min-h-[200px]">
                  {notes
                    .filter((note) => note.zone === "wtf")
                    .map((note) => (
                      <StickyNote key={note.id} note={note} onDoubleClick={handleNoteDoubleClick} />
                    ))}
                </div>
              </CircleZone>

              <CircleZone title="CLARITY" onDropNote={handleMoveNote}>
                <div className="flex flex-wrap gap-2 p-2 min-h-[200px]">
                  {notes
                    .filter((note) => note.zone === "clarity")
                    .map((note) => (
                      <StickyNote key={note.id} note={note} onDoubleClick={handleNoteDoubleClick} />
                    ))}
                </div>
              </CircleZone>
            </div>
          </ResizablePanel>

          <ResizablePanel defaultSize={20} minSize={15}>
            <div className="p-4 h-full overflow-auto">
              <ZoneSummary notes={notes} onToggleAction={handleToggleAction} />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </main>

      {/* Modals */}
      {currentEditingNote && (
        <NextActionsDialog
          note={currentEditingNote}
          onClose={handleCloseModal}
          onAddAction={handleAddAction}
          onToggleAction={handleToggleAction}
        />
      )}

      <ShareBoardDialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen} boardId={activeBoardId || ""} />

      <CreateBoardDialog
        open={isCreateBoardDialogOpen}
        onOpenChange={setIsCreateBoardDialogOpen}
        onCreateBoard={handleCreateBoard}
      />
    </div>
  )
}

// Force dynamic rendering to prevent SSR issues
export const dynamic = 'force-dynamic'

