"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

interface Note {
  id: string
  text: string
  zone: "wwtf" | "wtf" | "clarity"
  nextActions: Array<{ id: string; text: string; completed: boolean }>
}

interface ZoneSummaryProps {
  notes: Note[]
  onToggleAction: (noteId: string, actionId: string) => void
}

export function ZoneSummary({ notes, onToggleAction }: ZoneSummaryProps) {
  const wwtfNotes = notes.filter((note) => note.zone === "wwtf")
  const wtfNotes = notes.filter((note) => note.zone === "wtf")
  const clarityNotes = notes.filter((note) => note.zone === "clarity")

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Summary</h2>

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium mb-2">WWTF ({wwtfNotes.length})</h3>
          <div className="space-y-2">
            {wwtfNotes.map((note) => (
              <div key={note.id} className="text-sm">
                <p className="font-medium">{note.text}</p>
                {note.nextActions.length > 0 && (
                  <div className="ml-4 mt-1 space-y-1">
                    {note.nextActions.map((action) => (
                      <div key={action.id} className="flex items-center gap-2">
                        <Checkbox
                          id={`summary-${action.id}`}
                          checked={action.completed}
                          onCheckedChange={() => onToggleAction(note.id, action.id)}
                          className="h-3 w-3"
                        />
                        <Label
                          htmlFor={`summary-${action.id}`}
                          className={`text-xs ${action.completed ? "line-through text-muted-foreground" : ""}`}
                        >
                          {action.text}
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="text-lg font-medium mb-2">WTF ({wtfNotes.length})</h3>
          <div className="space-y-2">
            {wtfNotes.map((note) => (
              <div key={note.id} className="text-sm">
                <p className="font-medium">{note.text}</p>
                {note.nextActions.length > 0 && (
                  <div className="ml-4 mt-1 space-y-1">
                    {note.nextActions.map((action) => (
                      <div key={action.id} className="flex items-center gap-2">
                        <Checkbox
                          id={`summary-${action.id}`}
                          checked={action.completed}
                          onCheckedChange={() => onToggleAction(note.id, action.id)}
                          className="h-3 w-3"
                        />
                        <Label
                          htmlFor={`summary-${action.id}`}
                          className={`text-xs ${action.completed ? "line-through text-muted-foreground" : ""}`}
                        >
                          {action.text}
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="text-lg font-medium mb-2">CLARITY ({clarityNotes.length})</h3>
          <div className="space-y-2">
            {clarityNotes.map((note) => (
              <div key={note.id} className="text-sm">
                <p className="font-medium">{note.text}</p>
                {note.nextActions.length > 0 && (
                  <div className="ml-4 mt-1 space-y-1">
                    {note.nextActions.map((action) => (
                      <div key={action.id} className="flex items-center gap-2">
                        <Checkbox
                          id={`summary-${action.id}`}
                          checked={action.completed}
                          onCheckedChange={() => onToggleAction(note.id, action.id)}
                          className="h-3 w-3"
                        />
                        <Label
                          htmlFor={`summary-${action.id}`}
                          className={`text-xs ${action.completed ? "line-through text-muted-foreground" : ""}`}
                        >
                          {action.text}
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

