import { create } from 'zustand'
import type { GameState, RoomSettings } from '../types'


type Store = {
settings: RoomSettings
state: GameState
order: string[]
scores: Record<string, number>
setSettings: (s: Partial<RoomSettings>) => void
setState: (s: Partial<GameState>) => void
setOrder: (o: string[]) => void
setScores: (s: Record<string, number>) => void
}


export const useGame = create<Store>(set => ({
settings: { language:'English', rounds:3, drawTime:80, hints:true, wordLength:0, customWords:[] },
state: { phase:'lobby', round:1, turnIndex:0 },
order: [],
scores: {},
setSettings: s => set(st => ({ settings: { ...st.settings, ...s } })),
setState: s => set(st => ({ state: { ...st.state, ...s } })),
setOrder: o => set({ order: o }),
setScores: s => set({ scores: s })
}))