import { useEffect, useRef, useState } from 'react'
import CanvasBoard from './CanvasBoard'
import Chat from './Chat'
import WordPicker from './WordPicker'
import { useGame } from '../store/game'
import type { Player, RoomSettings, Stroke } from '../types'

function maskWord(word: string, revealed: number[] = []) {
  return word
    .split('')
    .map((ch, i) =>
      ch === ' ' || !/[a-z]/i.test(ch) ? ch : revealed.includes(i) ? ch : '_'
    )
    .join('')
}

function revealRandom(currentMask: string, word: string) {
  const unrevealed: number[] = []
  for (let i = 0; i < word.length; i++) {
    const isLetter = /[a-z]/i.test(word[i])
    if (isLetter && currentMask[i] === '_') unrevealed.push(i)
  }
  if (unrevealed.length === 0) return currentMask
  const pick = unrevealed[Math.floor(Math.random() * unrevealed.length)]
  const arr = currentMask.split('')
  arr[pick] = word[pick]
  return arr.join('')
}

function calcPoints(elapsed: number, total: number, rank: number) {
  const timeFactor = Math.max(0.25, (total - elapsed) / total) // 0.25..1
  const base = Math.floor(200 * timeFactor)
  const bonus = rank === 1 ? 50 : rank === 2 ? 30 : rank === 3 ? 10 : 0
  return base + bonus
}

