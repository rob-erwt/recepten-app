'use client'

import { useState } from 'react'
import ReceptFormulier from '@/components/ReceptFormulier'
import type { ReceptInvoer } from '@/lib/types'

type Status = 'idle' | 'laden' | 'gevonden' | 'mislukt'

export default function URLImportFormulier({ huishoudenId }: { huishoudenId: string }) {
  const [url, setUrl] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [fout, setFout] = useState('')
  const [geimporteerd, setGeimporteerd] = useState<ReceptInvoer | null>(null)

  async function handleImport(e: React.FormEvent) {
    e.preventDefault()
    setFout('')
    setStatus('laden')

    try {
      const res = await fetch('/api/import-recept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })

      const data = await res.json()

      if (!res.ok || data.error) {
        setFout(data.error ?? 'Er is iets misgegaan.')
        setStatus('mislukt')
        return
      }

      setGeimporteerd(data.recept)
      setStatus('gevonden')
    } catch {
      setFout('Er is een onverwachte fout opgetreden.')
      setStatus('mislukt')
    }
  }

  function handleOpnieuw() {
    setStatus('idle')
    setFout('')
    setGeimporteerd(null)
    setUrl('')
  }

  // — Stap 1: URL invoeren —
  if (status === 'idle' || status === 'laden' || status === 'mislukt') {
    return (
      <div className="space-y-4">
        <div className="card p-5">
          <h2 className="mb-1">Recept-URL plakken</h2>
          <p className="text-sm text-slate-500 mb-4">
            Werkt met de meeste grote receptsites (Albert Heijn, Jumbo, Allerhande, 15gram, etc.)
            die gestructureerde receptdata aanbieden.
          </p>

          <form onSubmit={handleImport} className="space-y-3">
            <div>
              <label className="label" htmlFor="url">URL</label>
              <input
                id="url"
                type="url"
                className="input"
                placeholder="https://www.allerhande.nl/recept/..."
                value={url}
                onChange={e => setUrl(e.target.value)}
                required
                disabled={status === 'laden'}
                // eslint-disable-next-line jsx-a11y/no-autofocus
                autoFocus
              />
            </div>

            {status === 'mislukt' && (
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
                <p className="font-medium mb-0.5">Importeren mislukt</p>
                <p>{fout}</p>
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                type="submit"
                className="btn-primary"
                disabled={status === 'laden' || !url}
              >
                {status === 'laden' ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Importeren…
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Recept importeren
                  </>
                )}
              </button>

              {status === 'mislukt' && (
                <span className="text-sm text-slate-500">
                  of{' '}
                  <button
                    type="button"
                    className="text-primary-600 font-medium hover:underline"
                    onClick={() => {
                      setStatus('gevonden')
                      setGeimporteerd({
                        naam: '',
                        beschrijving: '',
                        aantal_personen: '',
                        bereidingstijd_min: '',
                        ingredienten: [{ naam: '', hoeveelheid: '', eenheid: '' }],
                        stappen: [{ omschrijving: '' }],
                      })
                    }}
                  >
                    handmatig invullen
                  </button>
                </span>
              )}
            </div>
          </form>
        </div>
      </div>
    )
  }

  // — Stap 2: Bevestigen & opslaan —
  const heeftFoto = !!geimporteerd?.foto_url

  return (
    <div className="space-y-4">
      {/* Succes-banner */}
      <div className="rounded-xl bg-primary-50 border border-primary-200 overflow-hidden">
        {/* Foto – toon breed als die er is */}
        {heeftFoto && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={geimporteerd!.foto_url!}
            alt="Geïmporteerde receptfoto"
            className="w-full h-44 object-cover"
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
          />
        )}

        <div className="p-4 flex items-start gap-3">
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center mt-0.5">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-primary-800">
              Recept gevonden!
              {heeftFoto && (
                <span className="ml-2 text-xs font-normal text-primary-600">inclusief foto</span>
              )}
            </p>
            <p className="text-xs text-primary-600 mt-0.5 break-all">{url}</p>
          </div>
          <button
            onClick={handleOpnieuw}
            className="flex-shrink-0 text-xs text-primary-600 hover:text-primary-800 font-medium"
          >
            Andere URL
          </button>
        </div>
      </div>

      <p className="text-sm text-slate-500">
        Controleer de gegevens hieronder en pas aan waar nodig, daarna sla je het recept op.
      </p>

      <ReceptFormulier
        huishoudenId={huishoudenId}
        initialValues={geimporteerd ?? undefined}
      />
    </div>
  )
}
