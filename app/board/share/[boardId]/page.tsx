"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"

export default function SharedBoardPage() {
  const params = useParams()
  const router = useRouter()
  const boardId = params.boardId as string
  const [isLoading, setIsLoading] = useState(true)
  const [boardExists, setBoardExists] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function checkBoardAccess() {
      setIsLoading(true)
      try {
        // Check if the board exists and is shared
        const { data, error } = await supabase.from("boards").select("id, shared, title").eq("id", boardId).single()

        if (error) throw error

        if (!data || !data.shared) {
          setBoardExists(false)
          setError("This board doesn't exist or is not shared")
          return
        }

        setBoardExists(true)

        // Redirect to the main page with a query param to indicate we're viewing a shared board
        router.push(`/?shared=${boardId}`)
      } catch (error) {
        console.error("Error checking board access:", error)
        setBoardExists(false)
        setError("Failed to check board access")
      } finally {
        setIsLoading(false)
      }
    }

    if (boardId) {
      checkBoardAccess()
    }
  }, [boardId, router])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading shared board...</p>
      </div>
    )
  }

  if (!boardExists) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">Board Not Found</h1>
        <p className="text-muted-foreground mb-6">{error || "This board doesn't exist or is no longer shared."}</p>
        <Button onClick={() => router.push("/")}>Go to Home</Button>
      </div>
    )
  }

  // This should never render as we redirect in the useEffect
  return null
}

