import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const MIN_WACHTWOORD_LENGTE = 8

/**
 * Registratie op uitnodiging — server-side.
 *
 * Zelfregistratie staat uit in Supabase Auth ("Allow new users to sign up"),
 * waardoor `supabase.auth.signUp()` vanuit de browser niet meer werkt. Accounts
 * worden hier aangemaakt met de service-role-key, maar alleen na een geldig
 * uitnodigingstoken. Zo kan niemand met de publieke anon-key zelf een
 * huishouden aanmaken.
 *
 * De DB-trigger `handle_new_user` pikt `uitnodiging_token` uit de metadata op en
 * koppelt de nieuwe gebruiker aan het bestaande huishouden.
 */
export async function POST(request: NextRequest) {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  if (!serviceRoleKey || !supabaseUrl) {
    console.error('[uitnodiging] SUPABASE_SERVICE_ROLE_KEY of NEXT_PUBLIC_SUPABASE_URL ontbreekt')
    return NextResponse.json(
      { fout: 'Registratie is momenteel niet beschikbaar. Neem contact op met de beheerder.' },
      { status: 503 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ fout: 'Ongeldig verzoek.' }, { status: 400 })
  }

  const { token, naam, email, wachtwoord } = (body ?? {}) as Record<string, unknown>

  if (
    typeof token !== 'string' ||
    typeof naam !== 'string' ||
    typeof email !== 'string' ||
    typeof wachtwoord !== 'string'
  ) {
    return NextResponse.json({ fout: 'Ongeldig verzoek.' }, { status: 400 })
  }

  if (!naam.trim()) {
    return NextResponse.json({ fout: 'Vul je naam in.' }, { status: 400 })
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ fout: 'Vul een geldig e-mailadres in.' }, { status: 400 })
  }

  if (wachtwoord.length < MIN_WACHTWOORD_LENGTE) {
    return NextResponse.json(
      { fout: `Wachtwoord moet minimaal ${MIN_WACHTWOORD_LENGTE} tekens bevatten.` },
      { status: 400 }
    )
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  // Token opnieuw valideren — de pagina deed dit al, maar dit endpoint is publiek.
  const { data: validatie, error: validatieFout } = await admin.rpc('valideer_uitnodiging', {
    p_token: token,
  })

  if (validatieFout || validatie?.[0]?.geldig !== true) {
    return NextResponse.json(
      { fout: 'Deze uitnodiging is verlopen, al gebruikt, of bestaat niet.' },
      { status: 403 }
    )
  }

  // E-mail is al bevestigd door degene die de uitnodiging stuurde; geen extra
  // bevestigingsmail, zodat de uitgenodigde direct kan inloggen.
  const { error: aanmaakFout } = await admin.auth.admin.createUser({
    email,
    password: wachtwoord,
    email_confirm: true,
    user_metadata: {
      naam: naam.trim(),
      uitnodiging_token: token,
    },
  })

  if (aanmaakFout) {
    const bericht = aanmaakFout.message.toLowerCase()
    if (bericht.includes('already') || bericht.includes('registered') || bericht.includes('exists')) {
      return NextResponse.json(
        { fout: 'Dit e-mailadres is al in gebruik. Probeer in te loggen.' },
        { status: 409 }
      )
    }
    console.error('[uitnodiging] createUser mislukt:', aanmaakFout.message)
    return NextResponse.json(
      { fout: 'Account aanmaken is mislukt. Probeer het opnieuw.' },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true }, { status: 201 })
}
