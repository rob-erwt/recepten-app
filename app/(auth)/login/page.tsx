'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [wachtwoord, setWachtwoord] = useState('')
  const [fout, setFout] = useState('')
  const [laden, setLaden] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFout('')
    setLaden(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password: wachtwoord })

    if (error) {
      setFout('E-mailadres of wachtwoord is onjuist.')
      setLaden(false)
      return
    }

    router.push('/recepten')
    router.refresh()
  }

  return (
    <div className="card p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-6">Inloggen</h2>

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
          />
        </div>

        <div>
          <label className="label" htmlFor="wachtwoord">Wachtwoord</label>
          <input
            id="wachtwoord"
            type="password"
            className="input"
            placeholder="••••••••"
            value={wachtwoord}
            onChange={e => setWachtwoord(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>

        {fout && <p className="error-text">{fout}</p>}

        <button
          type="submit"
          className="btn-primary w-full"
          disabled={laden}
        >
          {laden ? 'Bezig met inloggen…' : 'Inloggen'}
        </button>
      </form>

      <p className="text-sm text-slate-500 text-center mt-5">
        Nog geen account? Registreren gaat{' '}
        <Link href="/register" className="text-primary-600 font-medium hover:underline">
          op uitnodiging
        </Link>
      </p>
    </div>
  )
}
