'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function ResetConfirmContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [wachtwoord, setWachtwoord] = useState('')
  const [wachtwoordHerhaal, setWachtwoordHerhaal] = useState('')
  const [laden, setLaden] = useState(false)
  const [succes, setSucces] = useState(false)
  const [fout, setFout] = useState('')
  const [tokenGeldig, setTokenGeldig] = useState(true)

  // Controleer of de token geldig is
  useEffect(() => {
    const code = searchParams.get('code')
    const type = searchParams.get('type')

    if (type !== 'recovery' || !code) {
      setTokenGeldig(false)
    }
  }, [searchParams])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFout('')
    setLaden(true)

    if (wachtwoord !== wachtwoordHerhaal) {
      setFout('De wachtwoorden komen niet overeen.')
      setLaden(false)
      return
    }

    if (wachtwoord.length < 8) {
      setFout('Wachtwoord moet minimaal 8 tekens bevatten.')
      setLaden(false)
      return
    }

    const supabase = createClient()
    const code = searchParams.get('code')
    
    const { error } = await supabase.auth.exchangeCodeForSession(code!)

    if (error) {
      setFout('De resetlink is verlopen of ongeldig. Vraag een nieuwe link aan.')
      setLaden(false)
      setTokenGeldig(false)
      return
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: wachtwoord,
    })

    setLaden(false)

    if (updateError) {
      setFout('Er is iets misgegaan bij het updaten van je wachtwoord.')
      return
    }

    setSucces(true)
    
    // Wacht 2 seconden en redirect naar login
    setTimeout(() => {
      router.push('/login')
    }, 2000)
  }

  if (!tokenGeldig && !succes) {
    return (
      <div className="card p-8 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-red-100 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-slate-800 mb-2">Resetlink niet geldig</h2>
        <p className="text-sm text-slate-500 mb-5">
          Deze wachtwoord-resetlink is verlopen of al gebruikt.
          Vraag een nieuwe link aan.
        </p>
        <Link href="/auth/reset" className="btn-primary w-full">
          Vraag nieuwe resetlink aan
        </Link>
      </div>
    )
  }

  if (succes) {
    return (
      <div className="card p-8 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary-100 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-slate-900 mb-2">Wachtwoord gewijzigd!</h2>
        <p className="text-sm text-slate-500 mb-5">
          Je wachtwoord is succesvol gewijzigd. Je wordt doorgestuurd naar de inlogpagina...
        </p>
      </div>
    )
  }

  return (
    <div className="card p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-6">Stel nieuw wachtwoord in</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label" htmlFor="wachtwoord">Nieuw wachtwoord</label>
          <input
            id="wachtwoord"
            type="password"
            className="input"
            placeholder="Minimaal 8 tekens"
            value={wachtwoord}
            onChange={e => setWachtwoord(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            autoFocus
          />
        </div>

        <div>
          <label className="label" htmlFor="wachtwoordHerhaal">Herhaal nieuw wachtwoord</label>
          <input
            id="wachtwoordHerhaal"
            type="password"
            className="input"
            placeholder="Bevestig je nieuwe wachtwoord"
            value={wachtwoordHerhaal}
            onChange={e => setWachtwoordHerhaal(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />
        </div>

        {fout && <p className="error-text">{fout}</p>}

        <button
          type="submit"
          className="btn-primary w-full"
          disabled={laden}
        >
          {laden ? 'Bezig met opslaan...' : 'Wachtwoord wijzigen'}
        </button>
      </form>

      <p className="text-sm text-slate-500 text-center mt-5">
        <Link href="/login" className="text-primary-600 font-medium hover:underline">
          Terug naar inloggen
        </Link>
      </p>
    </div>
  )
}

export default function ResetConfirmPage() {
  return (
    <Suspense fallback={<div>Laden...</div>}>
      <ResetConfirmContent />
    </Suspense>
  )
}
