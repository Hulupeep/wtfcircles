"use client"

import React, { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
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
  isHighlighted: boolean
  clearHighlight: () => void
}

export function StickyNote({ note, onDoubleClick, isHighlighted, clearHighlight }: StickyNoteProps) {
  // console.log(`[StickyNote] Rendering note ID: ${note.id}, Zone: ${note.zone}`); // Removed log
  const [isDragging, setIsDragging] = useState(false)
  const [showClickMePrompt, setShowClickMePrompt] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const promptTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("noteId", note.id)
    setIsDragging(true)
  }

  const handleDragEnd = () => {
    setIsDragging(false)
  }

  // Effect for handling the highlight and prompt
  useEffect(() => {
    // Clear previous timeouts if props change
    if (promptTimeoutRef.current) clearTimeout(promptTimeoutRef.current)
    if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current)

    if (isHighlighted) {
      setShowClickMePrompt(true)
      setIsAnimating(true)

      // Remove animation after 2.5 seconds
      animationTimeoutRef.current = setTimeout(() => {
        setIsAnimating(false)
      }, 2500)

      // Hide prompt and clear highlight state after 10 seconds
      promptTimeoutRef.current = setTimeout(() => {
        setShowClickMePrompt(false)
        clearHighlight() // Clear the highlight state in the parent
      }, 10000)
    } else {
      // Ensure prompt is hidden if not highlighted
      setShowClickMePrompt(false)
      setIsAnimating(false)
    }

    // Cleanup function to clear timeouts on unmount or re-render
    return () => {
      if (promptTimeoutRef.current) clearTimeout(promptTimeoutRef.current)
      if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current)
    }
  }, [isHighlighted, clearHighlight])

  const handleClick = () => {
    if (showClickMePrompt) {
      setShowClickMePrompt(false)
      clearHighlight()
      if (promptTimeoutRef.current) clearTimeout(promptTimeoutRef.current)
      if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current)
      setIsAnimating(false) // Stop animation immediately on click
    }
    // Note: Double click is handled by onDoubleClick prop
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
    <TooltipProvider delayDuration={100}>
      <Tooltip open={showClickMePrompt}>
        <TooltipTrigger asChild>
          <Card
            className={cn(
              "w-full max-w-[200px] cursor-move shadow-sm transition-all relative", // Added relative positioning
              getZoneColor(),
              isDragging && "opacity-50",
              note.nextActions.length > 0 && "ring-1 ring-primary",
              isAnimating && "animate-bounce-short", // Apply animation class
            )}
            draggable
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDoubleClick={() => onDoubleClick(note.id)}
            onClick={handleClick} // Handle click to dismiss prompt
          >
            <CardContent className="p-3 text-sm">
              <div className="flex items-start gap-1">
                {note.nextActions.length > 0 && <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />}
                <p>{note.text}</p>
              </div>
            </CardContent>
          </Card>
        </TooltipTrigger>
        <TooltipContent side="top" align="center">
          <p>Click me! Click me!</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

