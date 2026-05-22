import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import WeekMenuOverzicht from '@/components/WeekMenuOverzicht'

export default async function WeekMenuPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: gebruiker } = await supabase
    .from('gebruikers')
    .select('huishouden_id')
    .eq('id', user.id)
    .single()

  if (!gebruiker?.huishouden_id) redirect('/login')

  return <WeekMenuOverzicht huishoudenId={gebruiker.huishouden_id} />
}
