"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Plus, MessageSquareQuote, ChevronRight, ChevronDown, Save, X, Lightbulb } from "lucide-react"
import { cn } from "@/lib/utils"

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
  const [isFiveWhysExpanded, setIsFiveWhysExpanded] = useState(false)
  const [fiveWhysAnswers, setFiveWhysAnswers] = useState<string[]>(Array(5).fill(""))
  // TODO: Consider loading/saving fiveWhysAnswers from/to the note object if persistence is needed

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
          {/* ✅ 1. Panel Title */}
          <DialogTitle>Let’s move this toward clarity.</DialogTitle>
        </DialogHeader>

        <div className="p-4 bg-muted/30 rounded-md mb-4">
          <p>{note.text}</p>
        </div>

        {/* ✅ 2. Primary Action Prompt (Top of Panel) */}
        <div className="mb-4">
          <Label htmlFor="next-action-input" className="block text-md font-semibold mb-2">
            What’s one thing you can do next to move this forward?
          </Label>
          <div className="flex items-center gap-2">
            <Input
              id="next-action-input"
              value={newActionText}
              onChange={(e) => setNewActionText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddAction()}
              placeholder="Add a next step..."
              className="flex-1"
            />
            <Button onClick={handleAddAction} disabled={newActionText.trim() === ""}>
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>
        </div>

        {/* Existing Actions List */}
        <div className="space-y-2 mb-6 max-h-40 overflow-y-auto pr-2">
          {note.nextActions.length > 0 ? (
            note.nextActions.map((action) => (
              <div key={action.id} className="flex items-center gap-2 p-2 rounded-md bg-background">
                <Checkbox
                  id={action.id}
                  checked={action.completed}
                  onCheckedChange={() => onToggleAction(note.id, action.id)}
                />
                <Label htmlFor={action.id} className={cn("flex-1", action.completed ? "line-through text-muted-foreground" : "")}>
                  {action.text}
                </Label>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-2">No actions added yet.</p>
          )}
        </div>

        {/* Divider */}
        <hr className="my-6" />

        {/* ✅ 3. First Principles Insight Prompt */}
        <div className="mb-4 p-3 rounded-md bg-blue-50 border border-blue-100">
          <div className="flex items-center gap-2 font-semibold text-blue-800 mb-1 text-sm">
            <MessageSquareQuote className="h-4 w-4" />
            <span>Thought Starter:</span>
          </div>
          <p className="italic text-blue-700 text-sm">→ {currentQuestion}</p>
        </div>

        {/* ✅ 4. 5 Whys Expandable Panel */}
        <div className="border rounded-md overflow-hidden">
          {/* Trigger */}
          <button
            onClick={() => setIsFiveWhysExpanded(!isFiveWhysExpanded)}
            className="flex items-center justify-between w-full p-3 text-left bg-muted/50 hover:bg-muted/80 transition-colors"
          >
            <span className="font-medium text-sm flex items-center gap-2">
              🌀 Go deeper with the 5 Whys
            </span>
            {isFiveWhysExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>

          {/* Content (Conditional) */}
          {isFiveWhysExpanded && (
            <div className="p-4 border-t bg-background space-y-3">
              {[...Array(5)].map((_, index) => {
                const placeholderText =
                  index === 0
                    ? `Why is this bothering you?`
                    : `Why is that true? (${fiveWhysAnswers[index - 1]?.substring(0, 30) || "prev answer"}...)`
                const labelText =
                  index === 0
                    ? `Why is this bothering you?`
                    : index === 1
                      ? `Why is that true?`
                      : index === 2
                        ? `Why do you think that happens?`
                        : index === 3
                          ? `Why might that be a pattern?`
                          : `Why does that feel like the truth?`

                return (
                  <div key={index} className="space-y-1">
                    <Label htmlFor={`why-${index + 1}`} className="text-xs font-medium">
                      {index + 1}. {labelText}
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
              <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-md text-xs text-yellow-800 flex items-start gap-1.5">
                <Lightbulb className="h-3 w-3 mt-0.5 shrink-0" />
                <span>💡 Often the 5th Why is where your clarity is hiding.</span>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Optionally reset answers on cancel?
                    // setFiveWhysAnswers(Array(5).fill(""));
                    setIsFiveWhysExpanded(false)
                  }}
                >
                  <X className="h-4 w-4 mr-1" /> Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    console.log("Saving 5 Whys for note:", note.id, fiveWhysAnswers)
                    // TODO: Implement actual saving logic
                    setIsFiveWhysExpanded(false) // Collapse after save
                  }}
                >
                  <Save className="h-4 w-4 mr-1" /> Save
                </Button>
              </div>
            </div>
          )}
        </div>


        <DialogFooter className="mt-6 pt-4 border-t">
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

