"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Plus } from "lucide-react"
import { FiveWhysPanel } from "@/components/five-whys-panel"
import { getRandomPrompt, FiveWhysData } from "@/lib/prompt-utils"
import { Note } from "@/lib/types"

interface NextActionsDialogProps {
  note: Note
  onClose: () => void
  onAddAction: (noteId: string, actionText: string) => void
  onToggleAction: (noteId: string, actionId: string) => void
  onSaveFiveWhys: (noteId: string, fiveWhysData: FiveWhysData) => void
}

export function NextActionsDialog({ 
  note, 
  onClose, 
  onAddAction, 
  onToggleAction, 
  onSaveFiveWhys 
}: NextActionsDialogProps) {
  const [newActionText, setNewActionText] = useState("")
  const [currentPrompt, setCurrentPrompt] = useState("")

  // Generate a random prompt when the dialog opens
  useEffect(() => {
    setCurrentPrompt(getRandomPrompt())
  }, [note.id]) // Regenerate when note changes

  const handleAddAction = () => {
    if (newActionText.trim() === "") return
    onAddAction(note.id, newActionText)
    setNewActionText("")
  }

  const handleSaveFiveWhys = (fiveWhysData: FiveWhysData) => {
    onSaveFiveWhys(note.id, fiveWhysData)
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-center">
            Let&apos;s move this toward clarity.
          </DialogTitle>
        </DialogHeader>

        {/* Note Content */}
        <div className="p-4 bg-muted/30 rounded-md mb-6">
          <p className="text-sm">{note.text}</p>
        </div>

        <div className="space-y-6">
          {/* Primary Action Section */}
          <div className="space-y-4">
            <Label className="text-base font-medium">
              What&apos;s one thing you can do next?
            </Label>
            
            <div className="flex items-center gap-2">
              <Input
                value={newActionText}
                onChange={(e) => setNewActionText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddAction()}
                placeholder="Add action..."
                className="flex-1"
              />
              <Button 
                onClick={handleAddAction} 
                disabled={newActionText.trim() === ""}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>

            {/* Actions Checklist */}
            <div className="space-y-2">
              {note.nextActions.length > 0 ? (
                note.nextActions.map((action) => (
                  <div key={action.id} className="flex items-center gap-2 p-2 rounded-md bg-background border">
                    <Checkbox
                      id={action.id}
                      checked={action.completed}
                      onCheckedChange={() => onToggleAction(note.id, action.id)}
                    />
                    <Label 
                      htmlFor={action.id} 
                      className={`flex-1 text-sm ${action.completed ? "line-through text-muted-foreground" : ""}`}
                    >
                      {action.text}
                    </Label>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground italic">No actions yet. Add one above.</p>
              )}
            </div>
          </div>

          {/* Insight Prompt Section */}
          <div className="space-y-3">
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-2">
                <span className="text-lg">🧠</span>
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                    Thought Starter:
                  </p>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    → {currentPrompt}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Five Whys Section */}
          <div className="space-y-3">
            <FiveWhysPanel
              initialData={note.fiveWhys}
              onSave={handleSaveFiveWhys}
            />
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

