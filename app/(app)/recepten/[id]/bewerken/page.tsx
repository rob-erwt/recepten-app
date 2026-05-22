import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import ReceptFormulier from '@/components/ReceptFormulier'

export default async function BewerkenPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: gebruiker } = await supabase
    .from('gebruikers')
    .select('huishouden_id')
    .eq('id', user.id)
    .single()

  if (!gebruiker?.huishouden_id) redirect('/recepten')

  const { data: recept } = await supabase
    .from('recepten')
    .select(`
      *,
      ingredienten (id, recept_id, naam, hoeveelheid, eenheid, volgorde),
      stappen (id, recept_id, stap_nummer, omschrijving),
      recept_categorieen (categorie_id)
    `)
    .eq('id', params.id)
    .single()

  if (!recept) notFound()

  const receptMet = {
    ...recept,
    ingredienten: [...recept.ingredienten].sort((a, b) => a.volgorde - b.volgorde),
    stappen: [...recept.stappen].sort((a, b) => a.stap_nummer - b.stap_nummer),
    // Platte lijst van categorie-UUIDs voor de picker
    categorie_ids: (recept.recept_categorieen ?? []).map(
      (rc: { categorie_id: string }) => rc.categorie_id
    ),
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/recepten/${recept.id}`} className="text-slate-400 hover:text-slate-600 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1>Recept bewerken</h1>
      </div>

      <ReceptFormulier recept={receptMet} huishoudenId={gebruiker.huishouden_id} />
    </div>
  )
}
