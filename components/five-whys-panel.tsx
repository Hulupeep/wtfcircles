"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronRight, Save, X } from "lucide-react"
import { FiveWhysData, createEmptyFiveWhys } from "@/lib/prompt-utils"

interface FiveWhysPanelProps {
  initialData?: FiveWhysData
  onSave: (data: FiveWhysData) => void
  onCancel?: () => void
}

export function FiveWhysPanel({ initialData, onSave, onCancel }: FiveWhysPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [data, setData] = useState<FiveWhysData>(initialData || createEmptyFiveWhys())

  const handleInputChange = (field: keyof FiveWhysData, value: string) => {
    setData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = () => {
    onSave(data)
    setIsOpen(false)
  }

  const handleCancel = () => {
    if (initialData) {
      setData(initialData)
    } else {
      setData(createEmptyFiveWhys())
    }
    setIsOpen(false)
    onCancel?.()
  }

  const whyQuestions = [
    { key: "why1" as const, question: "Why is this bothering you?" },
    { key: "why2" as const, question: "Why is that true?" },
    { key: "why3" as const, question: "Why do you think that happens?" },
    { key: "why4" as const, question: "Why might that be a pattern?" },
    { key: "why5" as const, question: "Why does that feel like the truth?" }
  ]

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button 
          variant="ghost" 
          className="w-full justify-start p-0 h-auto text-left font-normal hover:bg-transparent"
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            {isOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            <span className="text-lg">🌀</span>
            <span>Go deeper with the 5 Whys</span>
          </div>
        </Button>
      </CollapsibleTrigger>
      
      <CollapsibleContent className="mt-4">
        <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-4 space-y-4 bg-muted/20">
          <div className="space-y-4">
            {whyQuestions.map((item, index) => (
              <div key={item.key} className="space-y-2">
                <Label htmlFor={item.key} className="text-sm font-medium">
                  {index + 1}. {item.question}
                </Label>
                <Input
                  id={item.key}
                  value={data[item.key]}
                  onChange={(e) => handleInputChange(item.key, e.target.value)}
                  placeholder="Your response..."
                  className="w-full"
                />
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-muted-foreground/20">
            <p className="text-xs text-muted-foreground mb-4 flex items-center gap-1">
              <span>💡</span>
              <span>Often the 5th Why is where your clarity is hiding.</span>
            </p>
            
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                className="flex items-center gap-1"
              >
                <X className="h-3 w-3" />
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                className="flex items-center gap-1"
              >
                <Save className="h-3 w-3" />
                Save
              </Button>
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}