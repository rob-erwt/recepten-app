'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const router = useRouter()
  const [naam, setNaam] = useState('')
  const [email, setEmail] = useState('')
  const [wachtwoord, setWachtwoord] = useState('')
  const [fout, setFout] = useState('')
  const [laden, setLaden] = useState(false)
  const [bevestigd, setBevestigd] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFout('')
    setLaden(true)

    if (wachtwoord.length < 8) {
      setFout('Wachtwoord moet minimaal 8 tekens bevatten.')
      setLaden(false)
      return
    }

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password: wachtwoord,
      options: {
        data: { naam },
      },
    })

    if (error) {
      if (error.message.includes('already registered')) {
        setFout('Dit e-mailadres is al in gebruik.')
      } else {
        setFout('Er is iets misgegaan. Probeer het opnieuw.')
      }
      setLaden(false)
      return
    }

    setBevestigd(true)
    setLaden(false)
  }

  if (bevestigd) {
    return (
      <div className="card p-6 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary-100 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-slate-900 mb-2">Bevestig je e-mail</h2>
        <p className="text-sm text-slate-500">
          We hebben een bevestigingslink gestuurd naar <strong>{email}</strong>.
          Klik op de link om je account te activeren.
        </p>
        <Link href="/login" className="btn-primary mt-5 w-full">
          Terug naar inloggen
        </Link>
      </div>
    )
  }

  return (
    <div className="card p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-6">Account aanmaken</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label" htmlFor="naam">Jouw naam</label>
          <input
            id="naam"
            type="text"
            className="input"
            placeholder="Voornaam"
            value={naam}
            onChange={e => setNaam(e.target.value)}
            required
            autoComplete="given-name"
          />
        </div>

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
          />
        </div>

        <div>
          <label className="label" htmlFor="wachtwoord">Wachtwoord</label>
          <input
            id="wachtwoord"
            type="password"
            className="input"
            placeholder="Minimaal 8 tekens"
            value={wachtwoord}
            onChange={e => setWachtwoord(e.target.value)}
            required
            autoComplete="new-password"
          />
        </div>

        {fout && <p className="error-text">{fout}</p>}

        <button
          type="submit"
          className="btn-primary w-full"
          disabled={laden}
        >
          {laden ? 'Account aanmaken…' : 'Account aanmaken'}
        </button>
      </form>

      <p className="text-sm text-slate-500 text-center mt-5">
        Al een account?{' '}
        <Link href="/login" className="text-primary-600 font-medium hover:underline">
          Inloggen
        </Link>
      </p>
    </div>
  )
}
