import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ReceptenLijst from '@/components/ReceptenLijst'

export default async function ReceptenPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: gebruiker } = await supabase
    .from('gebruikers')
    .select('huishouden_id')
    .eq('id', user.id)
    .single()

  if (!gebruiker?.huishouden_id) {
    redirect('/login')
  }

  return <ReceptenLijst huishoudenId={gebruiker.huishouden_id} />
}
