'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Categorie } from '@/lib/types'

type CategorieMetAantal = Categorie & { aantalRecepten?: number }

export default function CategorieenBeheer({ huishoudenId }: { huishoudenId: string }) {
  const [categorieen, setCategorieen] = useState<CategorieMetAantal[]>([])
  const [laden, setLaden] = useState(true)

  // Nieuw toevoegen
  const [toonToevoegen, setToonToevoegen] = useState(false)
  const [nieuwNaam, setNieuwNaam] = useState('')
  const [toevoegenBezig, setToevoegenBezig] = useState(false)
  const [toevoegenFout, setToevoegenFout] = useState('')
  const nieuwInputRef = useRef<HTMLInputElement>(null)

  // Inline bewerken
  const [bewerkenId, setBewerkenId] = useState<string | null>(null)
  const [bewerkenNaam, setBewerkenNaam] = useState('')
  const [bewerkenBezig, setBewerkenBezig] = useState(false)
  const bewerkenInputRef = useRef<HTMLInputElement>(null)

  // Verwijderen
  const [verwijderenId, setVerwijderenId] = useState<string | null>(null)
  const [verwijderenAantal, setVerwijderenAantal] = useState(0)
  const [verwijderenBezig, setVerwijderenBezig] = useState(false)

  const [algemeneFout, setAlgemeneFout] = useState('')

  async function laadCategorieen() {
    const supabase = createClient()
    const { data: cats } = await supabase
      .from('categorieen')
      .select('id, naam, volgorde, huishouden_id')
      .order('volgorde')

    if (!cats) { setLaden(false); return }

    // Receptenaantallen per categorie ophalen
    const { data: aantallen } = await supabase
      .from('recept_categorieen')
      .select('categorie_id')

    const telMap: Record<string, number> = {}
    for (const row of aantallen ?? []) {
      telMap[row.categorie_id] = (telMap[row.categorie_id] ?? 0) + 1
    }

    setCategorieen(cats.map(c => ({ ...c, aantalRecepten: telMap[c.id] ?? 0 })))
    setLaden(false)
  }

  useEffect(() => { laadCategorieen() }, [])

  useEffect(() => {
    if (toonToevoegen) nieuwInputRef.current?.focus()
  }, [toonToevoegen])

  useEffect(() => {
    if (bewerkenId) bewerkenInputRef.current?.focus()
  }, [bewerkenId])

  // ── Toevoegen ─────────────────────────────────────────────
  async function handleToevoegen(e: React.FormEvent) {
    e.preventDefault()
    const naam = nieuwNaam.trim()
    if (!naam) return
    setToevoegenFout('')
    setToevoegenBezig(true)

    const supabase = createClient()
    const { error } = await supabase.from('categorieen').insert({
      naam,
      huishouden_id: huishoudenId,
      volgorde: 99,
    })

    if (error) {
      setToevoegenFout('Toevoegen mislukt. Probeer het opnieuw.')
    } else {
      setNieuwNaam('')
      setToonToevoegen(false)
      await laadCategorieen()
    }
    setToevoegenBezig(false)
  }

  // ── Bewerken ──────────────────────────────────────────────
  function startBewerken(cat: CategorieMetAantal) {
    setBewerkenId(cat.id)
    setBewerkenNaam(cat.naam)
    setAlgemeneFout('')
  }

  function annuleerBewerken() {
    setBewerkenId(null)
    setBewerkenNaam('')
  }

  async function slaBewerkinOp(id: string) {
    const naam = bewerkenNaam.trim()
    if (!naam) return
    setBewerkenBezig(true)
    setAlgemeneFout('')

    const supabase = createClient()
    const { error } = await supabase
      .from('categorieen')
      .update({ naam })
      .eq('id', id)

    if (error) {
      setAlgemeneFout('Opslaan mislukt. Probeer het opnieuw.')
    } else {
      setBewerkenId(null)
      await laadCategorieen()
    }
    setBewerkenBezig(false)
  }

  // ── Verwijderen ───────────────────────────────────────────
  function startVerwijderen(cat: CategorieMetAantal) {
    setVerwijderenId(cat.id)
    setVerwijderenAantal(cat.aantalRecepten ?? 0)
    setAlgemeneFout('')
  }

  async function bevestigVerwijderen(id: string) {
    setVerwijderenBezig(true)
    setAlgemeneFout('')

    const supabase = createClient()
    const { error } = await supabase.from('categorieen').delete().eq('id', id)

    if (error) {
      setAlgemeneFout('Verwijderen mislukt. Probeer het opnieuw.')
    } else {
      setVerwijderenId(null)
      await laadCategorieen()
    }
    setVerwijderenBezig(false)
  }

  const standaard = categorieen.filter(c => c.huishouden_id === null)
  const eigen = categorieen.filter(c => c.huishouden_id !== null)

  if (laden) {
    return (
      <div className="text-center py-12 text-slate-400">
        <div className="inline-block w-5 h-5 border-2 border-slate-200 border-t-primary-500 rounded-full animate-spin mb-2" />
        <p className="text-sm">Laden…</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {algemeneFout && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {algemeneFout}
        </div>
      )}

      {/* ── Standaardcategorieën ── */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span className="text-sm font-medium text-slate-600">Standaardcategorieën</span>
          <span className="text-xs text-slate-400">(niet aanpasbaar)</span>
        </div>
        <ul className="divide-y divide-slate-100">
          {standaard.map(cat => (
            <li key={cat.id} className="flex items-center justify-between px-5 py-3">
              <span className="text-sm text-slate-700">{cat.naam}</span>
              <span className="text-xs text-slate-400">
                {cat.aantalRecepten === 1 ? '1 recept' : `${cat.aantalRecepten} recepten`}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* ── Eigen categorieën ── */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <span className="text-sm font-medium text-slate-600">Eigen categorieën</span>
          </div>
          {!toonToevoegen && (
            <button
              onClick={() => { setToonToevoegen(true); setToevoegenFout('') }}
              className="flex items-center gap-1.5 text-sm text-primary-600 font-medium hover:text-primary-700 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Toevoegen
            </button>
          )}
        </div>

        <ul className="divide-y divide-slate-100">
          {eigen.length === 0 && !toonToevoegen && (
            <li className="px-5 py-4 text-sm text-slate-400 text-center">
              Nog geen eigen categorieën.{' '}
              <button
                onClick={() => setToonToevoegen(true)}
                className="text-primary-600 hover:underline"
              >
                Voeg er een toe
              </button>
            </li>
          )}

          {eigen.map(cat => (
            <li key={cat.id}>
              {/* Verwijder-bevestiging */}
              {verwijderenId === cat.id ? (
                <div className="px-5 py-3.5 bg-red-50">
                  <p className="text-sm font-medium text-red-800 mb-1">
                    Categorie &quot;{cat.naam}&quot; verwijderen?
                  </p>
                  {verwijderenAantal > 0 && (
                    <p className="text-xs text-red-600 mb-3">
                      Deze categorie wordt van {verwijderenAantal}{' '}
                      {verwijderenAantal === 1 ? 'recept' : 'recepten'} verwijderd.
                      De recepten zelf blijven behouden.
                    </p>
                  )}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => bevestigVerwijderen(cat.id)}
                      className="btn-danger text-xs px-3 py-1.5"
                      disabled={verwijderenBezig}
                    >
                      {verwijderenBezig ? 'Verwijderen…' : 'Ja, verwijderen'}
                    </button>
                    <button
                      onClick={() => setVerwijderenId(null)}
                      className="btn-secondary text-xs px-3 py-1.5"
                      disabled={verwijderenBezig}
                    >
                      Annuleren
                    </button>
                  </div>
                </div>
              ) : bewerkenId === cat.id ? (
                /* Inline bewerken */
                <div className="px-5 py-2.5 flex items-center gap-2">
                  <input
                    ref={bewerkenInputRef}
                    type="text"
                    className="input flex-1 py-1.5 text-sm"
                    value={bewerkenNaam}
                    onChange={e => setBewerkenNaam(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') slaBewerkinOp(cat.id)
                      if (e.key === 'Escape') annuleerBewerken()
                    }}
                    disabled={bewerkenBezig}
                  />
                  <button
                    onClick={() => slaBewerkinOp(cat.id)}
                    disabled={bewerkenBezig || !bewerkenNaam.trim()}
                    className="btn-primary text-xs px-3 py-1.5 flex-shrink-0"
                  >
                    {bewerkenBezig ? 'Opslaan…' : 'Opslaan'}
                  </button>
                  <button
                    onClick={annuleerBewerken}
                    disabled={bewerkenBezig}
                    className="btn-secondary text-xs px-3 py-1.5 flex-shrink-0"
                  >
                    Annuleren
                  </button>
                </div>
              ) : (
                /* Normaal weergeven */
                <div className="flex items-center justify-between px-5 py-3 group">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-800">{cat.naam}</span>
                    <span className="text-xs text-slate-400">
                      {cat.aantalRecepten === 1 ? '1 recept' : `${cat.aantalRecepten} recepten`}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => startBewerken(cat)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                      title="Hernoemen"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => startVerwijderen(cat)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="Verwijderen"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}

          {/* Toevoegen-formulier */}
          {toonToevoegen && (
            <li className="px-5 py-3 bg-primary-50/50">
              <form onSubmit={handleToevoegen} className="flex items-center gap-2">
                <input
                  ref={nieuwInputRef}
                  type="text"
                  className="input flex-1 py-1.5 text-sm"
                  placeholder="Naam van de categorie…"
                  value={nieuwNaam}
                  onChange={e => setNieuwNaam(e.target.value)}
                  disabled={toevoegenBezig}
                  onKeyDown={e => { if (e.key === 'Escape') { setToonToevoegen(false); setNieuwNaam('') } }}
                />
                <button
                  type="submit"
                  disabled={toevoegenBezig || !nieuwNaam.trim()}
                  className="btn-primary text-xs px-3 py-1.5 flex-shrink-0"
                >
                  {toevoegenBezig ? 'Toevoegen…' : 'Toevoegen'}
                </button>
                <button
                  type="button"
                  onClick={() => { setToonToevoegen(false); setNieuwNaam(''); setToevoegenFout('') }}
                  disabled={toevoegenBezig}
                  className="btn-secondary text-xs px-3 py-1.5 flex-shrink-0"
                >
                  Annuleren
                </button>
              </form>
              {toevoegenFout && <p className="text-xs text-red-600 mt-1.5">{toevoegenFout}</p>}
            </li>
          )}
        </ul>
      </div>

      <p className="text-xs text-slate-400 text-center">
        Eigen categorieën zijn zichtbaar voor alle gezinsleden.
      </p>
    </div>
  )
}
