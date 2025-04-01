"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

interface Note {
  id: string
  text: string
  zone: "wwtf" | "wtf" | "clarity"
  nextActions: Array<{ id: string; text: string; completed: boolean }>
}

export function useRealtimeSync(boardId: string, notes: Note[], setNotes: (notes: Note[]) => void) {
  const [lastSyncedAt, setLastSyncedAt] = useState<Date>(new Date())
  const [isSyncing, setIsSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Subscribe to real-time changes
  useEffect(() => {
    // Only subscribe if we have a boardId and it's not a demo board
    if (!boardId || boardId.startsWith("demo-")) return

    // Check if the user is authenticated before subscribing
    const checkAuthAndSubscribe = async () => {
      try {
        const { data } = await supabase.auth.getSession()

        if (!data.session) {
          console.log("No authenticated session, skipping real-time subscription")
          return
        }

        // Reset error state
        setError(null)

        // Subscribe to changes on the boards table for this specific board
        const subscription = supabase
          .channel(`board-${boardId}`)
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "boards",
              filter: `id=eq.${boardId}`,
            },
            (payload) => {
              // Only update if we're not the ones who made the change
              const updatedAt = new Date(payload.new.updated_at)
              if (updatedAt > lastSyncedAt && !isSyncing) {
                // Extract the notes from the content field
                const updatedNotes = payload.new.content || []
                setNotes(updatedNotes)
              }
            },
          )
          .subscribe((status) => {
            if (status === "CHANNEL_ERROR") {
              setError("Failed to subscribe to real-time updates")
            }
          })

        return () => {
          supabase.removeChannel(subscription)
        }
      } catch (error) {
        console.error("Error in real-time subscription:", error)
        setError("Failed to set up real-time updates")
      }
    }

    checkAuthAndSubscribe()
  }, [boardId, lastSyncedAt, isSyncing, setNotes])

  // Function to save changes to the database
  const saveChanges = async () => {
    // Only save if we have a boardId and it's not a demo board
    if (!boardId || boardId.startsWith("demo-") || notes.length === 0) return

    setIsSyncing(true)
    setError(null)

    try {
      const now = new Date()

      // Update the board content
      const { error } = await supabase
        .from("boards")
        .update({
          content: notes,
          updated_at: now.toISOString(),
        })
        .eq("id", boardId)

      if (error) throw error

      setLastSyncedAt(now)
    } catch (error) {
      console.error("Error saving changes:", error)
      setError("Failed to save changes")
    } finally {
      setIsSyncing(false)
    }
  }

  // Debounced save function
  useEffect(() => {
    // Only save if we have a boardId and it's not a demo board
    if (!boardId || boardId.startsWith("demo-")) return

    const timer = setTimeout(() => {
      saveChanges()
    }, 1000) // 1 second debounce

    return () => clearTimeout(timer)
  }, [notes, boardId])

  return { isSyncing, error }
}

