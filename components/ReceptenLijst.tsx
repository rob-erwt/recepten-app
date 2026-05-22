'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { ReceptKaart, Categorie } from '@/lib/types'

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
  const [recepten, setRecepten] = useState<ReceptKaart[]>([])
  const [categorieen, setCategorieen] = useState<Categorie[]>([])
  const [zoekterm, setZoekterm] = useState('')
  const [actieveCategorieen, setActieveCategorieen] = useState<string[]>([])
  const [laden, setLaden] = useState(true)
  const [fout, setFout] = useState('')
  const [paginaNr, setPaginaNr] = useState(1)

  const PAGINA_GROOTTE = 25

  useEffect(() => {
    async function laadData() {
      const supabase = createClient()

      // Categorieën en recepten parallel ophalen
      const [catResult, recResult] = await Promise.all([
        supabase
          .from('categorieen')
          .select('id, naam, volgorde, huishouden_id')
          .order('volgorde'),
        supabase
          .from('recepten')
          .select(`
            id, naam, beschrijving, aantal_personen, bereidingstijd_min, foto_url,
            recept_categorieen (
              categorieen (id, naam)
            )
          `)
          .order('naam'),
      ])

      if (recResult.error) {
        setFout('Recepten konden niet worden geladen.')
      } else {
        // Supabase geeft geneste join terug: vlak maken naar categorieen[]
        const gemapt: ReceptKaart[] = (recResult.data ?? []).map(r => ({
          id: r.id,
          naam: r.naam,
          beschrijving: r.beschrijving,
          aantal_personen: r.aantal_personen,
          bereidingstijd_min: r.bereidingstijd_min,
          foto_url: r.foto_url,
          categorieen: ((r.recept_categorieen ?? []) as unknown as { categorieen: { id: string; naam: string } | null }[])
            .map(rc => rc.categorieen)
            .filter(Boolean) as { id: string; naam: string }[],
        }))
        setRecepten(gemapt)
      }

      if (!catResult.error) {
        setCategorieen(catResult.data ?? [])
      }

      setLaden(false)
    }
    laadData()
  }, [])

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
  }

  const heeftActieveFilters = zoekterm.length > 0 || actieveCategorieen.length > 0

  const gefilterd = recepten.filter(r => {
    const naamMatch = r.naam.toLowerCase().includes(zoekterm.toLowerCase())
    const catMatch =
      actieveCategorieen.length === 0 ||
      r.categorieen.some(c => actieveCategorieen.includes(c.id))
    return naamMatch && catMatch
  })

  const aantalPaginas = Math.max(1, Math.ceil(gefilterd.length / PAGINA_GROOTTE))
  const huidigePagina = Math.min(paginaNr, aantalPaginas)
  const gepagineerd = gefilterd.slice((huidigePagina - 1) * PAGINA_GROOTTE, huidigePagina * PAGINA_GROOTTE)

  function paginaNummers(): (number | '…')[] {
    if (aantalPaginas <= 7) return Array.from({ length: aantalPaginas }, (_, i) => i + 1)
    const items: (number | '…')[] = [1]
    if (huidigePagina > 3) items.push('…')
    for (let p = Math.max(2, huidigePagina - 1); p <= Math.min(aantalPaginas - 1, huidigePagina + 1); p++) {
      items.push(p)
    }
    if (huidigePagina < aantalPaginas - 2) items.push('…')
    items.push(aantalPaginas)
    return items
  }

  return (
    <div>
      {/* Header */}
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

      {/* Zoekbalk */}
      <div className="relative mb-3">
        <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="search"
          className="input pl-10"
          placeholder="Zoek op naam…"
          value={zoekterm}
          onChange={e => { setZoekterm(e.target.value); setPaginaNr(1) }}
        />
        {zoekterm && (
          <button
            onClick={() => setZoekterm('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Categoriefilter */}
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
          {/* Beheren-link — gescheiden met een dunne lijn */}
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

      {/* States */}
      {laden && (
        <div className="text-center py-16 text-slate-400">
          <div className="inline-block w-6 h-6 border-2 border-slate-200 border-t-primary-500 rounded-full animate-spin mb-3" />
          <p className="text-sm">Recepten laden…</p>
        </div>
      )}

      {!laden && fout && (
        <div className="card p-4 text-center text-red-600 text-sm">{fout}</div>
      )}

      {!laden && !fout && recepten.length === 0 && (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-100 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="text-slate-700 mb-1">Nog geen recepten</h3>
          <p className="text-sm text-slate-400 mb-5">Voeg je eerste recept toe om te beginnen.</p>
          <Link href="/recepten/nieuw" className="btn-primary">
            Eerste recept toevoegen
          </Link>
        </div>
      )}

      {!laden && !fout && recepten.length > 0 && gefilterd.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          <p className="text-sm">Geen recepten gevonden.</p>
          <button
            onClick={wisFilters}
            className="text-sm text-primary-600 hover:underline mt-2"
          >
            Filters wissen
          </button>
        </div>
      )}

      {/* Receptenlijst */}
      {!laden && !fout && gefilterd.length > 0 && (
        <div className="space-y-2">
          {gepagineerd.map(recept => (
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
                    <span
                      key={c.id}
                      className="text-xs px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 font-medium"
                    >
                      {c.naam}
                    </span>
                  ))}
                </div>
              </div>

              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-slate-300 group-hover:text-primary-400 flex-shrink-0 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      )}

      {/* Paginering + teller */}
      {!laden && !fout && gefilterd.length > 0 && (
        <div className="mt-5 flex flex-col items-center gap-3">
          {aantalPaginas > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPaginaNr(p => Math.max(1, p - 1))}
                disabled={huidigePagina === 1}
                className="px-3 py-1.5 rounded-lg text-sm text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                ← Vorige
              </button>

              {paginaNummers().map((item, i) =>
                item === '…' ? (
                  <span key={`ellipsis-${i}`} className="px-2 text-slate-300 text-sm select-none">…</span>
                ) : (
                  <button
                    key={item}
                    onClick={() => setPaginaNr(item)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                      item === huidigePagina
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
                disabled={huidigePagina === aantalPaginas}
                className="px-3 py-1.5 rounded-lg text-sm text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                Volgende →
              </button>
            </div>
          )}

          <p className="text-xs text-slate-400">
            {gefilterd.length === recepten.length
              ? `${recepten.length} recepten`
              : `${gefilterd.length} van ${recepten.length} recepten`}
            {aantalPaginas > 1 && ` · pagina ${huidigePagina} van ${aantalPaginas}`}
          </p>
        </div>
      )}
    </div>
  )
}
