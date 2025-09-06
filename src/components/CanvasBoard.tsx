import { useEffect, useRef, useState } from 'react'
}


function getPos(e: PointerEvent | React.PointerEvent) {
const rect = canvasRef.current!.getBoundingClientRect()
const x = (('clientX' in e ? e.clientX : 0) - rect.left)
const y = (('clientY' in e ? e.clientY : 0) - rect.top)
return { x, y }
}


function handleDown(e: React.PointerEvent) {
if (!isDrawer) return
;(e.target as Element).setPointerCapture(e.pointerId)
drawing.current = true
points.current = [ getPos(e) ]
}
function handleMove(e: React.PointerEvent) {
if (!isDrawer || !drawing.current) return
points.current.push(getPos(e))
const ctx = canvasRef.current!.getContext('2d')!
renderStroke(ctx, { id: '', points: points.current.slice(-2), color, size, tool })
}
function handleUp(e: React.PointerEvent) {
if (!isDrawer) return
drawing.current = false
if (points.current.length>1) {
const stroke: Stroke = { id: crypto.randomUUID(), points: points.current, color, size, tool }
setHistory(h => [...h, stroke])
onStroke(stroke)
}
points.current = []
}


function clearCanvas() {
const c = canvasRef.current!
const ctx = c.getContext('2d')!
ctx.clearRect(0,0,c.width,c.height)
setHistory([])
onClear()
}


function undoLast() {
const c = canvasRef.current!
const ctx = c.getContext('2d')!
ctx.clearRect(0,0,c.width,c.height)
const newHist = history.slice(0,-1)
setHistory(newHist)
newHist.forEach(s => renderStroke(ctx, s))
onUndo()
}


return (
<div className="w-full h-full flex flex-col gap-2">
<div className="flex items-center gap-2">
<input type="color" value={color} onChange={(e)=>setColor(e.target.value)} className="w-10 h-10 rounded" />
<input type="range" min={2} max={24} value={size} onChange={(e)=>setSize(parseInt(e.target.value))} />
<button className={`px-3 py-1 rounded ${tool==='pen'?'bg-indigo-600':'bg-slate-700'}`} onClick={()=>setTool('pen')}>Pen</button>
<button className={`px-3 py-1 rounded ${tool==='eraser'?'bg-indigo-600':'bg-slate-700'}`} onClick={()=>setTool('eraser')}>Eraser</button>
<button className="ml-auto px-3 py-1 bg-rose-600 rounded" onClick={clearCanvas}>Clear</button>
<button className="px-3 py-1 bg-slate-700 rounded" onClick={undoLast}>Undo</button>
</div>
<div className="flex-1 rounded-xl bg-white shadow-soft overflow-hidden">
<canvas
ref={canvasRef}
className="draw-canvas w-full h-full"
onPointerDown={handleDown}
onPointerMove={handleMove}
onPointerUp={handleUp}
onPointerCancel={handleUp}
/>
</div>
</div>
)
}