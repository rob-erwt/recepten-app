'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Recept, ReceptInvoer, IngredientInvoer, StapInvoer, Categorie } from '@/lib/types'
import { naamGelijkenis, ingredientenOverlap, dubbeleScore, DREMPELWAARDE, type BestaandRecept } from '@/lib/duplicaten'

type Props = {
  recept?: Recept              // bewerk-modus (heeft DB-ids)
  initialValues?: ReceptInvoer // import-modus (geen DB-ids)
  huishoudenId: string
}

const leegIngredient = (): IngredientInvoer => ({ naam: '', hoeveelheid: '', eenheid: '' })
const legeStap = (): StapInvoer => ({ omschrijving: '' })


export default function ReceptFormulier({ recept, initialValues, huishoudenId }: Props) {
  const router = useRouter()
  const bewerkModus = !!recept

  // Basisvelden — prioriteit: recept > initialValues > leeg
  const [naam, setNaam] = useState(recept?.naam ?? initialValues?.naam ?? '')
  const [beschrijving, setBeschrijving] = useState(recept?.beschrijving ?? initialValues?.beschrijving ?? '')
  const [aantalPersonen, setAantalPersonen] = useState(
    recept?.aantal_personen?.toString() ?? initialValues?.aantal_personen ?? ''
  )
  const [bereidingstijd, setBereidingstijd] = useState(
    recept?.bereidingstijd_min?.toString() ?? initialValues?.bereidingstijd_min ?? ''
  )

  const [ingredienten, setIngredienten] = useState<IngredientInvoer[]>(
    recept?.ingredienten.length
      ? recept.ingredienten.map(i => ({
          naam: i.naam,
          hoeveelheid: i.hoeveelheid?.toString() ?? '',
          eenheid: i.eenheid ?? '',
        }))
      : initialValues?.ingredienten?.length
        ? initialValues.ingredienten
        : [leegIngredient()]
  )

  const [stappen, setStappen] = useState<StapInvoer[]>(
    recept?.stappen.length
      ? recept.stappen.map(s => ({ omschrijving: s.omschrijving }))
      : initialValues?.stappen?.length
        ? initialValues.stappen
        : [legeStap()]
  )

  // Foto
  const [fotoUrl, setFotoUrl] = useState<string | null>(
    recept?.foto_url ?? initialValues?.foto_url ?? null
  )
  const [fotoUploaden, setFotoUploaden] = useState(false)
  const [fotoFout, setFotoFout] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Categorieën
  const [beschikbareCategorieen, setBeschikbareCategorieen] = useState<Categorie[]>([])
  const [geselecteerdeCategorieen, setGeselecteerdeCategorieen] = useState<string[]>(
    recept?.categorie_ids ?? []
  )

  // Dubbelen-detectie
  const [bestaandeRecepten, setBestaandeRecepten] = useState<BestaandRecept[]>([])
  const [mogelijkeDubbelen, setMogelijkeDubbelen] = useState<{ id: string; naam: string; score: number }[]>([])
  const [waarschuwingWeggedrukt, setWaarschuwingWeggedrukt] = useState(false)

  const [fout, setFout] = useState('')
  const [laden, setLaden] = useState(false)

  // Categorieën + bestaande recepten parallel ophalen
  useEffect(() => {
    async function laadData() {
      const supabase = createClient()
      const [catResult, recResult] = await Promise.all([
        supabase
          .from('categorieen')
          .select('id, naam, volgorde, huishouden_id')
          .order('naam'),
        supabase
          .from('recepten')
          .select('id, naam, ingredienten(naam)'),
      ])
      if (catResult.data) setBeschikbareCategorieen(catResult.data)
      if (recResult.data) {
        setBestaandeRecepten(
          recResult.data.map(r => ({
            id: r.id,
            naam: r.naam,
            ingredienten: (r.ingredienten as { naam: string }[]).map(i => i.naam),
          }))
        )
      }
    }
    laadData()
  }, [])

  // Debounced dubbelen-check (600 ms na typen)
  useEffect(() => {
    if (!naam.trim() || bestaandeRecepten.length === 0) {
      setMogelijkeDubbelen([])
      return
    }

    const timer = setTimeout(() => {
      const huidigIngredientenNamen = ingredienten
        .map(i => i.naam.trim())
        .filter(Boolean)

      const gevonden = bestaandeRecepten
        // In bewerkmodus: het recept zelf uitsluiten
        .filter(r => !bewerkModus || r.id !== recept?.id)
        .map(r => ({ ...r, score: dubbeleScore(naam, huidigIngredientenNamen, r) }))
        .filter(r => r.score >= DREMPELWAARDE)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)

      setMogelijkeDubbelen(gevonden)
      // Waarschuwing opnieuw tonen als er nieuwe dubbelen gevonden zijn
      if (gevonden.length > 0) setWaarschuwingWeggedrukt(false)
    }, 600)

    return () => clearTimeout(timer)
  }, [naam, ingredienten, bestaandeRecepten, bewerkModus, recept?.id])

  function toggleCategorie(id: string) {
    setGeselecteerdeCategorieen(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
  }

  // ── Ingrediënten helpers ──────────────────────────────────
  function updateIngredient(index: number, veld: keyof IngredientInvoer, waarde: string) {
    setIngredienten(prev => prev.map((ing, i) => i === index ? { ...ing, [veld]: waarde } : ing))
  }
  function voegIngredientToe() { setIngredienten(prev => [...prev, leegIngredient()]) }
  function verwijderIngredient(index: number) { setIngredienten(prev => prev.filter((_, i) => i !== index)) }

  // ── Stappen helpers ───────────────────────────────────────
  function updateStap(index: number, waarde: string) {
    setStappen(prev => prev.map((s, i) => i === index ? { omschrijving: waarde } : s))
  }
  function voegStapToe() { setStappen(prev => [...prev, legeStap()]) }
  function verwijderStap(index: number) { setStappen(prev => prev.filter((_, i) => i !== index)) }

  // ── Foto uploaden ─────────────────────────────────────────
  async function handleFotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const bestand = e.target.files?.[0]
    if (!bestand) return

    // Validatie
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(bestand.type)) {
      setFotoFout('Alleen JPG, PNG en WebP zijn toegestaan.')
      return
    }
    if (bestand.size > 10 * 1024 * 1024) {
      setFotoFout('De foto mag maximaal 10 MB zijn.')
      return
    }

    setFotoFout('')
    setFotoUploaden(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setFotoFout('Niet ingelogd.')
      setFotoUploaden(false)
      return
    }

    const ext = bestand.type.replace('image/', '').replace('jpeg', 'jpg')
    const pad = `user-uploads/${user.id}/${Date.now()}.${ext}`

    const { error } = await supabase.storage
      .from('recepten-fotos')
      .upload(pad, bestand, { contentType: bestand.type })

    if (error) {
      setFotoFout('Uploaden mislukt. Probeer het opnieuw.')
      setFotoUploaden(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    const { data } = supabase.storage.from('recepten-fotos').getPublicUrl(pad)
    setFotoUrl(data.publicUrl)
    setFotoUploaden(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ── Opslaan ───────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!naam.trim()) {
      setFout('De naam van het recept is verplicht.')
      return
    }
    setFout('')
    setLaden(true)

    const supabase = createClient()

    try {
      let receptId = recept?.id

      const receptData = {
        naam: naam.trim(),
        beschrijving: beschrijving.trim() || null,
        aantal_personen: aantalPersonen ? parseInt(aantalPersonen) : null,
        bereidingstijd_min: bereidingstijd ? parseInt(bereidingstijd) : null,
        foto_url: fotoUrl ?? null,
        huishouden_id: huishoudenId,
      }

      if (bewerkModus && receptId) {
        const { error } = await supabase.from('recepten').update(receptData).eq('id', receptId)
        if (error) throw error
      } else {
        const { data, error } = await supabase.from('recepten').insert(receptData).select('id').single()
        if (error) throw error
        receptId = data.id
      }

      // Ingrediënten opslaan (delete + insert)
      await supabase.from('ingredienten').delete().eq('recept_id', receptId)
      const geldigeIngredienten = ingredienten.filter(i => i.naam.trim())
      if (geldigeIngredienten.length > 0) {
        const { error } = await supabase.from('ingredienten').insert(
          geldigeIngredienten.map((ing, idx) => ({
            recept_id: receptId,
            naam: ing.naam.trim(),
            hoeveelheid: ing.hoeveelheid ? parseFloat(ing.hoeveelheid) : null,
            eenheid: ing.eenheid.trim() || null,
            volgorde: idx,
          }))
        )
        if (error) throw error
      }

      // Stappen opslaan (delete + insert)
      await supabase.from('stappen').delete().eq('recept_id', receptId)
      const geldigeStappen = stappen.filter(s => s.omschrijving.trim())
      if (geldigeStappen.length > 0) {
        const { error } = await supabase.from('stappen').insert(
          geldigeStappen.map((stap, idx) => ({
            recept_id: receptId,
            stap_nummer: idx + 1,
            omschrijving: stap.omschrijving.trim(),
          }))
        )
        if (error) throw error
      }

      // Categorieën opslaan (delete + insert)
      await supabase.from('recept_categorieen').delete().eq('recept_id', receptId)
      if (geselecteerdeCategorieen.length > 0) {
        const { error } = await supabase.from('recept_categorieen').insert(
          geselecteerdeCategorieen.map(catId => ({
            recept_id: receptId,
            categorie_id: catId,
          }))
        )
        if (error) throw error
      }

      router.push(`/recepten/${receptId}`)
      router.refresh()
    } catch {
      setFout('Er is iets misgegaan. Probeer het opnieuw.')
      setLaden(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basisgegevens */}
      <div className="card p-5 space-y-4">
        <h2>Basisgegevens</h2>

        <div>
          <label className="label" htmlFor="naam">
            Naam <span className="text-red-500">*</span>
          </label>
          <input
            id="naam"
            type="text"
            className="input"
            placeholder="bijv. Pasta Carbonara"
            value={naam}
            onChange={e => { setNaam(e.target.value); setWaarschuwingWeggedrukt(false) }}
            required
          />

          {/* Dubbelen-waarschuwing */}
          {mogelijkeDubbelen.length > 0 && !waarschuwingWeggedrukt && (
            <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <div className="flex items-start gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-amber-800">
                    Mogelijk al aanwezig in je recepten
                  </p>
                  <ul className="mt-1 space-y-0.5">
                    {mogelijkeDubbelen.map(r => (
                      <li key={r.id} className="flex items-center gap-1.5">
                        <a
                          href={`/recepten/${r.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-amber-700 hover:text-amber-900 hover:underline truncate"
                        >
                          {r.naam}
                        </a>
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-amber-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-amber-600 mt-1.5">
                    Je kunt het recept toch opslaan als je wilt.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setWaarschuwingWeggedrukt(true)}
                  className="flex-shrink-0 text-amber-400 hover:text-amber-600 transition-colors"
                  aria-label="Waarschuwing sluiten"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="label" htmlFor="beschrijving">Korte omschrijving</label>
          <input
            id="beschrijving"
            type="text"
            className="input"
            placeholder="bijv. Klassiek Italiaans gerecht met ei en spek"
            value={beschrijving}
            onChange={e => setBeschrijving(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="personen">Aantal personen</label>
            <input
              id="personen"
              type="number"
              min="1"
              max="99"
              className="input"
              placeholder="bijv. 4"
              value={aantalPersonen}
              onChange={e => setAantalPersonen(e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="tijd">Bereidingstijd (min)</label>
            <input
              id="tijd"
              type="number"
              min="1"
              max="999"
              className="input"
              placeholder="bijv. 30"
              value={bereidingstijd}
              onChange={e => setBereidingstijd(e.target.value)}
            />
          </div>
        </div>

        {/* Foto */}
        <div>
          <p className="label">Foto</p>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={handleFotoUpload}
            disabled={fotoUploaden}
          />

          {fotoUrl ? (
            /* Preview met acties */
            <div className="space-y-2">
              <div className="relative w-full rounded-lg overflow-hidden bg-slate-100 aspect-video">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={fotoUrl}
                  alt="Receptfoto"
                  className="w-full h-full object-cover"
                  onError={e => {
                    ;(e.currentTarget as HTMLImageElement).closest('div')!.style.display = 'none'
                  }}
                />
                {/* Verwijder-knop */}
                <button
                  type="button"
                  onClick={() => { setFotoUrl(null); setFotoFout('') }}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors"
                  title="Foto verwijderen"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={fotoUploaden}
                className="text-sm text-primary-600 font-medium hover:text-primary-700 flex items-center gap-1.5"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Andere foto kiezen
              </button>
            </div>
          ) : (
            /* Upload-knop */
            <button
              type="button"
              onClick={() => { setFotoFout(''); fileInputRef.current?.click() }}
              disabled={fotoUploaden}
              className={`w-full rounded-lg border-2 border-dashed transition-colors p-6 flex flex-col items-center gap-2 ${
                fotoUploaden
                  ? 'border-slate-200 bg-slate-50 cursor-not-allowed'
                  : 'border-slate-300 hover:border-primary-400 hover:bg-primary-50/50 cursor-pointer'
              }`}
            >
              {fotoUploaden ? (
                <>
                  <div className="w-6 h-6 border-2 border-slate-300 border-t-primary-500 rounded-full animate-spin" />
                  <span className="text-sm text-slate-500">Uploaden…</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-sm font-medium text-slate-600">Foto toevoegen</span>
                  <span className="text-xs text-slate-400">JPG, PNG of WebP · max 10 MB</span>
                </>
              )}
            </button>
          )}

          {fotoFout && <p className="error-text mt-1.5">{fotoFout}</p>}
        </div>

        {/* Categorieën */}
        {beschikbareCategorieen.length > 0 && (
          <div>
            <p className="label">Categorie</p>
            <div className="flex flex-wrap gap-2">
              {beschikbareCategorieen.map(cat => {
                const geselecteerd = geselecteerdeCategorieen.includes(cat.id)
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleCategorie(cat.id)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                      geselecteerd
                        ? 'bg-primary-500 border-primary-500 text-white'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-primary-300 hover:text-primary-700'
                    }`}
                  >
                    {geselecteerd && (
                      <span className="mr-1">✓</span>
                    )}
                    {cat.naam}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Ingrediënten */}
      <div className="card p-5 space-y-3">
        <h2>Ingrediënten</h2>

        <div className="space-y-2">
          {ingredienten.map((ing, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                type="number"
                className="input w-24 flex-shrink-0"
                placeholder="Hoev."
                value={ing.hoeveelheid}
                onChange={e => updateIngredient(idx, 'hoeveelheid', e.target.value)}
                min="0"
                step="any"
              />
              <input
                type="text"
                className="input w-24 flex-shrink-0"
                placeholder="Eenheid"
                value={ing.eenheid}
                onChange={e => updateIngredient(idx, 'eenheid', e.target.value)}
              />
              <input
                type="text"
                className="input flex-1"
                placeholder="Ingrediënt"
                value={ing.naam}
                onChange={e => updateIngredient(idx, 'naam', e.target.value)}
              />
              {ingredienten.length > 1 && (
                <button
                  type="button"
                  onClick={() => verwijderIngredient(idx)}
                  className="flex-shrink-0 p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={voegIngredientToe}
          className="text-sm text-primary-600 font-medium hover:text-primary-700 flex items-center gap-1.5"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Ingrediënt toevoegen
        </button>
      </div>

      {/* Bereidingsstappen */}
      <div className="card p-5 space-y-3">
        <h2>Bereidingsstappen</h2>

        <div className="space-y-3">
          {stappen.map((stap, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-xs font-semibold flex items-center justify-center mt-2.5">
                {idx + 1}
              </span>
              <textarea
                className="input flex-1 resize-none min-h-[72px]"
                placeholder={`Stap ${idx + 1}…`}
                value={stap.omschrijving}
                onChange={e => updateStap(idx, e.target.value)}
                rows={2}
              />
              {stappen.length > 1 && (
                <button
                  type="button"
                  onClick={() => verwijderStap(idx)}
                  className="flex-shrink-0 p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors mt-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={voegStapToe}
          className="text-sm text-primary-600 font-medium hover:text-primary-700 flex items-center gap-1.5"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Stap toevoegen
        </button>
      </div>

      {fout && <p className="error-text">{fout}</p>}

      {/* Acties */}
      <div className="flex items-center justify-between gap-3">
        <button type="button" onClick={() => router.back()} className="btn-secondary">
          Annuleren
        </button>
        <button type="submit" className="btn-primary" disabled={laden}>
          {laden ? 'Opslaan…' : bewerkModus ? 'Wijzigingen opslaan' : 'Recept opslaan'}
        </button>
      </div>
    </form>
  )
}
