import { useEffect, useRef, useState } from 'react'
onEvent('STROKE', (s:any)=> setStrokes(st=>[...st, s]))
onEvent('CLEAR', ()=> setStrokes([]))
onEvent('CHAT', (m:any)=> setFeed(f=>[...f, { id:m.id, name:m.name, text:m.text, ts:m.ts }]))
onEvent('CORRECT', (m:any)=>{ setFeed(f=>[...f, { id:m.playerId, name: players.find(p=>p.id===m.playerId)?.name || 'Player', text:'guessed the word!', ts:Date.now(), system:true, tint:'text-emerald-400' }]); setScores({ ...scores, [m.playerId]: (scores[m.playerId]||0) + m.points }) })
}, [onEvent, players, currentDrawerId, scores, setScores, setState])


// Host validates guesses
function onGuess(text:string){
send({ type:'CHAT', payload:{ id:me.id, name:me.name, text, ts:Date.now() } })
if (!isOwner || state.phase!=='drawing' || me.id===currentDrawerId) return
if (guessedSet.current.has(me.id)) return
const clean = text.trim().toLowerCase()
const ok = clean === secret.toLowerCase()
if (ok){
guessedSet.current.add(me.id)
const elapsed = Math.floor((Date.now()-startTs)/1000)
const rank = (Array.from(guessedSet.current).length)
const points = calcPoints(elapsed, settings.drawTime, rank)
send({ type:'CORRECT', payload:{ playerId: me.id, points, rank } })
setScores({ ...scores, [me.id]: (scores[me.id]||0) + points })
if (guessedSet.current.size === players.length - 1) reveal()
}
}


function sendStroke(s:Stroke){ send({ type:'STROKE', payload: s }) }


return (
<div className="grid lg:grid-cols-[1fr_380px] gap-4 h-full">
<div className="flex flex-col h-full">
<div className="flex items-center justify-between mb-2">
<div className="text-sm text-slate-300">Round {state.round}/{settings.rounds}</div>
<div className="text-xl font-semibold">
{state.phase==='drawing' ? state.maskedWord : (state.phase==='choosing' ? 'Pick a word' : '')}
</div>
<div className="text-sm text-slate-300">{state.phase==='drawing' ? `${state.timeLeft ?? settings.drawTime}s` : ''}</div>
</div>
{state.phase==='choosing' && me.id===currentDrawerId && wordOptions.length>0 && (
<WordPicker options={wordOptions} onPick={chooseWord}/>
)}
<div className="flex-1 min-h-0">
<CanvasBoard
isDrawer={me.id===currentDrawerId && state.phase==='drawing'}
incoming={strokes}
onStroke={sendStroke}
onClear={()=>send({ type:'CLEAR', payload:{} })}
onUndo={()=>send({ type:'UNDO', payload:{} })}
/>
</div>
</div>
<div className="flex flex-col h-full">
<div className="bg-slate-800 rounded-xl p-3 shadow-soft">
<div className="font-semibold mb-2">Players</div>
<div className="space-y-2">
{players.map(p=> (
<div key={p.id} className={`flex items-center justify-between ${p.id===currentDrawerId?'bg-slate-700':''} rounded px-2 py-1`}>
<div className="flex items-center gap-2">
<div className="w-3 h-3 rounded-full" style={{background:`hsl(${p.avatarHue} 70% 50%)`}}/>
<div className="truncate">{p.name}{p.id===currentDrawerId?' ✏️':''}{p.isOwner?' 👑':''}</div>
</div>
<div className="text-right">{scores[p.id]||0}</div>
</div>
))}
</div>
</div>
<div className="flex-1 min-h-0 mt-3">
<Chat meId={me.id} feed={feed as any} onSend={onGuess}/>
</div>
{isOwner && state.phase==='lobby' && (
<button className="mt-3 px-3 py-2 rounded bg-emerald-600" onClick={startTurn}>Start Turn</button>
)}
</div>
</div>
)
}