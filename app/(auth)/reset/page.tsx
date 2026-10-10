'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ResetPage() {
  const [email, setEmail] = useState('')
  const [laden, setLaden] = useState(false)
  const [succes, setSucces] = useState(false)
  const [fout, setFout] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFout('')
    setLaden(true)

    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset/confirm`,
    })

    setLaden(false)

    if (error) {
      setFout('Er is iets misgegaan. Probeer het opnieuw.')
      return
    }

    setSucces(true)
  }

  if (succes) {
    return (
      <div className="card p-8 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary-100 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-slate-900 mb-2">Controleer je e-mail</h2>
        <p className="text-sm text-slate-500 mb-5">
          Als het e-mailadres bekend is in ons systeem, ontvang je binnen enkele minuten
          een link om je wachtwoord te resetten.
        </p>
        <Link href="/login" className="btn-primary w-full">
          Terug naar inloggen
        </Link>
      </div>
    )
  }

  return (
    <div className="card p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-6">Wachtwoord vergeten?</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label" htmlFor="email">E-mailadres</label>
          <input
            id="email"
            type="email"
            className="input"
            placeholder="naam@voorbeeld.nl"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
            autoFocus
          />
        </div>

        {fout && <p className="error-text">{fout}</p>}

        <button
          type="submit"
          className="btn-primary w-full"
          disabled={laden}
        >
          {laden ? 'Bezig met versturen...' : 'Stuur resetlink'}
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
