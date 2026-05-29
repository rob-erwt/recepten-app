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
  const [bevestigingNodig, setBevestigingNodig] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFout('')
    setLaden(true)

    const supabase = createClient()

    const { data, error } = await supabase.auth.signUp({
      email,
      password: wachtwoord,
      options: {
        // De uitnodiging_token in de metadata wordt door de DB-trigger opgepikt:
        // de nieuwe gebruiker wordt automatisch gekoppeld aan het bestaande huishouden.
        data: {
          naam,
          uitnodiging_token: token,
        },
      },
    })

    setLaden(false)

    if (error) {
      if (error.message.includes('already registered')) {
        setFout('Dit e-mailadres is al in gebruik. Probeer in te loggen.')
      } else {
        setFout(error.message)
      }
      return
    }

    // Supabase kan e-mailbevestiging vereisen; controleer of de sessie direct actief is.
    if (data.session) {
      router.push('/recepten')
      router.refresh()
    } else {
      setBevestigingNodig(true)
    }
  }

  if (bevestigingNodig) {
    return (
      <div className="card p-8 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-100 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-slate-800 mb-2">Bevestig je e-mail</h2>
        <p className="text-sm text-slate-500">
          We hebben een bevestigingsmail gestuurd naar <strong>{email}</strong>.
          Klik op de link in de mail om je account te activeren en in te loggen.
        </p>
      </div>
    )
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
            placeholder="Minimaal 6 tekens"
            value={wachtwoord}
            onChange={e => setWachtwoord(e.target.value)}
            required
            minLength={6}
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
