'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

// ─── Datum-helpers (zelfde logica als WeekMenuOverzicht) ──────────────────────

function datumString(d: Date): string {
  const j = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dag = String(d.getDate()).padStart(2, '0')
  return `${j}-${m}-${dag}`
}

function startVanWeek(offset: number): Date {
  const vandaag = new Date()
  const dagVdWeek = vandaag.getDay()
  const diffNaarZa = dagVdWeek === 6 ? 0 : -(dagVdWeek + 1)
  const za = new Date(vandaag)
  za.setDate(vandaag.getDate() + diffNaarZa + offset * 7)
  za.setHours(0, 0, 0, 0)
  return za
}

function weekLabel(offset: number): string {
  if (offset === -1) return 'Vorige week'
  if (offset === 0)  return 'Deze week'
  if (offset === 1)  return 'Volgende week'
  const start = startVanWeek(offset)
  const eind  = new Date(start)
  eind.setDate(start.getDate() + 6)
  return `${start.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })} – ${eind.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}`
}

const DAG_KORT = ['Za', 'Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr']

// ─── Types ────────────────────────────────────────────────────────────────────

type DagEntry = {
  weekmenu_id: string
  recept_id: string | null
}

// ─── Component ────────────────────────────────────────────────────────────────

type Props = {
  receptId: string
  huishoudenId: string
}

export default function ReceptWeekMenuKiezer({ receptId, huishoudenId }: Props) {
  const [weekOffset, setWeekOffset] = useState(0)
  const [dagEntries, setDagEntries] = useState<Record<string, DagEntry>>({})
  const [laden, setLaden] = useState(true)
  const [bezig, setBezig] = useState<string | null>(null)

  const dagen = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startVanWeek(weekOffset))
    d.setDate(d.getDate() + i)
    return d
  })

  const vandaagStr = datumString(new Date())

  // ── Weekmenu voor deze week ophalen ──────────────────────────────────────

  useEffect(() => {
    async function laad() {
      setLaden(true)
      const supabase = createClient()
      const { data } = await supabase
        .from('weekmenu')
        .select('id, datum, recept_id')
        .gte('datum', datumString(dagen[0]))
        .lte('datum', datumString(dagen[6]))

      const map: Record<string, DagEntry> = {}
      for (const e of data ?? []) {
        map[e.datum] = { weekmenu_id: e.id, recept_id: e.recept_id }
      }
      setDagEntries(map)
      setLaden(false)
    }
    laad()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekOffset])

  // ── Dag aan/afvinken ─────────────────────────────────────────────────────

  async function toggleDag(datum: string) {
    setBezig(datum)
    const supabase = createClient()
    const entry = dagEntries[datum]

    if (entry?.recept_id === receptId) {
      // Ontkoppelen: verwijder de weekmenu-rij
      await supabase.from('weekmenu').delete().eq('id', entry.weekmenu_id)
      setDagEntries(prev => {
        const next = { ...prev }
        delete next[datum]
        return next
      })
    } else {
      // Koppelen of vervangen
      const { data } = await supabase
        .from('weekmenu')
        .upsert(
          { huishouden_id: huishoudenId, datum, recept_id: receptId },
          { onConflict: 'huishouden_id,datum' }
        )
        .select('id, datum, recept_id')
        .single()

      if (data) {
        setDagEntries(prev => ({
          ...prev,
          [datum]: { weekmenu_id: data.id, recept_id: data.recept_id },
        }))
      }
    }
    setBezig(null)
  }

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="card p-5 mb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 gap-2">
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-primary-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h2 className="text-sm font-semibold text-slate-800">Plan in weekmenu</h2>
        </div>

        {/* Week-navigatie */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setWeekOffset(o => o - 1)}
            className="w-6 h-6 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Vorige week"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-xs text-slate-500 min-w-[80px] text-center">
            {weekLabel(weekOffset)}
          </span>
          <button
            onClick={() => setWeekOffset(o => o + 1)}
            className="w-6 h-6 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Volgende week"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Dagknoppen */}
      {laden ? (
        <div className="h-14 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-slate-200 border-t-primary-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-1">
          {dagen.map((dag, i) => {
            const datStr   = datumString(dag)
            const entry    = dagEntries[datStr]
            const isGekoppeld = entry?.recept_id === receptId
            const isBezet  = !!entry && entry.recept_id !== receptId
            const isVandaag = datStr === vandaagStr
            const isBezig  = bezig === datStr

            return (
              <button
                key={datStr}
                onClick={() => toggleDag(datStr)}
                disabled={!!bezig}
                title={
                  isGekoppeld
                    ? 'Klik om te ontkoppelen'
                    : isBezet
                    ? 'Ander recept ingepland — klik om te vervangen'
                    : 'Klik om in te plannen'
                }
                className={`
                  relative flex flex-col items-center py-2.5 rounded-lg text-xs font-medium transition-all
                  disabled:opacity-60
                  ${isGekoppeld
                    ? 'bg-primary-500 text-white shadow-sm'
                    : isBezet
                    ? 'bg-slate-50 text-slate-400 border border-dashed border-slate-300 hover:border-primary-300 hover:text-primary-500'
                    : isVandaag
                    ? 'border border-primary-200 text-primary-700 hover:bg-primary-50'
                    : 'text-slate-600 hover:bg-slate-100 border border-transparent'
                  }
                `}
              >
                <span>{DAG_KORT[i]}</span>
                <span className={`mt-0.5 ${isGekoppeld ? 'text-primary-100' : 'text-slate-400 font-normal'}`}>
                  {dag.getDate()}
                </span>
                {isBezig && (
                  <span className="absolute inset-0 flex items-center justify-center bg-inherit rounded-lg">
                    <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin opacity-70" />
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Legenda */}
      <p className="text-xs text-slate-400 mt-2.5 flex items-center gap-3 flex-wrap">
        <span className="flex items-center gap-1">
          <span className="inline-block w-2.5 h-2.5 rounded-sm bg-primary-500" />
          Ingepland
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2.5 h-2.5 rounded-sm border border-dashed border-slate-300" />
          Ander recept
        </span>
      </p>
    </div>
  )
}
