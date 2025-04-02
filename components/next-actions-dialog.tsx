"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Plus, MessageSquareQuote, ChevronRight, ChevronDown } from "lucide-react" // Added icons

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

// --- First Principles Questions ---
const firstPrinciplesQuestions = [
  "What is this really about?",
  "What assumptions am I making without even realizing it?",
  "If I had to explain this to a curious child, what would I say?",
  "What’s the simplest truth about this?",
  "What do I think is true—but haven’t tested?",
  "What’s one question I’m afraid to ask?",
  "Why do I think this matters to me right now?",
  "If I ignored everything I know, where would I start?",
  "What would I ask if I had no fear?",
  "What’s one tiny step I could take to test this?",
]
// ---------------------------------

export function NextActionsDialog({ note, onClose, onAddAction, onToggleAction }: NextActionsDialogProps) {
  const [newActionText, setNewActionText] = useState("")
  const [currentQuestion, setCurrentQuestion] = useState("")
  const [showFiveWhys, setShowFiveWhys] = useState(false)
  const [fiveWhysAnswers, setFiveWhysAnswers] = useState<string[]>(Array(5).fill(""))

  // Select a random question when the dialog opens for a specific note
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * firstPrinciplesQuestions.length)
    setCurrentQuestion(firstPrinciplesQuestions[randomIndex])
  }, [note.id]) // Re-run when the note ID changes

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

        {/* --- First Principles Question --- */}
        <div className="mb-4 p-3 border border-dashed rounded-md bg-blue-50 text-blue-800">
          <div className="flex items-center gap-2 font-medium">
            <MessageSquareQuote className="h-4 w-4" />
            <span>First Principles Prompt:</span>
          </div>
          <p className="mt-1 italic">{currentQuestion}</p>
        </div>
        {/* --------------------------------- */}
 
        {/* --- 5 Whys Trigger --- */}
        <Button variant="link" onClick={() => setShowFiveWhys(!showFiveWhys)} className="p-0 h-auto text-sm text-muted-foreground hover:text-foreground">
          {showFiveWhys ? <ChevronDown className="h-4 w-4 mr-1" /> : <ChevronRight className="h-4 w-4 mr-1" />}
          Try the 5 Whys
        </Button>
        {/* ---------------------- */}
 
        {/* --- 5 Whys Panel --- */}
        {showFiveWhys && (
          <div className="mt-2 mb-4 p-4 border rounded-md bg-background space-y-3">
            <p className="text-sm text-muted-foreground italic">
              “Each 'Why' digs into the reason above it. Don’t overthink—just be honest.”
            </p>
            {[...Array(5)].map((_, index) => {
              const prevAnswer = index === 0 ? note.text : fiveWhysAnswers[index - 1]
              const placeholderText = index === 0 ? `Why ${note.text}?` : `Why ${prevAnswer || "(previous answer)"}?`
              return (
                <div key={index} className="space-y-1">
                  <Label htmlFor={`why-${index + 1}`} className="text-xs font-medium">
                    {index + 1}. Why {index > 0 ? `(${index})` : `(${note.text.substring(0, 20)}...)` }?
                  </Label>
                  <Input
                    id={`why-${index + 1}`}
                    value={fiveWhysAnswers[index]}
                    onChange={(e) => {
                      const newAnswers = [...fiveWhysAnswers]
                      newAnswers[index] = e.target.value
                      setFiveWhysAnswers(newAnswers)
                    }}
                    placeholder={placeholderText}
                    className="text-sm"
                  />
                </div>
              )
            })}
          </div>
        )}
        {/* -------------------- */}
 
        {/* --- Next Actions Section --- */}
        <h3 className="text-md font-semibold mt-4 mb-2">Next Actions</h3>
        <div className="space-y-4">
        </div>
        {/* --------------------------------- */}

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

