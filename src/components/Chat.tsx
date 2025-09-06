import { useEffect, useRef, useState } from 'react'


type Msg = { id:string; name:string; text:string; ts:number; system?:boolean; tint?:string }


export default function Chat({ meId, onSend, feed }:{ meId:string, onSend:(text:string)=>void, feed:Msg[] }){
const [text,setText]=useState('')
const ref = useRef<HTMLDivElement|null>(null)
useEffect(()=>{ ref.current?.scrollTo({top:ref.current.scrollHeight, behavior:'smooth'}) },[feed.length])


function submit(e:React.FormEvent){ e.preventDefault(); const t=text.trim(); if(!t) return; onSend(t); setText('') }


return (
<div className="h-full flex flex-col">
<div ref={ref} className="flex-1 overflow-y-auto space-y-1 p-2 bg-slate-800/60 rounded">
{feed.map(m=> (
<div key={m.ts+Math.random()} className={`text-sm ${m.system?'text-slate-300 italic':''}`}>
{!m.system && <span className="text-slate-400 mr-2">{m.name}:</span>}
<span className={m.tint||''}>{m.text}</span>
</div>
))}
</div>
<form onSubmit={submit} className="mt-2 flex gap-2">
<input value={text} onChange={(e)=>setText(e.target.value)} placeholder="Type your guess here..."
className="flex-1 px-3 py-2 rounded bg-slate-800 border border-slate-700 outline-none" />
<button className="px-3 py-2 rounded bg-indigo-600 hover:bg-indigo-500">Send</button>
</form>
</div>
)
}