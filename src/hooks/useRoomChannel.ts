import { supabase } from '../lib/supabaseClient'
import { useEffect, useState } from 'react'
import type { Channel } from '@supabase/supabase-js'
import type { ChannelEvent, Player } from '../types'


export function useRoomChannel(roomCode: string, me: Player) {
const [channel, setChannel] = useState<Channel | null>(null)
const [players, setPlayers] = useState<Player[]>([])


useEffect(() => {
let ch: Channel
supabase.auth.getSession().then(() => {
ch = supabase.channel(`room_${roomCode}`, {
config: { broadcast: { self: true }, presence: { key: me.id } }
})
ch.on('presence', { event: 'sync' }, () => {
const state = ch.presenceState()
const list: Player[] = []
Object.entries(state).forEach(([id, metas]) => {
;(metas as any[]).forEach(m => list.push(m as Player))
})
list.sort((a, b) => a.joinedAt - b.joinedAt)
setPlayers(list)
})
ch.subscribe(async status => { if (status === 'SUBSCRIBED') await ch.track(me as any) })
setChannel(ch)
})
return () => { try { ch?.unsubscribe() } catch {} }
}, [roomCode, me.id])


async function send(event: ChannelEvent) {
if (!channel) return
await channel.send({ type: 'broadcast', event: event.type, payload: event.payload as any })
}
function on<T extends ChannelEvent['type']>(type: T, cb: (payload: any) => void) {
channel?.on('broadcast', { event: type }, e => cb((e as any).payload))
}
return { channel, players, send, on }
}