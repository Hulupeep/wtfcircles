"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Note } from "@/lib/types"

export function useRealtimeSync(
  boardId: string,
  notes: Note[], // Keep notes for debounced save
  setNotes: (notes: Note[]) => void,
  // lastUpdateTimeRef removed
) {
  // State for debounced save
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSyncedAt, setLastSyncedAt] = useState<Date>(new Date()) // Keep for debounced save logic
  const [error, setError] = useState<string | null>(null)

  // Subscribe to real-time changes
  // Effect for setting up the Supabase subscription
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
          .on( // Listener for Database Changes
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "boards",
              filter: `id=eq.${boardId}`,
            },
            (payload) => {
              // --- SIMPLIFIED: Always apply the update ---
              const incomingNotes = payload.new.content || []
              // console.log("[RealtimeSync] Received DB update event, applying state."); // Removed log
              setNotes(incomingNotes)
              // --- End Simplified ---
            }
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
  // Re-subscribe ONLY when boardId changes.
  }, [boardId, setNotes]) // Simplified dependencies

  // Function to save changes for debounced updates
  const saveChanges = async () => {
    // Only save if we have a boardId and it's not a demo board
    if (!boardId || boardId.startsWith("demo-") || notes.length === 0) return

    // No need to check movingNoteId here, debounced effect handles timing

    setIsSyncing(true)
    setError(null)

    try {
      const now = new Date()
      console.log("Debounced save running...");
      const { error } = await supabase
        .from("boards")
        .update({
          content: notes, // Use notes state passed into the hook
          updated_at: now.toISOString(),
        })
        .eq("id", boardId)

      if (error) throw error

      setLastSyncedAt(now)
    } catch (err) {
      console.error("Error in debounced save:", err)
      setError("Failed to save changes")
    } finally {
      setIsSyncing(false)
    }
  }

  // Debounced save effect (simplified dependencies)
  useEffect(() => {
    // Only save if we have a boardId and it's not a demo board
    if (!boardId || boardId.startsWith("demo-")) return

    const timer = setTimeout(() => {
      // Check isSyncing again *before* saving
      if (!isSyncing) {
         saveChanges()
      } else {
         console.log("Debounced save skipped: Sync already in progress.");
      }
    }, 1500) // Slightly longer debounce

    return () => clearTimeout(timer)
  }, [notes, boardId, saveChanges, isSyncing])

  // Return only the error state, as sync state is internal
  return { error }
}

