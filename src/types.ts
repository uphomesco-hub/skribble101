export type RoomSettings = {
language: 'English',
rounds: number,
drawTime: number,
hints: boolean,
wordLength: 3 | 4 | 5 | 6 | 7 | 8 | 0,
customWords: string[]
}
export type Player = { id:string; name:string; avatarHue:number; score:number; guessed:boolean; isOwner?:boolean; joinedAt:number }
export type Stroke = { id:string; points:{x:number,y:number}[]; color:string; size:number; tool:'pen'|'eraser' }
export type GamePhase = 'lobby'|'choosing'|'drawing'|'reveal'|'end'
export type GameState = { phase:GamePhase; round:number; turnIndex:number; drawerId?:string; maskedWord?:string; timeLeft?:number; everyoneGuessed?:boolean }
export type ChannelEvent =
| { type:'CHAT'; payload:{ id:string; name:string; text:string; ts:number } }
| { type:'STROKE'; payload:Stroke }
| { type:'CLEAR' }
| { type:'UNDO' }
| { type:'STATE'; payload:{ state:GameState; scores:Record<string,number> } }
| { type:'START'; payload:{ settings:RoomSettings; order:string[]; wordlist?:string[] } }
| { type:'WORD_PICK'; payload:{ options:string[]; drawerId:string } }
| { type:'CHOICE_SET'; payload:{ masked:string; wordLen:number } }
| { type:'HINT'; payload:{ masked:string } }
| { type:'CORRECT'; payload:{ playerId:string; points:number; rank:number } }
| { type:'REVEAL'; payload:{ word:string } }
| { type:'END' }