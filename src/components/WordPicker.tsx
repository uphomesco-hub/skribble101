export default function WordPicker({ options, onPick }:{ options:string[], onPick:(w:string)=>void }){
return (
<div className="p-4 bg-slate-800 rounded-xl shadow-soft">
<p className="text-slate-300 mb-2">Choose a word to draw:</p>
<div className="grid grid-cols-3 gap-2">
{options.map(w=> (
<button key={w} onClick={()=>onPick(w)} className="px-3 py-2 rounded bg-slate-700 hover:bg-indigo-600">{w}</button>
))}
</div>
</div>
)
}