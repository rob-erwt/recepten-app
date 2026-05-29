import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import UitnodigingenBeheer from '@/components/UitnodigingenBeheer'

export default async function InstellingenPage() {
  const supabase = await createClient()
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
      <div className="mb-6">
        <h1>Instellingen</h1>
        <p className="text-sm text-slate-500 mt-1">Beheer je huishouden en gezinsleden</p>
      </div>
      <UitnodigingenBeheer huishoudenId={gebruiker.huishouden_id} />
    </div>
  )
}
