"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface Note {
  id: string
  text: string
  zone: "wwtf" | "wtf" | "clarity"
  nextActions: Array<{ id: string; text: string; completed: boolean }>
}

interface StickyNoteProps {
  note: Note
  onDoubleClick: (noteId: string) => void
}

export function StickyNote({ note, onDoubleClick }: StickyNoteProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("noteId", note.id)
    setIsDragging(true)
  }

  const handleDragEnd = () => {
    setIsDragging(false)
  }

  const getZoneColor = () => {
    switch (note.zone) {
      case "wwtf":
        return "bg-sky-100 hover:bg-sky-200"
      case "wtf":
        return "bg-amber-100 hover:bg-amber-200"
      case "clarity":
        return "bg-green-100 hover:bg-green-200"
      default:
        return "bg-slate-100 hover:bg-slate-200"
    }
  }

  return (
    <Card
      className={cn(
        "w-full max-w-[200px] cursor-move shadow-sm transition-all",
        getZoneColor(),
        isDragging && "opacity-50",
        note.nextActions.length > 0 && "ring-1 ring-primary",
      )}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDoubleClick={() => onDoubleClick(note.id)}
    >
      <CardContent className="p-3 text-sm">
        <div className="flex items-start gap-1">
          {note.nextActions.length > 0 && <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />}
          <p>{note.text}</p>
        </div>
      </CardContent>
    </Card>
  )
}

