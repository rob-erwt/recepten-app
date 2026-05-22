import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import CategorieenBeheer from '@/components/CategorieenBeheer'

export default async function CategorieenPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: gebruiker } = await supabase
    .from('gebruikers')
    .select('huishouden_id')
    .eq('id', user.id)
    .single()

  if (!gebruiker?.huishouden_id) redirect('/recepten')

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/recepten" className="text-slate-400 hover:text-slate-600 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1>Categorieën beheren</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Voeg eigen categorieën toe of pas bestaande aan.
          </p>
        </div>
      </div>

      <CategorieenBeheer huishoudenId={gebruiker.huishouden_id} />
    </div>
  )
}
