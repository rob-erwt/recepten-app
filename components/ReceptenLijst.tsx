'use client'

import { useState, useEffect, KeyboardEvent } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { ReceptKaart, Categorie } from '@/lib/types'
import { PAGINA_GROOTTE, paginaNummers } from '@/lib/paginering'

// Lokale uitbreiding: optionele gevonden_ingredienten voor de zoekresultatenweergave
type ReceptKaartZoek = ReceptKaart & { gevonden_ingredienten?: string[] }

function TijdBadge({ minuten }: { minuten: number }) {
  const uur = Math.floor(minuten / 60)
  const min = minuten % 60
  const label = uur > 0 ? `${uur}u${min > 0 ? ` ${min}m` : ''}` : `${min} min`
  return (
    <span className="inline-flex items-center gap-1 text-xs text-slate-500">
      <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {label}
    </span>
  )
}

function PersonenBadge({ aantal }: { aantal: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-slate-500">
      <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      {aantal} {aantal === 1 ? 'persoon' : 'personen'}
    </span>
  )
}

export default function ReceptenLijst() {
  // Naamzoeken (gedebounced)
  const [zoekterm, setZoekterm] = useState('')
  const [debouncedZoekterm, setDebouncedZoekterm] = useState('')

  // Ingrediëntenzoeken (chips)
  const [ingInput, setIngInput] = useState('')
  const [ingChips, setIngChips] = useState<string[]>([])

  const [actieveCategorieen, setActieveCategorieen] = useState<string[]>([])
  const [paginaNr, setPaginaNr] = useState(1)

  const [recepten, setRecepten] = useState<ReceptKaartZoek[]>([])
  const [categorieen, setCategorieen] = useState<Categorie[]>([])
  const [aantalResultaten, setAantalResultaten] = useState(0)
  const [laden, setLaden] = useState(true)
  const [fout, setFout] = useState('')

  // Debounce zoekterm
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedZoekterm(zoekterm)
      setPaginaNr(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [zoekterm])

  // Categorieën eenmalig laden
  useEffect(() => {
    async function laadCategorieen() {
      const supabase = createClient()
      const { data } = await supabase
        .from('categorieen')
        .select('id, naam, volgorde, huishouden_id')
        .order('volgorde')
      if (data) setCategorieen(data)
    }
    laadCategorieen()
  }, [])

  // Recepten server-side ophalen
  useEffect(() => {
    async function laadRecepten() {
      setLaden(true)
      setFout('')
      try {
        const supabase = createClient()
        const from = (paginaNr - 1) * PAGINA_GROOTTE
        const to = from + PAGINA_GROOTTE - 1

        // ── Stap 1: ingrediëntenfilter ────────────────────────────────────────
        // Per chip zoeken welke recept-IDs een ingrediënt met die naam bevatten,
        // daarna de doorsnede nemen (AND-logica: recept moet álle chips bevatten).
        let ingredientIds: string[] | null = null
        if (ingChips.length > 0) {
          const sets: Set<string>[] = []
          for (const chip of ingChips) {
            const { data } = await supabase
              .from('ingredienten')
              .select('recept_id')
              .ilike('naam', `%${chip}%`)
            sets.push(new Set((data ?? []).map(r => r.recept_id as string)))
          }
          // Doorsnede: ID moet in élke set voorkomen
          const [eerste, ...rest] = sets
          ingredientIds = Array.from(eerste).filter(id => rest.every(s => s.has(id)))

          if (ingredientIds.length === 0) {
            setRecepten([])
            setAantalResultaten(0)
            return
          }
        }

        // ── Stap 2: categoriefilter ───────────────────────────────────────────
        let categorieIds: string[] | null = null
        if (actieveCategorieen.length > 0) {
          const { data } = await supabase
            .from('recept_categorieen')
            .select('recept_id')
            .in('categorie_id', actieveCategorieen)
          categorieIds = Array.from(new Set((data ?? []).map(m => m.recept_id as string)))

          if (categorieIds.length === 0) {
            setRecepten([])
            setAantalResultaten(0)
            return
          }
        }

        // ── Stap 3: combineer filters ─────────────────────────────────────────
        let gefilterdOpIds: string[] | null = null
        if (ingredientIds !== null && categorieIds !== null) {
          const catSet = new Set(categorieIds)
          gefilterdOpIds = ingredientIds.filter(id => catSet.has(id))
        } else {
          gefilterdOpIds = ingredientIds ?? categorieIds
        }

        if (gefilterdOpIds !== null && gefilterdOpIds.length === 0) {
          setRecepten([])
          setAantalResultaten(0)
          return
        }

        // ── Stap 4: recepten ophalen ──────────────────────────────────────────
        // ingredienten(naam) wordt altijd meegestuurd; de data wordt alleen
        // gebruikt om gevonden_ingredienten te bepalen als chips actief zijn.
        const heeftIngredientFilter = ingChips.length > 0

        let query = supabase
          .from('recepten')
          .select(
            `id, naam, beschrijving, aantal_personen, bereidingstijd_min, foto_url,
             recept_categorieen ( categorieen (id, naam) ),
             ingredienten ( naam )`,
            { count: 'exact' }
          )
          .order('naam')
          .range(from, to)

        if (debouncedZoekterm) {
          query = query.ilike('naam', `%${debouncedZoekterm}%`)
        }
        if (gefilterdOpIds !== null) {
          query = query.in('id', gefilterdOpIds)
        }

        const { data, count, error } = await query

        if (error) {
          setFout('Recepten konden niet worden geladen.')
          return
        }

        const gemapt: ReceptKaartZoek[] = (data ?? []).map(r => {
          const alleIngredienten = heeftIngredientFilter
            ? (r.ingredienten ?? []).map(i => i.naam)
            : []

          // Welke ingrediënten van dit recept matchen de zoekopdracht?
          const gevonden = heeftIngredientFilter
            ? alleIngredienten.filter(naam =>
                ingChips.some(chip => naam.toLowerCase().includes(chip.toLowerCase()))
              )
            : undefined

          return {
            id: r.id,
            naam: r.naam,
            beschrijving: r.beschrijving,
            aantal_personen: r.aantal_personen,
            bereidingstijd_min: r.bereidingstijd_min,
            foto_url: r.foto_url,
            categorieen: (r.recept_categorieen ?? [])
              .map(rc => rc.categorieen)
              .filter((c): c is { id: string; naam: string } => c !== null),
            gevonden_ingredienten: gevonden,
          }
        })

        setRecepten(gemapt)
        setAantalResultaten(count ?? 0)
      } catch {
        setFout('Recepten konden niet worden geladen.')
      } finally {
        setLaden(false)
      }
    }
    laadRecepten()
  }, [debouncedZoekterm, ingChips, actieveCategorieen, paginaNr])

  // ── Chip-beheer ─────────────────────────────────────────────────────────────

  function voegChipToe() {
    const chip = ingInput.trim()
    if (chip && !ingChips.includes(chip.toLowerCase())) {
      setIngChips(prev => [...prev, chip.toLowerCase()])
      setPaginaNr(1)
    }
    setIngInput('')
  }

  function handleIngKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      voegChipToe()
    } else if (e.key === 'Backspace' && ingInput === '' && ingChips.length > 0) {
      setIngChips(prev => prev.slice(0, -1))
      setPaginaNr(1)
    }
  }

  function verwijderChip(chip: string) {
    setIngChips(prev => prev.filter(c => c !== chip))
    setPaginaNr(1)
  }

  // ── Overige filteracties ────────────────────────────────────────────────────

  function toggleCategorie(id: string) {
    setPaginaNr(1)
    setActieveCategorieen(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
  }

  function wisFilters() {
    setPaginaNr(1)
    setActieveCategorieen([])
    setZoekterm('')
    setDebouncedZoekterm('')
    setIngChips([])
    setIngInput('')
  }

  const heeftActieveFilters =
    zoekterm.length > 0 || ingChips.length > 0 || actieveCategorieen.length > 0
  const aantalPaginas = Math.max(1, Math.ceil(aantalResultaten / PAGINA_GROOTTE))

  return (
    <div>
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-5">
        <h1>Mijn recepten</h1>
        <div className="flex items-center gap-2">
          <Link href="/recepten/importeren" className="btn-secondary">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            Via URL
          </Link>
          <Link href="/recepten/nieuw" className="btn-primary">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nieuw recept
          </Link>
        </div>
      </div>

      {/* ── Zoeken op naam ── */}
      <div className="relative mb-3">
        <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="search"
          className="input pl-10"
          placeholder="Zoek op naam…"
          value={zoekterm}
          onChange={e => setZoekterm(e.target.value)}
        />
        {zoekterm && (
          <button
            onClick={() => { setZoekterm(''); setDebouncedZoekterm('') }}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* ── Zoeken op ingrediënten (chips) ── */}
      <div className="mb-3">
        <div className="flex items-center gap-2 flex-wrap px-3 py-2 rounded-xl border border-slate-200 bg-white focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-primary-100 transition-all min-h-[42px]">
          {/* Actieve chips */}
          {ingChips.map(chip => (
            <span
              key={chip}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-100 text-primary-800 text-sm font-medium"
            >
              {chip}
              <button
                onClick={() => verwijderChip(chip)}
                className="text-primary-500 hover:text-primary-800 transition-colors"
                aria-label={`Verwijder ${chip}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}

          {/* Invoerveld */}
          <input
            type="text"
            className="flex-1 min-w-[140px] text-sm outline-none bg-transparent text-slate-700 placeholder:text-slate-400"
            placeholder={ingChips.length === 0 ? 'Zoek op ingrediënt — druk Enter om toe te voegen…' : 'Nog een ingrediënt…'}
            value={ingInput}
            onChange={e => setIngInput(e.target.value)}
            onKeyDown={handleIngKeyDown}
            onBlur={voegChipToe}
          />
        </div>
        {ingChips.length > 0 && (
          <p className="text-xs text-slate-400 mt-1 ml-1">
            Toont recepten die álle ingrediënten bevatten
          </p>
        )}
      </div>

      {/* ── Categoriefilter ── */}
      {categorieen.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap mb-5">
          {categorieen.map(cat => {
            const actief = actieveCategorieen.includes(cat.id)
            return (
              <button
                key={cat.id}
                onClick={() => toggleCategorie(cat.id)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                  actief
                    ? 'bg-primary-500 border-primary-500 text-white shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-primary-300 hover:text-primary-700'
                }`}
              >
                {cat.naam}
              </button>
            )
          })}
          {heeftActieveFilters && (
            <button
              onClick={wisFilters}
              className="px-3 py-1.5 rounded-full text-sm text-slate-400 hover:text-red-500 transition-colors flex items-center gap-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Alles wissen
            </button>
          )}
          <span className="text-slate-200 select-none">|</span>
          <Link
            href="/recepten/categorieen"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Categorieën beheren"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </Link>
        </div>
      )}

      {/* ── States ── */}
      {laden && (
        <div className="text-center py-16 text-slate-400">
          <div className="inline-block w-6 h-6 border-2 border-slate-200 border-t-primary-500 rounded-full animate-spin mb-3" />
          <p className="text-sm">Recepten laden…</p>
        </div>
      )}

      {!laden && fout && (
        <div className="card p-4 text-center text-red-600 text-sm">{fout}</div>
      )}

      {!laden && !fout && aantalResultaten === 0 && !heeftActieveFilters && (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-100 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="text-slate-700 mb-1">Nog geen recepten</h3>
          <p className="text-sm text-slate-400 mb-5">Voeg je eerste recept toe om te beginnen.</p>
          <Link href="/recepten/nieuw" className="btn-primary">Eerste recept toevoegen</Link>
        </div>
      )}

      {!laden && !fout && aantalResultaten === 0 && heeftActieveFilters && (
        <div className="text-center py-12 text-slate-500">
          <p className="text-sm">Geen recepten gevonden.</p>
          <button onClick={wisFilters} className="text-sm text-primary-600 hover:underline mt-2">
            Filters wissen
          </button>
        </div>
      )}

      {/* ── Receptenlijst ── */}
      {!laden && !fout && aantalResultaten > 0 && (
        <div className="space-y-2">
          {recepten.map(recept => (
            <Link
              key={recept.id}
              href={`/recepten/${recept.id}`}
              className="card flex items-center gap-4 p-4 hover:border-primary-200 hover:shadow-md transition-all group"
            >
              {/* Foto of placeholder */}
              <div className="w-14 h-14 rounded-lg bg-slate-100 flex-shrink-0 overflow-hidden">
                {recept.foto_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={recept.foto_url} alt={recept.naam} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 truncate group-hover:text-primary-700 transition-colors">
                  {recept.naam}
                </p>
                {recept.beschrijving && (
                  <p className="text-sm text-slate-500 truncate mt-0.5">{recept.beschrijving}</p>
                )}
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  {recept.bereidingstijd_min && <TijdBadge minuten={recept.bereidingstijd_min} />}
                  {recept.aantal_personen && <PersonenBadge aantal={recept.aantal_personen} />}
                  {recept.categorieen.map(c => (
                    <span key={c.id} className="text-xs px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 font-medium">
                      {c.naam}
                    </span>
                  ))}
                </div>

                {/* Gevonden ingrediënten — alleen zichtbaar bij actieve ingrediëntenzoekopdracht */}
                {recept.gevonden_ingredienten && recept.gevonden_ingredienten.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                    <span className="text-xs text-slate-400">ingrediënten:</span>
                    {recept.gevonden_ingredienten.map(ing => (
                      <span key={ing} className="inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        {ing}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-slate-300 group-hover:text-primary-400 flex-shrink-0 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      )}

      {/* ── Paginering + teller ── */}
      {!laden && !fout && aantalResultaten > 0 && (
        <div className="mt-5 flex flex-col items-center gap-3">
          {aantalPaginas > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPaginaNr(p => Math.max(1, p - 1))}
                disabled={paginaNr === 1}
                className="px-3 py-1.5 rounded-lg text-sm text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                ← Vorige
              </button>

              {paginaNummers(aantalPaginas, paginaNr).map((item, i) =>
                item === '…' ? (
                  <span key={`ellipsis-${i}`} className="px-2 text-slate-300 text-sm select-none">…</span>
                ) : (
                  <button
                    key={item}
                    onClick={() => setPaginaNr(item)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                      item === paginaNr
                        ? 'bg-primary-500 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {item}
                  </button>
                )
              )}

              <button
                onClick={() => setPaginaNr(p => Math.min(aantalPaginas, p + 1))}
                disabled={paginaNr === aantalPaginas}
                className="px-3 py-1.5 rounded-lg text-sm text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                Volgende →
              </button>
            </div>
          )}

          <p className="text-xs text-slate-400">
            {aantalResultaten} {aantalResultaten === 1 ? 'recept' : 'recepten'}
            {heeftActieveFilters && ' gevonden'}
            {aantalPaginas > 1 && ` · pagina ${paginaNr} van ${aantalPaginas}`}
          </p>
        </div>
      )}
    </div>
  )
}
