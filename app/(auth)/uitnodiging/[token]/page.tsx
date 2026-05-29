import { createClient } from '@supabase/supabase-js'
import UitnodigingRegistreren from '@/components/UitnodigingRegistreren'
import Link from 'next/link'

interface Props {
  params: { token: string }
}

export default async function UitnodigingPage({ params }: Props) {
  // Valideer het token server-side via de security-definer functie (bypast RLS).
  // We gebruiken de anon key — de functie is publiek toegankelijk gemaakt via GRANT.
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data, error } = await supabase.rpc('valideer_uitnodiging', {
    p_token: params.token,
  })

  const validatie = data?.[0]
  const geldig = !error && validatie?.geldig === true

  if (!geldig) {
    return (
      <div className="card p-8 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-red-100 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-slate-800 mb-2">Uitnodiging niet geldig</h2>
        <p className="text-sm text-slate-500 mb-5">
          Deze uitnodigingslink is verlopen, al gebruikt, of bestaat niet.
          Vraag een nieuw linkje aan het gezinslid dat je heeft uitgenodigd.
        </p>
        <Link href="/login" className="text-sm text-primary-600 hover:underline">
          Terug naar inloggen
        </Link>
      </div>
    )
  }

  return (
    <UitnodigingRegistreren
      token={params.token}
      huishoudenNaam={validatie.huishouden_naam ?? 'het huishouden'}
    />
  )
}
