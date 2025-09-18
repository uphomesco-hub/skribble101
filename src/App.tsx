import { useEffect, useRef, useState } from 'react'
import Lobby from './components/Lobby'
import Game from './components/Game'
import { nanoid } from 'nanoid'
import { useRoomChannel } from './hooks/useRoomChannel'
import { useGame } from './store/game'
import type { Player, RoomSettings } from './types'
import { EN_WORDS } from './lib/wordlists'

function randomName() {
  const animals = [
    'Tiger','Panda','Falcon','Cobra','Otter','Wolf','Fox','Koala',
    'Yak','Camel','Lynx','Eagle','Bison','Dodo','Raven'
  ]
  return animals[Math.floor(Math.random() * animals.length)] +
    '-' +
    Math.floor(100 + Math.random() * 900)
}

export default function App() {
  const [room, setRoom] = useState<string>(() => new URLSearchParams(location.search).get('room') || '')
  const [name, setName] = useState<string>(() => localStorage.getItem('name') || randomName())
  const [me] = useState<Player>(() => ({
    id: localStorage.getItem('uid') || nanoid(),
    name,
    avatarHue: Math.floor(Math.random() * 360),
    score: 0,
    guessed: false,
    joinedAt: Date.now(),
  }))
  const [isOwner, setIsOwner] = useState(false)
  const [wordlist, setWordlist] = useState<string[]>(EN_WORDS)
  const { settings, setSettings, setState, setOrder, setScores, state } = useGame()

  useEffect(() => {
    localStorage.setItem('uid', me.id)
  }, [me.id])

  const { channel, players, send, on } = useRoomChannel(room || 'lobby', { ...me, name })

  useEffect(() => {
    const sorted = [...players].sort((a, b) => a.joinedAt - b.joinedAt)
    setIsOwner(Boolean(sorted.length && sorted[0].id === me.id))
  }, [players, me.id])

  useEffect(() => {
    on('START', (p: any) => {
      setSettings(p.settings)
      setOrder(p.order)
      setScores(Object.fromEntries(p.order.map((id: string) => [id, 0])))
      setWordlist(p.wordlist || EN_WORDS)
      setState({ phase: 'choosing', round: 1, turnIndex: 0 })
    })
  }, [on, setSettings, setState, setOrder, setScores])

  function createRoom() {
    const code = Math.random().toString(36).slice(2, 7).toUpperCase()
    setRoom(code)
    const url = new URL(location.href)
    url.searchParams.set('room', code)
    history.replaceState(null, '', url.toString())
  }

  function joinRoom() {
    if (!room) return
    const url = new URL(location.href)
    url.searchParams.set('room', room)
    history.replaceState(null, '', url.toString())
  }

  const events = useRef(new Map<string, any>())
  function onEvent(type: string, handler: any) {
    if (typeof handler === 'function') events.current.set(type, handler)
    else return events.current.get(type)?.(handler)
  }

  onEvent('GET_WORDS', ({ count }: { count: number }) => {
    const all = [...wordlist]
    const len = settings.wordLength
    const pool = len ? all.filter(w => w.replace(/[^a-z]/ig, '').length === len) : all
    const picks: string[] = []
    while (picks.length < count && pool.length > 0) {
      const idx = Math.floor(Math.random() * pool.length)
      picks.push(pool.splice(idx, 1)[0])
    }
    return picks
  })

  function startGame(s: RoomSettings, order: string[], wl: string[]) {
    setSettings(s)
    setOrder(order)
    setScores(Object.fromEntries(order.map(id => [id, 0])))
    setWordlist(wl)
    setState({ phase: 'choosing', round: 1, turnIndex: 0 })
    send({ type: 'START', payload: { settings: s, order, wordlist: wl } })
  }

  const canPlay = !!room && players.length > 0

  return (
    <div className="h-full max-w-6xl mx-auto p-3 md:p-6">
      <header className="flex items-center gap-2 mb-4">
        <img src="/favicon.svg" className="w-8 h-8" />
        <h1 className="text-2xl font-bold">Skribble WE</h1>
        <div className="ml-auto text-slate-400 text-sm">Room: {room || '—'}</div>
      </header>

      {!room && (
        <div className="bg-slate-800 rounded-xl p-4 shadow-soft space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <input
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                localStorage.setItem('name', e.target.value)
              }}
              className="flex-1 px-3 py-2 rounded bg-slate-700"
              placeholder="Your name"
            />
            <input
              value={room}
              onChange={(e) => setRoom(e.target.value.toUpperCase())}
              className="flex-1 px-3 py-2 rounded bg-slate-700 uppercase"
              placeholder="Enter room code (e.g., ABCDE)"
            />
          </div>
          <div className="flex gap-3">
            <button onClick={createRoom} className="px-4 py-2 rounded bg-emerald-600">
              Create room
            </button>
            <button
              onClick={joinRoom}
              disabled={!room}
              className={`px-4 py-2 rounded ${room ? 'bg-indigo-600' : 'bg-slate-600'}`}
            >
              Join room
            </button>
          </div>
          <p className="text-sm text-slate-400">Share the URL with your friends after you create a room.</p>
        </div>
      )}

      {room && state.phase === 'lobby' && (
        <div className="grid md:grid-cols-[1fr_380px] gap-4">
          <Lobby players={players.map((p, i) => ({ ...p, isOwner: i === 0 }))} isOwner={isOwner} onStart={startGame} />
          <div className="bg-slate-800 rounded-xl p-4 shadow-soft">
            <div className="text-sm text-slate-300">
              <div>Share this link:</div>
              <div className="mt-1 break-all bg-slate-900/60 p-2 rounded">{location.href}</div>
            </div>
          </div>
        </div>
      )}

      {room && state.phase !== 'lobby' && canPlay && (
        <Game
          roomCode={room}
          me={{ ...me, name }}
          players={players}
          isOwner={isOwner}
          send={send}
          onEvent={(t: string, p: any) => {
            if (typeof p === 'function') return events.current.set(t, p)
            return events.current.get(t)?.(p)
          }}
        />
      )}

      <footer className="mt-6 text-center text-xs text-slate-500">
        Built with React + Supabase Realtime • Optimized for desktop & mobile
      </footer>
    </div>
  )
}