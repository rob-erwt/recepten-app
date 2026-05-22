'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { ReceptKaart, WeekMenuEntry } from '@/lib/types'
import { datumString, startVanWeek, DAGNAMEN } from '@/lib/week'

// ─── Component ────────────────────────────────────────────────────────────────

export default function WeekMenuOverzicht({ huishoudenId }: { huishoudenId: string }) {
  const [weekOffset, setWeekOffset] = useState(0)
  const [weekmenu, setWeekmenu] = useState<Record<string, WeekMenuEntry>>({})
  const [laden, setLaden] = useState(true)
  const [refresh, setRefresh] = useState(0)

  // Receptkiezer
  const [kiezerDatum, setKiezerDatum] = useState<string | null>(null)
  const [alleRecepten, setAlleRecepten] = useState<ReceptKaart[]>([])
  const [zoekterm, setZoekterm] = useState('')
  const [kiezerLaden, setKiezerLaden] = useState(false)
  const zoekRef = useRef<HTMLInputElement>(null)

  // Bereken de 7 dagen (za t/m vr)
  const dagen = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startVanWeek(weekOffset))
    d.setDate(d.getDate() + i)
    return d
  })

  const vandaagStr = datumString(new Date())

  // ── Weekmenu ophalen ──────────────────────────────────────────────────────

  useEffect(() => {
    async function laadWeekMenu() {
      setLaden(true)
      const supabase = createClient()
      const startStr = datumString(dagen[0])
      const eindStr = datumString(dagen[6])

      const { data } = await supabase
        .from('weekmenu')
        .select('id, datum, recept_id, recepten (id, naam, foto_url, bereidingstijd_min)')
        .gte('datum', startStr)
        .lte('datum', eindStr)

      const map: Record<string, WeekMenuEntry> = {}
      for (const entry of data ?? []) {
        map[entry.datum] = {
          id: entry.id,
          datum: entry.datum,
          recept_id: entry.recept_id,
          recept: (entry.recepten as unknown as ReceptKaart | null),
        }
      }
      setWeekmenu(map)
      setLaden(false)
    }
    laadWeekMenu()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekOffset, refresh])

  // ── Alle recepten ophalen (eenmalig, voor de kiezer) ────────────────────

  useEffect(() => {
    async function laadRecepten() {
      const supabase = createClient()
      const { data } = await supabase
        .from('recepten')
        .select('id, naam, foto_url, bereidingstijd_min, beschrijving, aantal_personen')
        .order('naam')
      setAlleRecepten(
        (data ?? []).map(r => ({ ...r, categorieen: [] })) as ReceptKaart[]
      )
    }
    laadRecepten()
  }, [])

  // Auto-focus zoekfield als kiezer opengaat
  useEffect(() => {
    if (kiezerDatum) {
      setTimeout(() => zoekRef.current?.focus(), 50)
    }
  }, [kiezerDatum])

  // ── Acties ────────────────────────────────────────────────────────────────

  async function koppelRecept(datum: string, receptId: string) {
    setKiezerLaden(true)
    const supabase = createClient()
    await supabase
      .from('weekmenu')
      .upsert(
        { huishouden_id: huishoudenId, datum, recept_id: receptId },
        { onConflict: 'huishouden_id,datum' }
      )
    sluitKiezer()
    setRefresh(r => r + 1)
    setKiezerLaden(false)
  }

  async function verwijderKoppeling(datum: string) {
    const supabase = createClient()
    await supabase
      .from('weekmenu')
      .delete()
      .eq('huishouden_id', huishoudenId)
      .eq('datum', datum)
    setWeekmenu(prev => {
      const next = { ...prev }
      delete next[datum]
      return next
    })
  }

  function openKiezer(datum: string) {
    setZoekterm('')
    setKiezerDatum(datum)
  }

  function sluitKiezer() {
    setKiezerDatum(null)
    setZoekterm('')
  }

  // ── Afgeleide waarden ─────────────────────────────────────────────────────

  const weekLabel = `${dagen[0].toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })} – ${dagen[6].toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: weekOffset !== 0 && dagen[0].getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined })}`

  const kiezerDagIndex = kiezerDatum ? dagen.findIndex(d => datumString(d) === kiezerDatum) : -1

  const gefilterd = alleRecepten.filter(r =>
    r.naam.toLowerCase().includes(zoekterm.toLowerCase())
  )

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Paginatitel */}
      <div className="flex items-center justify-between mb-5">
        <h1>Weekmenu</h1>
      </div>

      {/* Week-navigatie */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setWeekOffset(o => o - 1)}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Vorige
        </button>

        <div className="text-center">
          <p className="text-sm font-medium text-slate-800">{weekLabel}</p>
          {weekOffset !== 0 && (
            <button
              onClick={() => setWeekOffset(0)}
              className="text-xs text-primary-600 hover:underline mt-0.5 block"
            >
              Naar huidige week
            </button>
          )}
        </div>

        <button
          onClick={() => setWeekOffset(o => o + 1)}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
        >
          Volgende
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Dagenoverzicht */}
      {laden ? (
        <div className="text-center py-16 text-slate-400">
          <div className="inline-block w-6 h-6 border-2 border-slate-200 border-t-primary-500 rounded-full animate-spin mb-3" />
          <p className="text-sm">Laden…</p>
        </div>
      ) : (
        <div className="space-y-2">
          {dagen.map((dag, i) => {
            const datStr = datumString(dag)
            const entry = weekmenu[datStr]
            const isVandaag = datStr === vandaagStr

            return (
              <div
                key={datStr}
                className={`card p-4 transition-colors ${
                  isVandaag ? 'border-primary-200 bg-primary-50/40' : ''
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Dag-label */}
                  <div className="flex-shrink-0 w-24">
                    <p className={`text-sm font-semibold ${isVandaag ? 'text-primary-700' : 'text-slate-700'}`}>
                      {DAGNAMEN[i]}
                      {isVandaag && (
                        <span className="ml-1.5 text-xs font-normal bg-primary-100 text-primary-600 px-1.5 py-0.5 rounded-full">vandaag</span>
                      )}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {dag.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>

                  {/* Recept of lege state */}
                  {entry?.recept ? (
                    <div className="flex-1 flex items-center gap-3 min-w-0">
                      {/* Minifoto */}
                      <div className="w-10 h-10 rounded-lg bg-slate-100 flex-shrink-0 overflow-hidden">
                        {entry.recept.foto_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={entry.recept.foto_url}
                            alt={entry.recept.naam}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Naam + tijd */}
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/recepten/${entry.recept.id}`}
                          className="text-sm font-medium text-slate-900 hover:text-primary-700 transition-colors truncate block"
                        >
                          {entry.recept.naam}
                        </Link>
                        {entry.recept.bereidingstijd_min && (
                          <span className="text-xs text-slate-400">
                            {entry.recept.bereidingstijd_min < 60
                              ? `${entry.recept.bereidingstijd_min} min`
                              : `${Math.floor(entry.recept.bereidingstijd_min / 60)}u${entry.recept.bereidingstijd_min % 60 > 0 ? ` ${entry.recept.bereidingstijd_min % 60}m` : ''}`
                            }
                          </span>
                        )}
                      </div>

                      {/* Acties */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => openKiezer(datStr)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                          title="Ander recept kiezen"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                          </svg>
                        </button>
                        <button
                          onClick={() => verwijderKoppeling(datStr)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          title="Recept verwijderen uit weekmenu"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => openKiezer(datStr)}
                      className="flex-1 flex items-center gap-2 text-sm text-slate-400 hover:text-primary-600 transition-colors group"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                      Recept koppelen
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Receptkiezer (modal) ──────────────────────────────────────────── */}
      {kiezerDatum && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm"
          onClick={sluitKiezer}
        >
          <div
            className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[85vh]"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="px-5 pt-5 pb-3 border-b border-slate-100 flex-shrink-0">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Recept kiezen</h2>
                  {kiezerDagIndex >= 0 && (
                    <p className="text-sm text-slate-500 mt-0.5">
                      {DAGNAMEN[kiezerDagIndex]}{' '}
                      {dagen[kiezerDagIndex].toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' })}
                    </p>
                  )}
                </div>
                <button
                  onClick={sluitKiezer}
                  className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Zoekbalk */}
              <div className="relative">
                <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  ref={zoekRef}
                  type="search"
                  className="input pl-9"
                  placeholder="Zoek recept…"
                  value={zoekterm}
                  onChange={e => setZoekterm(e.target.value)}
                />
              </div>
            </div>

            {/* Receptenlijst */}
            <div className="overflow-y-auto flex-1 p-2">
              {gefilterd.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">Geen recepten gevonden.</p>
              ) : (
                gefilterd.map(recept => {
                  const isGekoppeld = weekmenu[kiezerDatum]?.recept_id === recept.id
                  return (
                    <button
                      key={recept.id}
                      onClick={() => koppelRecept(kiezerDatum, recept.id)}
                      disabled={kiezerLaden}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                        isGekoppeld
                          ? 'bg-primary-50 text-primary-700'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      {/* Minifoto */}
                      <div className="w-10 h-10 rounded-lg bg-slate-100 flex-shrink-0 overflow-hidden">
                        {recept.foto_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={recept.foto_url} alt={recept.naam} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>

                      <span className="flex-1 text-sm font-medium text-slate-800 truncate">
                        {recept.naam}
                      </span>

                      {isGekoppeld && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-primary-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
