"use client"

import type React from "react"

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface CircleZoneProps {
  title: string
  children: ReactNode
  onDropNote: (noteId: string, zone: "wwtf" | "wtf" | "clarity") => void
}

export function CircleZone({ title, children, onDropNote }: CircleZoneProps) {
  // Correctly map display title back to internal zone ID
  const getZoneId = (displayTitle: string): "wwtf" | "wtf" | "clarity" => {
    switch (displayTitle) {
      case "Oh, WTF?!": return "wwtf";
      case "Hmm, WTF…": return "wtf";
      case "Ah, got it!": return "clarity";
      default:
        console.warn(`Unknown CircleZone title: ${displayTitle}, defaulting to wwtf`);
        return "wwtf"; // Fallback, though should ideally not happen
    }
  }
  const zone = getZoneId(title);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const noteId = e.dataTransfer.getData("noteId")
    if (noteId) {
      onDropNote(noteId, zone)
    }
  }

  return (
    <div className="flex flex-col h-full" onDragOver={handleDragOver} onDrop={handleDrop}>
      <div className="text-center font-medium text-lg mb-2">{title}</div>
      <div
        className={cn(
          "flex-1 rounded-full border-2 border-dashed flex items-center justify-center p-4 overflow-auto",
          "bg-background/50 hover:bg-background/80 transition-colors",
        )}
      >
        <div className="w-full h-full overflow-auto">{children}</div>
      </div>
    </div>
  )
}