export default function Game({
  roomCode,
  me,
  players,
  isOwner,
  send,
  onEvent,
}: {
  roomCode: string
  me: Player
  players: Player[]
  isOwner: boolean
  send: (evt: any) => Promise<void> | void
  onEvent: (type: string, handler: any) => void
}) {
  const { settings, state, setState, scores, setScores } = useGame()
  const [feed, setFeed] = useState<any[]>([])
  const [strokes, setStrokes] = useState<Stroke[]>([])
  const [wordOptions, setWordOptions] = useState<string[]>([])
  const [secret, setSecret] = useState<string>('')

  const guessedSet = useRef<Set<string>>(new Set())
  const guessRank = useRef<number>(0)
  const [startTs, setStartTs] = useState<number>(Date.now())

  const order = players.map((p) => p.id)
  const turnIndex = state.turnIndex % (order.length || 1)
  const currentDrawerId = order[turnIndex]

  // Host: timer + hints tick
  useEffect(() => {
    if (!isOwner || state.phase !== 'drawing') return
    const tick = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTs) / 1000)
      const left = Math.max(0, settings.drawTime - elapsed)
      setState({ timeLeft: left })
      if (settings.hints) {
        const half = Math.floor(settings.drawTime * 0.5)
        const quarter = Math.floor(settings.drawTime * 0.25)
        if (left === half || left === quarter) {
          const masked = revealRandom(state.maskedWord || '', secret)
          setState({ maskedWord: masked })
          send({ type: 'HINT', payload: { masked } })
        }
      }
      if (left <= 0) reveal()
    }, 1000)
    return () => clearInterval(tick)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOwner, state.phase, startTs, settings.drawTime, settings.hints, secret, state.maskedWord])

  // Host: start a turn (pick word options)
  function startTurn() {
    if (!isOwner) return
    guessedSet.current = new Set()
    guessRank.current = 0
    setStrokes([])
    const words = (onEvent('GET_WORDS', { count: 3 }) ?? []) as string[]
    setWordOptions(words)
    setState({ phase: 'choosing', drawerId: currentDrawerId })
    send({ type: 'WORD_PICK', payload: { options: words, drawerId: currentDrawerId } })
  }

  function chooseWord(w: string) {
    const masked = maskWord(w)
    setSecret(w)
    setState({ phase: 'drawing', maskedWord: masked })
    setStartTs(Date.now())
    send({ type: 'CHOICE_SET', payload: { masked, wordLen: w.length } })
    setFeed((f) => [
      ...f,
      { id: 'sys', text: `Someone is drawing now!`, ts: Date.now(), system: true },
    ])
  }

  function reveal() {
    if (!isOwner) return
    setState({ phase: 'reveal' })
    send({ type: 'REVEAL', payload: { word: secret } })
    setFeed((f) => [
      ...f,
      { id: 'sys', text: `The word was "${secret}".`, ts: Date.now(), system: true },
    ])
    setTimeout(() => {
      const nextIndex = state.turnIndex + 1
      const nextRound = nextIndex % players.length === 0 ? state.round + 1 : state.round
      if (nextRound > settings.rounds) {
        setState({ phase: 'end' })
        send({ type: 'END', payload: {} })
      } else {
        setState({ turnIndex: nextIndex, round: nextRound, phase: 'choosing' })
        startTurn()
      }
    }, 3000)
  }

  // Register listeners for incoming realtime events
  useEffect(() => {
    onEvent('WORD_PICK', (p: any) => {
      setWordOptions(p.options)
      setState({ phase: 'choosing', drawerId: p.drawerId })
    })
    onEvent('CHOICE_SET', (p: any) => {
      setState({ phase: 'drawing', maskedWord: p.masked })
      setStartTs(Date.now())
      setFeed((f) => [
        ...f,
        {
          id: 'sys',
          text: `Someone is drawing now!`,
          ts: Date.now(),
          system: true,
        },
      ])
    })
    onEvent('HINT', (p: any) => setState({ maskedWord: p.masked }))
    onEvent('REVEAL', (p: any) => {
      setState({ phase: 'reveal' })
      setFeed((f) => [
        ...f,
        { id: 'sys', text: `The word was "${p.word}".`, ts: Date.now(), system: true },
      ])
    })
    onEvent('END', () => setState({ phase: 'end' }))
    onEvent('STROKE', (s: any) => setStrokes((st) => [...st, s]))
    onEvent('CLEAR', () => setStrokes([]))
    onEvent('CHAT', (m: any) =>
      setFeed((f) => [...f, { id: m.id, name: m.name, text: m.text, ts: m.ts }]),
    )
    onEvent('CORRECT', (m: any) => {
      setFeed((f) => [
        ...f,
        {
          id: m.playerId,
          name: players.find((p) => p.id === m.playerId)?.name || 'Player',
          text: 'guessed the word!',
          ts: Date.now(),
          system: true,
          tint: 'text-emerald-400',
        },
      ])
      setScores({ ...scores, [m.playerId]: (scores[m.playerId] || 0) + m.points })
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onEvent, players, scores, setScores, setState])

  // Host validates guesses
  function onGuess(text: string) {
    send({ type: 'CHAT', payload: { id: me.id, name: me.name, text, ts: Date.now() } })
    if (!isOwner || state.phase !== 'drawing' || me.id === currentDrawerId) return
    if (guessedSet.current.has(me.id)) return
    const clean = text.trim().toLowerCase()
    const ok = clean === secret.toLowerCase()
    if (ok) {
      guessedSet.current.add(me.id)
      const elapsed = Math.floor((Date.now() - startTs) / 1000)
      const rank = Array.from(guessedSet.current).length
      const points = calcPoints(elapsed, settings.drawTime, rank)
      send({ type: 'CORRECT', payload: { playerId: me.id, points, rank } })
      setScores({ ...scores, [me.id]: (scores[me.id] || 0) + points })
      if (guessedSet.current.size === players.length - 1) reveal()
    }
  }

  function sendStroke(s: Stroke) {
    send({ type: 'STROKE', payload: s })
  }

  return (
    <div className="grid lg:grid-cols-[1fr_380px] gap-4 h-full">
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm text-slate-300">Round {state.round}/{settings.rounds}</div>
          <div className="text-xl font-semibold">
            {state.phase === 'drawing'
              ? state.maskedWord
              : state.phase === 'choosing'
              ? 'Pick a word'
              : ''}
          </div>
          <div className="text-sm text-slate-300">
            {state.phase === 'drawing' ? `${state.timeLeft ?? settings.drawTime}s` : ''}
          </div>
        </div>

        {state.phase === 'choosing' && me.id === currentDrawerId && wordOptions.length > 0 && (
          <WordPicker options={wordOptions} onPick={chooseWord} />
        )}

        <div className="flex-1 min-h-0">
          <CanvasBoard
            isDrawer={me.id === currentDrawerId && state.phase === 'drawing'}
            incoming={strokes}
            onStroke={sendStroke}
            onClear={() => send({ type: 'CLEAR', payload: {} })}
            onUndo={() => send({ type: 'UNDO', payload: {} })}
          />
        </div>
      </div>

      <div className="flex flex-col h-full">
        <div className="bg-slate-800 rounded-xl p-3 shadow-soft">
          <div className="font-semibold mb-2">Players</div>
          <div className="space-y-2">
            {players.map((p) => (
              <div
                key={p.id}
                className={`flex items-center justify-between ${
                  p.id === currentDrawerId ? 'bg-slate-700' : ''
                } rounded px-2 py-1`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ background: `hsl(${p.avatarHue} 70% 50%)` }}
                  />
                  <div className="truncate">
                    {p.name}
                    {p.id === currentDrawerId ? ' ✏️' : ''}
                    {p.isOwner ? ' 👑' : ''}
                  </div>
                </div>
                <div className="text-right">{scores[p.id] || 0}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 min-h-0 mt-3">
          <Chat meId={me.id} feed={feed as any} onSend={onGuess} />
        </div>

        {isOwner && state.phase === 'lobby' && (
          <button className="mt-3 px-3 py-2 rounded bg-emerald-600" onClick={startTurn}>
            Start Turn
          </button>
        )}
      </div>
    </div>
  )
}
