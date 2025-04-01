"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Plus } from "lucide-react"

interface Note {
  id: string
  text: string
  zone: "wwtf" | "wtf" | "clarity"
  nextActions: Array<{ id: string; text: string; completed: boolean }>
}

interface NextActionsDialogProps {
  note: Note
  onClose: () => void
  onAddAction: (noteId: string, actionText: string) => void
  onToggleAction: (noteId: string, actionId: string) => void
}

export function NextActionsDialog({ note, onClose, onAddAction, onToggleAction }: NextActionsDialogProps) {
  const [newActionText, setNewActionText] = useState("")

  const handleAddAction = () => {
    if (newActionText.trim() === "") return
    onAddAction(note.id, newActionText)
    setNewActionText("")
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Next Actions for Note</DialogTitle>
        </DialogHeader>

        <div className="p-4 bg-muted/30 rounded-md mb-4">
          <p>{note.text}</p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Input
              value={newActionText}
              onChange={(e) => setNewActionText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddAction()}
              placeholder="Add a next action..."
              className="flex-1"
            />
            <Button onClick={handleAddAction} disabled={newActionText.trim() === ""}>
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>

          <div className="space-y-2">
            {note.nextActions.length > 0 ? (
              note.nextActions.map((action) => (
                <div key={action.id} className="flex items-center gap-2 p-2 rounded-md bg-background">
                  <Checkbox
                    id={action.id}
                    checked={action.completed}
                    onCheckedChange={() => onToggleAction(note.id, action.id)}
                  />
                  <Label htmlFor={action.id} className={action.completed ? "line-through text-muted-foreground" : ""}>
                    {action.text}
                  </Label>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No actions yet. Add one above.</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

