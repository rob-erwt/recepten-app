import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import VerwijderKnop from '@/components/VerwijderKnop'
import FotoLightbox from '@/components/FotoLightbox'
import ReceptWeekMenuKiezer from '@/components/ReceptWeekMenuKiezer'

export default async function ReceptDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: gebruiker } = await supabase
    .from('gebruikers')
    .select('huishouden_id')
    .eq('id', user.id)
    .single()

  const { data: recept } = await supabase
    .from('recepten')
    .select(`
      *,
      ingredienten (id, naam, hoeveelheid, eenheid, volgorde),
      stappen (id, stap_nummer, omschrijving),
      recept_categorieen (
        categorieen (id, naam, volgorde)
      )
    `)
    .eq('id', params.id)
    .single()

  if (!recept) notFound()

  const ingredienten = [...recept.ingredienten].sort((a, b) => a.volgorde - b.volgorde)
  const stappen = [...recept.stappen].sort((a, b) => a.stap_nummer - b.stap_nummer)
  const categorieen = (recept.recept_categorieen ?? [])
    .map((rc: { categorieen: { id: string; naam: string; volgorde: number } | null }) => rc.categorieen)
    .filter((c): c is { id: string; naam: string; volgorde: number } => c !== null)
    .sort((a, b) => a.volgorde - b.volgorde)

  function formatHoeveelheid(hoev: number | null, eenheid: string | null) {
    if (!hoev && !eenheid) return null
    const h = hoev ? hoev.toString() : ''
    return [h, eenheid].filter(Boolean).join(' ')
  }

  return (
    <div>
      {/* Terug + acties */}
      <div className="flex items-center justify-between mb-6 gap-4">
        <Link
          href="/recepten"
          className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 transition-colors text-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Alle recepten
        </Link>

        <div className="flex items-center gap-2">
          <Link href={`/recepten/${recept.id}/bewerken`} className="btn-secondary text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Bewerken
          </Link>
          <VerwijderKnop receptId={recept.id} />
        </div>
      </div>

      {/* Foto */}
      {recept.foto_url && (
        <FotoLightbox src={recept.foto_url} alt={recept.naam} />
      )}

      {/* Naam + beschrijving */}
      <h1 className="mb-1">{recept.naam}</h1>
      {recept.beschrijving && (
        <p className="text-slate-500 text-sm mb-3">{recept.beschrijving}</p>
      )}

      {/* Categorieën */}
      {categorieen.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap mb-4">
          {categorieen.map(cat => (
            <span
              key={cat.id}
              className="px-2.5 py-1 rounded-full text-xs font-medium bg-primary-50 text-primary-700 border border-primary-100"
            >
              {cat.naam}
            </span>
          ))}
        </div>
      )}

      {/* Metainfo */}
      {(recept.bereidingstijd_min || recept.aantal_personen) && (
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          {recept.bereidingstijd_min && (
            <div className="flex items-center gap-2 bg-primary-50 text-primary-700 rounded-lg px-3 py-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium">
                {recept.bereidingstijd_min < 60
                  ? `${recept.bereidingstijd_min} minuten`
                  : `${Math.floor(recept.bereidingstijd_min / 60)}u${recept.bereidingstijd_min % 60 > 0 ? ` ${recept.bereidingstijd_min % 60}m` : ''}`}
              </span>
            </div>
          )}
          {recept.aantal_personen && (
            <div className="flex items-center gap-2 bg-slate-100 text-slate-700 rounded-lg px-3 py-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-sm font-medium">
                {recept.aantal_personen} {recept.aantal_personen === 1 ? 'persoon' : 'personen'}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Ingrediënten */}
      {ingredienten.length > 0 && (
        <div className="card p-5 mb-4">
          <h2 className="mb-3">Ingrediënten</h2>
          <ul className="space-y-2">
            {ingredienten.map(ing => (
              <li key={ing.id} className="flex items-baseline gap-2 text-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-400 flex-shrink-0 mt-1.5" />
                {formatHoeveelheid(ing.hoeveelheid, ing.eenheid) && (
                  <span className="font-medium text-slate-700 flex-shrink-0">
                    {formatHoeveelheid(ing.hoeveelheid, ing.eenheid)}
                  </span>
                )}
                <span className="text-slate-800">{ing.naam}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Bereidingsstappen */}
      {stappen.length > 0 && (
        <div className="card p-5">
          <h2 className="mb-4">Bereiding</h2>
          <ol className="space-y-4">
            {stappen.map(stap => (
              <li key={stap.id} className="flex gap-4">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary-500 text-white text-xs font-semibold flex items-center justify-center mt-0.5">
                  {stap.stap_nummer}
                </span>
                <p className="text-sm text-slate-700 leading-relaxed pt-1">{stap.omschrijving}</p>
              </li>
            ))}
          </ol>
        </div>
      )}

      {ingredienten.length === 0 && stappen.length === 0 && (
        <div className="card p-5 text-center text-slate-400 text-sm">
          Dit recept heeft nog geen ingrediënten of stappen.{' '}
          <Link href={`/recepten/${recept.id}/bewerken`} className="text-primary-600 hover:underline">
            Voeg ze toe
          </Link>
          .
        </div>
      )}

      {/* Weekmenu-kiezer */}
      {gebruiker?.huishouden_id && (
        <div className="mt-4">
          <ReceptWeekMenuKiezer
            receptId={recept.id}
            huishoudenId={gebruiker.huishouden_id}
          />
        </div>
      )}
    </div>
  )
}
