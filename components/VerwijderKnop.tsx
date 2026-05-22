'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function VerwijderKnop({ receptId }: { receptId: string }) {
  const router = useRouter()
  const [toonBevestiging, setToonBevestiging] = useState(false)
  const [laden, setLaden] = useState(false)
  const [fout, setFout] = useState('')

  async function handleVerwijder() {
    setLaden(true)
    setFout('')
    const supabase = createClient()

    const { error } = await supabase.from('recepten').delete().eq('id', receptId)

    if (error) {
      setFout('Verwijderen mislukt. Probeer het opnieuw.')
      setLaden(false)
      return
    }

    router.push('/recepten')
    router.refresh()
  }

  if (toonBevestiging) {
    return (
      <div className="card p-4 border-red-200 bg-red-50">
        <p className="text-sm font-medium text-red-800 mb-3">
          Weet je zeker dat je dit recept wilt verwijderen? Dit kan niet ongedaan worden gemaakt.
        </p>
        {fout && <p className="error-text mb-2">{fout}</p>}
        <div className="flex items-center gap-2">
          <button
            onClick={handleVerwijder}
            className="btn-danger text-xs px-3 py-2"
            disabled={laden}
          >
            {laden ? 'Verwijderen…' : 'Ja, verwijderen'}
          </button>
          <button
            onClick={() => setToonBevestiging(false)}
            className="btn-secondary text-xs px-3 py-2"
            disabled={laden}
          >
            Annuleren
          </button>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => setToonBevestiging(true)}
      className="btn-secondary text-red-600 border-red-200 hover:bg-red-50"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
      Verwijderen
    </button>
  )
}
