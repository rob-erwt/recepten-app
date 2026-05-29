'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type Uitnodiging = {
  id: string
  token: string
  email: string | null
  aangemaakt_op: string
  verloopt_op: string
}

type Gezinslid = {
  id: string
  naam: string | null
  aangemaakt_op: string
}

export default function UitnodigingenBeheer({ huishoudenId }: { huishoudenId: string }) {
  const [uitnodigingen, setUitnodigingen] = useState<Uitnodiging[]>([])
  const [leden, setLeden] = useState<Gezinslid[]>([])
  const [laden, setLaden] = useState(true)
  const [aanmaken, setAanmaken] = useState(false)
  const [nieuwToken, setNieuwToken] = useState<string | null>(null)
  const [uitnodigingUrl, setUitnodigingUrl] = useState('')
  const [kopieerd, setKopieerd] = useState(false)
  const [intrekkenId, setIntrekkenId] = useState<string | null>(null)
  const [huidigGebruikerId, setHuidigGebruikerId] = useState<string | null>(null)

  useEffect(() => {
    if (nieuwToken) {
      setUitnodigingUrl(`${window.location.origin}/uitnodiging/${nieuwToken}`)
    }
  }, [nieuwToken])

  useEffect(() => {
    async function laadData() {
      const supabase = createClient()

      const [{ data: { user } }, uitnResult, ledenResult] = await Promise.all([
        supabase.auth.getUser(),
        supabase
          .from('uitnodigingen')
          .select('id, token, email, aangemaakt_op, verloopt_op')
          .is('gebruikt_op', null)
          .gt('verloopt_op', new Date().toISOString())
          .order('aangemaakt_op', { ascending: false }),
        supabase
          .from('gebruikers')
          .select('id, naam, aangemaakt_op')
          .eq('huishouden_id', huishoudenId)
          .order('aangemaakt_op'),
      ])

      setHuidigGebruikerId(user?.id ?? null)
      setUitnodigingen(uitnResult.data ?? [])
      setLeden(ledenResult.data ?? [])
      setLaden(false)
    }
    laadData()
  }, [huishoudenId])

  async function maakUitnodiging() {
    setAanmaken(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('uitnodigingen')
      .insert({ huishouden_id: huishoudenId, aangemaakt_door: user.id })
      .select('id, token, email, aangemaakt_op, verloopt_op')
      .single()

    if (!error && data) {
      setNieuwToken(data.token)
      setUitnodigingen(prev => [data, ...prev])
    }
    setAanmaken(false)
  }

  async function trekIn(id: string) {
    setIntrekkenId(id)
    const supabase = createClient()
    const { error } = await supabase.from('uitnodigingen').delete().eq('id', id)
    if (!error) {
      setUitnodigingen(prev => prev.filter(u => u.id !== id))
      if (nieuwToken && uitnodigingen.find(u => u.id === id)?.token === nieuwToken) {
        setNieuwToken(null)
        setUitnodigingUrl('')
      }
    }
    setIntrekkenId(null)
  }

  async function kopieerLink() {
    if (!uitnodigingUrl) return
    await navigator.clipboard.writeText(uitnodigingUrl)
    setKopieerd(true)
    setTimeout(() => setKopieerd(false), 2000)
  }

  function formatDatum(iso: string) {
    return new Date(iso).toLocaleDateString('nl-NL', {
      day: 'numeric', month: 'long', year: 'numeric',
    })
  }

  if (laden) {
    return (
      <div className="text-center py-10 text-slate-400">
        <div className="inline-block w-5 h-5 border-2 border-slate-200 border-t-primary-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8">

      {/* ── Gezinsleden ── */}
      <section>
        <h2 className="text-base font-semibold text-slate-800 mb-3">Gezinsleden</h2>
        <div className="card divide-y divide-slate-100">
          {leden.map(lid => (
            <div key={lid.id} className="flex items-center gap-3 px-4 py-3">
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-semibold text-primary-700">
                  {(lid.naam ?? '?')[0].toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">
                  {lid.naam ?? 'Naamloos'}
                  {lid.id === huidigGebruikerId && (
                    <span className="ml-2 text-xs text-slate-400 font-normal">(jij)</span>
                  )}
                </p>
                <p className="text-xs text-slate-400">Lid sinds {formatDatum(lid.aangemaakt_op)}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Uitnodigingen ── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-slate-800">Uitnodigingen</h2>
          <button
            onClick={maakUitnodiging}
            disabled={aanmaken}
            className="btn-primary text-sm"
          >
            {aanmaken ? (
              <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            )}
            Nieuwe uitnodiging
          </button>
        </div>

        {/* Nieuwe uitnodigingslink tonen */}
        {nieuwToken && uitnodigingUrl && (
          <div className="mb-4 p-4 rounded-xl border-2 border-primary-200 bg-primary-50">
            <p className="text-sm font-medium text-primary-800 mb-2">
              ✓ Uitnodigingslink aangemaakt — deel hem met het gezinslid
            </p>
            <div className="flex gap-2">
              <input
                readOnly
                value={uitnodigingUrl}
                className="flex-1 text-xs bg-white border border-primary-200 rounded-lg px-3 py-2 text-slate-700 font-mono truncate"
              />
              <button
                onClick={kopieerLink}
                className={`flex-shrink-0 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  kopieerd
                    ? 'bg-emerald-500 text-white'
                    : 'bg-primary-500 text-white hover:bg-primary-600'
                }`}
              >
                {kopieerd ? 'Gekopieerd!' : 'Kopieer'}
              </button>
            </div>
            <p className="text-xs text-primary-600 mt-2">
              De link is 7 dagen geldig. Via de link kan het gezinslid een account aanmaken en direct toegang krijgen tot jullie recepten.
            </p>
          </div>
        )}

        {/* Actieve uitnodigingen */}
        {uitnodigingen.length === 0 ? (
          <div className="card p-6 text-center text-slate-400">
            <p className="text-sm">Geen openstaande uitnodigingen.</p>
          </div>
        ) : (
          <div className="card divide-y divide-slate-100">
            {uitnodigingen.map(uitnodiging => (
              <div key={uitnodiging.id} className="flex items-center gap-3 px-4 py-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700 truncate">
                    {uitnodiging.email ?? 'Openstaande uitnodiging'}
                  </p>
                  <p className="text-xs text-slate-400">
                    Verloopt op {formatDatum(uitnodiging.verloopt_op)}
                  </p>
                </div>
                <button
                  onClick={() => trekIn(uitnodiging.id)}
                  disabled={intrekkenId === uitnodiging.id}
                  className="flex-shrink-0 text-xs text-slate-400 hover:text-red-500 transition-colors px-2 py-1 rounded hover:bg-red-50"
                >
                  {intrekkenId === uitnodiging.id ? '…' : 'Intrekken'}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
