'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface Props {
  token: string
  huishoudenNaam: string
}

export default function UitnodigingRegistreren({ token, huishoudenNaam }: Props) {
  const router = useRouter()
  const [naam, setNaam] = useState('')
  const [email, setEmail] = useState('')
  const [wachtwoord, setWachtwoord] = useState('')
  const [laden, setLaden] = useState(false)
  const [fout, setFout] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFout('')
    setLaden(true)

    // Account aanmaken gaat server-side: zelfregistratie staat uit in Supabase,
    // dus alleen een geldig uitnodigingstoken levert een nieuw account op.
    const response = await fetch('/api/uitnodiging/registreer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, naam, email, wachtwoord }),
    })

    if (!response.ok) {
      const { fout: bericht } = await response.json().catch(() => ({ fout: null }))
      setFout(bericht ?? 'Account aanmaken is mislukt. Probeer het opnieuw.')
      setLaden(false)
      return
    }

    // Het account is direct bevestigd, dus meteen inloggen.
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: wachtwoord,
    })

    setLaden(false)

    if (error) {
      setFout('Je account is aangemaakt, maar inloggen lukte niet. Probeer het via de inlogpagina.')
      return
    }

    router.push('/recepten')
    router.refresh()
  }

  return (
    <div className="card p-8">
      {/* Context */}
      <div className="flex items-center gap-3 mb-6 p-3 rounded-xl bg-primary-50 border border-primary-100">
        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <p className="text-sm text-primary-800">
          Je bent uitgenodigd om lid te worden van <strong>{huishoudenNaam}</strong>.
        </p>
      </div>

      <h2 className="text-lg font-semibold text-slate-800 mb-1">Account aanmaken</h2>
      <p className="text-sm text-slate-500 mb-5">
        Na registratie heb je direct toegang tot de recepten en het weekmenu.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label" htmlFor="naam">Jouw naam</label>
          <input
            id="naam"
            type="text"
            className="input"
            placeholder="bijv. Lisa"
            value={naam}
            onChange={e => setNaam(e.target.value)}
            required
            autoFocus
          />
        </div>

        <div>
          <label className="label" htmlFor="email">E-mailadres</label>
          <input
            id="email"
            type="email"
            className="input"
            placeholder="jij@voorbeeld.nl"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
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
            minLength={8}
            autoComplete="new-password"
          />
        </div>

        {fout && (
          <p className="text-sm text-red-600">{fout}</p>
        )}

        <button
          type="submit"
          disabled={laden}
          className="btn-primary w-full"
        >
          {laden ? (
            <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            'Account aanmaken & inloggen'
          )}
        </button>
      </form>

      <p className="text-center text-sm text-slate-500 mt-5">
        Heb je al een account?{' '}
        <Link href="/login" className="text-primary-600 hover:underline font-medium">
          Inloggen
        </Link>
      </p>
    </div>
  )
}
