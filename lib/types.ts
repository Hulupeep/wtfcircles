import { FiveWhysData } from "./prompt-utils"

export type Zone = "wwtf" | "wtf" | "clarity"

export interface Action {
  id: string
  text: string
  completed: boolean
}

export interface Note {
  id: string
  text: string
  zone: Zone
  nextActions: Action[]
  fiveWhys?: FiveWhysData
}

export interface Board {
  id: string
  title: string
  isShared?: boolean
  ownerId?: string
  user_id?: string
}