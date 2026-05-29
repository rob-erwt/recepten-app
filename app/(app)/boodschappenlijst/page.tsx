import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Boodschappenlijst from '@/components/Boodschappenlijst'

export default async function BoodschappenlijstPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: gebruiker } = await supabase
    .from('gebruikers')
    .select('huishouden_id')
    .eq('id', user.id)
    .single()

  if (!gebruiker?.huishouden_id) redirect('/recepten')

  return <Boodschappenlijst huishoudenId={gebruiker.huishouden_id} />
}
