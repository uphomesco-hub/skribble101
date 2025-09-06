import { useEffect, useState } from 'react'
const { settings, setSettings } = useGame()
const [custom, setCustom] = useState('')


useEffect(()=>{
const words = custom.split(',').map(w=>w.trim()).filter(Boolean)
setSettings({ customWords: words })
}, [custom])


const maxPlayers = 12
const canStart = isOwner && players.length>=2


return (
<div className="grid md:grid-cols-2 gap-6">
<div className="bg-slate-800 rounded-xl p-4 shadow-soft">
<h2 className="text-xl mb-3 font-semibold">Room Settings</h2>
<div className="space-y-3">
<div className="flex items-center justify-between">
<label>Rounds</label>
<input type="number" min={1} max={10} value={settings.rounds}
onChange={(e)=>setSettings({ rounds: parseInt(e.target.value||'1') })}
className="w-24 text-center px-2 py-1 rounded bg-slate-700" />
</div>
<div className="flex items-center justify-between">
<label>Draw time (seconds)</label>
<input type="number" min={30} max={180} value={settings.drawTime}
onChange={(e)=>setSettings({ drawTime: parseInt(e.target.value||'80') })}
className="w-24 text-center px-2 py-1 rounded bg-slate-700" />
</div>
<div className="flex items-center justify-between">
<label>Word length</label>
<select value={settings.wordLength} onChange={(e)=>setSettings({ wordLength: parseInt(e.target.value) as any })}
className="w-28 px-2 py-1 rounded bg-slate-700">
<option value={0}>Any</option>
<option value={3}>3</option>
<option value={4}>4</option>
<option value={5}>5</option>
<option value={6}>6</option>
<option value={7}>7</option>
<option value={8}>8</option>
</select>
</div>
<div className="flex items-center justify-between">
<label>Hints</label>
<input type="checkbox" checked={settings.hints} onChange={(e)=>setSettings({ hints: e.target.checked })} />
</div>
<div>
<label className="block mb-1">Custom words (comma separated)</label>
<textarea value={custom} onChange={(e)=>setCustom(e.target.value)} placeholder="e.g., jalebi, pune, cricket, chai"
className="w-full h-24 rounded bg-slate-700 p-2"/>
<p className="text-xs text-slate-400 mt-1">We’ll mix these with the default word list.</p>
</div>
</div>
</div>


<div className="bg-slate-800 rounded-xl p-4 shadow-soft">
<h2 className="text-xl mb-3 font-semibold">Players</h2>
<div className="grid grid-cols-2 md:grid-cols-3 gap-3">
{players.map(p=> (
<div key={p.id} className="flex items-center gap-2 bg-slate-700 rounded p-2">
<div className="w-8 h-8 rounded-full shrink-0" style={{background:`hsl(${p.avatarHue} 70% 50%)`}} />
<div className="truncate">{p.name}{p.isOwner ? ' 👑':''}</div>
</div>
))}
</div>
<p className="text-sm text-slate-400 mt-2">{players.length} / {maxPlayers} players</p>
<div className="mt-4">
<button disabled={!canStart}
onClick={()=>{
const order = players.map(p=>p.id)
const words = [...require('../lib/wordlists').EN_WORDS, ...settings.customWords]
onStart(settings, order, words)
}}
className={`px-4 py-2 rounded ${canStart?'bg-emerald-600 hover:bg-emerald-500':'bg-slate-600 cursor-not-allowed'}`}>
Start Game
</button>
</div>
</div>
</div>
)
}