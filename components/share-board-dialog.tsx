"use client"

import { useState, useEffect } from "react"
import { Check, Copy, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"

interface ShareBoardDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  boardId: string
}

export function ShareBoardDialog({ open, onOpenChange, boardId }: ShareBoardDialogProps) {
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)
  const [isPublic, setIsPublic] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/board/share/${boardId}` : ''

  // Fetch the current sharing status when the dialog opens
  useEffect(() => {
    if (open && boardId) {
      fetchSharingStatus()
    }
  }, [open, boardId])

  const fetchSharingStatus = async () => {
    if (!boardId) return

    setIsLoading(true)

    try {
      const { data, error } = await supabase.from("boards").select("shared").eq("id", boardId).single()

      if (error) throw error

      setIsPublic(data.shared)
    } catch (error) {
      console.error("Error fetching board sharing status:", error)
      toast({
        title: "Error",
        description: "Failed to fetch sharing status",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      toast({
        title: "Link copied",
        description: "Board link copied to clipboard",
      })

      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please copy the link manually",
        variant: "destructive",
      })
    }
  }

  const toggleBoardVisibility = async () => {
    if (!boardId) return

    setIsLoading(true)

    try {
      // Update the board's shared status in the database
      const { error } = await supabase.from("boards").update({ shared: !isPublic }).eq("id", boardId)

      if (error) throw error

      // Update local state
      setIsPublic(!isPublic)

      toast({
        title: isPublic ? "Board sharing disabled" : "Board sharing enabled",
        description: isPublic ? "The board is now private" : "Anyone with the link can now access this board",
      })
    } catch (error) {
      console.error("Error updating board sharing status:", error)
      toast({
        title: "Error",
        description: "Failed to update sharing status",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share board</DialogTitle>
          <DialogDescription>Anyone with the link can view and edit this board</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-6 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="flex items-center space-x-2 pt-4">
              <div className="grid flex-1 gap-2">
                <Label htmlFor="share-link" className="sr-only">
                  Share link
                </Label>
                <Input id="share-link" value={shareUrl} readOnly className="h-9" />
              </div>
              <Button size="sm" className="px-3" onClick={copyToClipboard} variant="secondary">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                <span className="sr-only">Copy link</span>
              </Button>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <Switch
                id="share-toggle"
                checked={isPublic}
                onCheckedChange={toggleBoardVisibility}
                disabled={isLoading}
              />
              <Label htmlFor="share-toggle">{isPublic ? "Sharing enabled" : "Sharing disabled"}</Label>
            </div>

            <DialogFooter className="sm:justify-start">
              <div className="text-xs text-muted-foreground mt-2">
                {isPublic ? "Anyone with this link can view and edit this board" : "Only you can access this board"}
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

