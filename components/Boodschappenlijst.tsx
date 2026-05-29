'use client'

import { useState, useEffect, KeyboardEvent } from 'react'
import { createClient } from '@/lib/supabase/client'
import { datumString, startVanWeek, DAGNAMEN, DAG_KORT } from '@/lib/week'

// ─── Types ────────────────────────────────────────────────────────────────────

type Item = {
  id: string
  naam: string
  hoeveelheid: string | null
  eenheid: string | null
  afgevinkt: boolean
  bron: 'weekmenu' | 'handmatig'
  recept_naam: string | null
}

type WeekDag = {
  datum: string
  dag_naam: string
  dag_kort: string
  recept_id: string | null
  recept_naam: string | null
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Boodschappenlijst({ huishoudenId }: { huishoudenId: string }) {
  const [items, setItems] = useState<Item[]>([])
  const [laden, setLaden] = useState(true)

  // Weekmenu-generator
  const [weekOffset, setWeekOffset] = useState(0)
  const [weekDagen, setWeekDagen] = useState<WeekDag[]>([])
  const [weekLaden, setWeekLaden] = useState(true)
  const [generatorOpen, setGeneratorOpen] = useState(false)
  const [geselecteerd, setGeselecteerd] = useState<Set<string>>(new Set())
  const [genereren, setGenereren] = useState(false)

  // Handmatig toevoegen
  const [ingNaam, setIngNaam] = useState('')
  const [ingHoeveelheid, setIngHoeveelheid] = useState('')
  const [ingEenheid, setIngEenheid] = useState('')
  const [toevoegen, setToevoegen] = useState(false)

  // ── Items laden ────────────────────────────────────────────────────────────

  useEffect(() => {
    async function laadItems() {
      setLaden(true)
      const supabase = createClient()
      const { data } = await supabase
        .from('boodschappenlijst_items')
        .select('id, naam, hoeveelheid, eenheid, afgevinkt, bron, recept_naam')
        .eq('huishouden_id', huishoudenId)
        .order('bron')          // weekmenu eerst, daarna handmatig
        .order('recept_naam')
        .order('aangemaakt_op')
      setItems((data ?? []) as Item[])
      setLaden(false)
    }
    laadItems()
  }, [huishoudenId])

  // ── Weekmenu laden ─────────────────────────────────────────────────────────

  useEffect(() => {
    async function laadWeekMenu() {
      setWeekLaden(true)
      const supabase = createClient()

      const dagen = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(startVanWeek(weekOffset))
        d.setDate(d.getDate() + i)
        return d
      })

      const startStr = datumString(dagen[0])
      const eindStr = datumString(dagen[6])

      const { data } = await supabase
        .from('weekmenu')
        .select('datum, recept_id, recepten (naam)')
        .gte('datum', startStr)
        .lte('datum', eindStr)

      const menuMap: Record<string, { recept_id: string; recept_naam: string }> = {}
      for (const entry of data ?? []) {
        if (entry.recept_id && entry.recepten) {
          menuMap[entry.datum] = {
            recept_id: entry.recept_id,
            recept_naam: (entry.recepten as unknown as { naam: string }).naam,
          }
        }
      }

      const dagItems: WeekDag[] = dagen.map((d, i) => {
        const str = datumString(d)
        const menu = menuMap[str]
        return {
          datum: str,
          dag_naam: DAGNAMEN[i],
          dag_kort: DAG_KORT[i],
          recept_id: menu?.recept_id ?? null,
          recept_naam: menu?.recept_naam ?? null,
        }
      })

      setWeekDagen(dagItems)

      // Selecteer standaard alle dagen mét een recept
      setGeselecteerd(new Set(
        dagItems.filter(d => d.recept_id !== null).map(d => d.datum)
      ))

      setWeekLaden(false)
    }
    laadWeekMenu()
  }, [weekOffset])

  // ── Weekmenu → boodschappenlijst genereren ─────────────────────────────────

  async function genereerVanWeekmenu() {
    const dagen = weekDagen.filter(d => geselecteerd.has(d.datum) && d.recept_id)
    if (dagen.length === 0) return

    setGenereren(true)
    const supabase = createClient()

    // Verwijder eerder gegenereerde weekmenu-items (handmatige items blijven staan)
    await supabase
      .from('boodschappenlijst_items')
      .delete()
      .eq('huishouden_id', huishoudenId)
      .eq('bron', 'weekmenu')

    // Haal ingrediënten op voor alle geselecteerde recepten
    const receptIds = dagen.map(d => d.recept_id as string)
    const { data: ingredienten } = await supabase
      .from('ingredienten')
      .select('recept_id, naam, hoeveelheid, eenheid')
      .in('recept_id', receptIds)
      .order('volgorde')

    // Maak een map van recept_id → recept_naam
    const naamMap: Record<string, string> = {}
    for (const d of dagen) naamMap[d.recept_id!] = d.recept_naam!

    // Voeg alle ingrediënten in als boodschappenlijst-items
    const nieuweItems = (ingredienten ?? []).map(ing => ({
      huishouden_id: huishoudenId,
      naam: ing.naam,
      hoeveelheid: ing.hoeveelheid != null ? String(ing.hoeveelheid) : null,
      eenheid: ing.eenheid,
      afgevinkt: false,
      bron: 'weekmenu' as const,
      recept_naam: naamMap[ing.recept_id] ?? null,
    }))

    if (nieuweItems.length > 0) {
      const { data: ingevoegd } = await supabase
        .from('boodschappenlijst_items')
        .insert(nieuweItems)
        .select('id, naam, hoeveelheid, eenheid, afgevinkt, bron, recept_naam')

      setItems(prev => [
        ...(ingevoegd ?? []) as Item[],
        ...prev.filter(i => i.bron === 'handmatig'),
      ])
    } else {
      setItems(prev => prev.filter(i => i.bron === 'handmatig'))
    }

    setGenereren(false)
    setGeneratorOpen(false)
  }

  // ── Handmatig item toevoegen ────────────────────────────────────────────────

  async function voegToe() {
    const naam = ingNaam.trim()
    if (!naam) return

    setToevoegen(true)
    const supabase = createClient()

    const { data } = await supabase
      .from('boodschappenlijst_items')
      .insert({
        huishouden_id: huishoudenId,
        naam,
        hoeveelheid: ingHoeveelheid.trim() || null,
        eenheid: ingEenheid.trim() || null,
        afgevinkt: false,
        bron: 'handmatig',
        recept_naam: null,
      })
      .select('id, naam, hoeveelheid, eenheid, afgevinkt, bron, recept_naam')
      .single()

    if (data) {
      setItems(prev => [...prev, data as Item])
      setIngNaam('')
      setIngHoeveelheid('')
      setIngEenheid('')
    }
    setToevoegen(false)
  }

  function handleToevoegenKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') voegToe()
  }

  // ── Item afvinken ──────────────────────────────────────────────────────────

  async function toggleAfgevinkt(id: string, huidig: boolean) {
    // Optimistisch updaten
    setItems(prev =>
      prev.map(i => i.id === id ? { ...i, afgevinkt: !huidig } : i)
    )
    const supabase = createClient()
    const { error } = await supabase
      .from('boodschappenlijst_items')
      .update({ afgevinkt: !huidig })
      .eq('id', id)

    if (error) {
      // Terugdraaien bij fout
      setItems(prev =>
        prev.map(i => i.id === id ? { ...i, afgevinkt: huidig } : i)
      )
    }
  }

  // ── Item verwijderen ───────────────────────────────────────────────────────

  async function verwijder(id: string) {
    setItems(prev => prev.filter(i => i.id !== id))
    const supabase = createClient()
    await supabase.from('boodschappenlijst_items').delete().eq('id', id)
  }

  // ── Alle vinkjes wissen ────────────────────────────────────────────────────

  async function wisVinkjes() {
    setItems(prev => prev.map(i => ({ ...i, afgevinkt: false })))
    const supabase = createClient()
    await supabase
      .from('boodschappenlijst_items')
      .update({ afgevinkt: false })
      .eq('huishouden_id', huishoudenId)
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  function toggleDag(datum: string) {
    setGeselecteerd(prev => {
      const s = new Set(prev)
      if (s.has(datum)) s.delete(datum)
      else s.add(datum)
      return s
    })
  }

  function selecteerAlle() {
    setGeselecteerd(new Set(weekDagen.filter(d => d.recept_id).map(d => d.datum)))
  }

  function deselecteerAlle() {
    setGeselecteerd(new Set())
  }

  const weekmenuItems = items.filter(i => i.bron === 'weekmenu')
  const handmatigItems = items.filter(i => i.bron === 'handmatig')
  const aantalAfgevinkt = items.filter(i => i.afgevinkt).length
  const aantalDagenMetRecept = weekDagen.filter(d => d.recept_id).length

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1>Boodschappenlijst</h1>
        {aantalAfgevinkt > 0 && (
          <button
            onClick={wisVinkjes}
            className="text-sm text-slate-500 hover:text-slate-800 transition-colors"
          >
            Wis {aantalAfgevinkt} vinkje{aantalAfgevinkt !== 1 ? 's' : ''}
          </button>
        )}
      </div>

      {/* Handmatig toevoegen */}
      <div className="card p-3 mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            className="input flex-1"
            placeholder="Item toevoegen…"
            value={ingNaam}
            onChange={e => setIngNaam(e.target.value)}
            onKeyDown={handleToevoegenKeyDown}
          />
          <input
            type="text"
            className="input w-20 text-center"
            placeholder="Hoev."
            value={ingHoeveelheid}
            onChange={e => setIngHoeveelheid(e.target.value)}
            onKeyDown={handleToevoegenKeyDown}
          />
          <input
            type="text"
            className="input w-20"
            placeholder="Eenheid"
            value={ingEenheid}
            onChange={e => setIngEenheid(e.target.value)}
            onKeyDown={handleToevoegenKeyDown}
          />
          <button
            onClick={voegToe}
            disabled={toevoegen || !ingNaam.trim()}
            className="btn-primary flex-shrink-0"
          >
            {toevoegen
              ? <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              : <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
            }
          </button>
        </div>
      </div>

      {/* Genereer van weekmenu (accordion) */}
      <div className="card mb-5 overflow-hidden">
        <button
          onClick={() => setGeneratorOpen(o => !o)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <span className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Genereer van weekmenu
          </span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`w-4 h-4 text-slate-400 transition-transform ${generatorOpen ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {generatorOpen && (
          <div className="border-t border-slate-100 px-4 py-4">
            {/* Weeknavigatie */}
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => setWeekOffset(o => o - 1)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="text-sm font-medium text-slate-700">
                {weekOffset === 0 ? 'Deze week' : weekOffset === 1 ? 'Volgende week' : weekOffset === -1 ? 'Vorige week' : `Week ${weekOffset > 0 ? '+' : ''}${weekOffset}`}
              </span>
              <button
                onClick={() => setWeekOffset(o => o + 1)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {weekLaden ? (
              <div className="text-center py-4">
                <div className="inline-block w-5 h-5 border-2 border-slate-200 border-t-primary-500 rounded-full animate-spin" />
              </div>
            ) : (
              <>
                {/* Dagselectie */}
                <div className="space-y-1.5 mb-4">
                  {weekDagen.map(dag => (
                    <label
                      key={dag.datum}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                        dag.recept_id
                          ? geselecteerd.has(dag.datum)
                            ? 'bg-primary-50'
                            : 'hover:bg-slate-50'
                          : 'opacity-40 cursor-not-allowed'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="accent-primary-500 w-4 h-4 flex-shrink-0"
                        checked={geselecteerd.has(dag.datum)}
                        disabled={!dag.recept_id}
                        onChange={() => dag.recept_id && toggleDag(dag.datum)}
                      />
                      <span className="text-xs font-medium text-slate-500 w-6 flex-shrink-0">
                        {dag.dag_kort}
                      </span>
                      <span className="text-sm text-slate-700 truncate">
                        {dag.recept_naam ?? <span className="text-slate-400 italic">Geen recept</span>}
                      </span>
                    </label>
                  ))}
                </div>

                {/* Selecteer alle / geen */}
                {aantalDagenMetRecept > 0 && (
                  <div className="flex gap-3 mb-4">
                    <button onClick={selecteerAlle} className="text-xs text-primary-600 hover:underline">
                      Alles selecteren
                    </button>
                    <button onClick={deselecteerAlle} className="text-xs text-slate-400 hover:underline">
                      Niets selecteren
                    </button>
                  </div>
                )}

                {aantalDagenMetRecept === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-2">
                    Geen recepten gepland in het weekmenu.
                  </p>
                ) : (
                  <button
                    onClick={genereerVanWeekmenu}
                    disabled={genereren || geselecteerd.size === 0}
                    className="btn-primary w-full"
                  >
                    {genereren ? (
                      <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Genereer voor {geselecteerd.size} dag{geselecteerd.size !== 1 ? 'en' : ''}
                      </>
                    )}
                  </button>
                )}

                {weekmenuItems.length > 0 && (
                  <p className="text-xs text-slate-400 mt-2 text-center">
                    Eerder gegenereerde weekmenu-items worden vervangen. Handmatige items blijven staan.
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Laadstatus */}
      {laden && (
        <div className="text-center py-12 text-slate-400">
          <div className="inline-block w-6 h-6 border-2 border-slate-200 border-t-primary-500 rounded-full animate-spin mb-3" />
          <p className="text-sm">Lijst laden…</p>
        </div>
      )}

      {/* Lege staat */}
      {!laden && items.length === 0 && (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-100 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <h3 className="text-slate-700 mb-1">Lege boodschappenlijst</h3>
          <p className="text-sm text-slate-400">
            Voeg items toe of genereer de lijst vanuit het weekmenu.
          </p>
        </div>
      )}

      {/* Lijst */}
      {!laden && items.length > 0 && (
        <div className="space-y-5">

          {/* Weekmenu-items */}
          {weekmenuItems.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-1">
                Uit het weekmenu
              </h2>
              <div className="card divide-y divide-slate-100">
                {weekmenuItems.map(item => (
                  <ItemRij
                    key={item.id}
                    item={item}
                    onToggle={() => toggleAfgevinkt(item.id, item.afgevinkt)}
                    onVerwijder={() => verwijder(item.id)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Handmatige items */}
          {handmatigItems.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-1">
                Handmatig toegevoegd
              </h2>
              <div className="card divide-y divide-slate-100">
                {handmatigItems.map(item => (
                  <ItemRij
                    key={item.id}
                    item={item}
                    onToggle={() => toggleAfgevinkt(item.id, item.afgevinkt)}
                    onVerwijder={() => verwijder(item.id)}
                  />
                ))}
              </div>
            </section>
          )}

        </div>
      )}
    </div>
  )
}

// ─── ItemRij ──────────────────────────────────────────────────────────────────

function ItemRij({
  item,
  onToggle,
  onVerwijder,
}: {
  item: Item
  onToggle: () => void
  onVerwijder: () => void
}) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 group transition-colors ${item.afgevinkt ? 'bg-slate-50' : ''}`}>
      {/* Checkbox */}
      <button
        onClick={onToggle}
        className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all ${
          item.afgevinkt
            ? 'bg-emerald-500 border-emerald-500'
            : 'border-slate-300 hover:border-primary-400'
        }`}
        aria-label={item.afgevinkt ? 'Vinkje verwijderen' : 'Afvinken'}
      >
        {item.afgevinkt && (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      {/* Tekst */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm transition-colors ${item.afgevinkt ? 'line-through text-slate-400' : 'text-slate-800'}`}>
          {item.hoeveelheid && (
            <span className="font-medium">
              {item.hoeveelheid}{item.eenheid ? ` ${item.eenheid}` : ''}{' '}
            </span>
          )}
          {item.naam}
        </p>
        {item.recept_naam && (
          <p className="text-xs text-slate-400 truncate mt-0.5">{item.recept_naam}</p>
        )}
      </div>

      {/* Verwijderen */}
      <button
        onClick={onVerwijder}
        className="opacity-0 group-hover:opacity-100 p-1 rounded text-slate-300 hover:text-red-400 transition-all"
        aria-label={`Verwijder ${item.naam}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
