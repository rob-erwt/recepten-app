import Link from 'next/link'

/**
 * Zelfregistratie staat uit — de app is alleen toegankelijk op uitnodiging.
 * Deze pagina blijft bestaan zodat oude links en bookmarks niet in een 404 vallen.
 */
export default function RegisterPage() {
  return (
    <div className="card p-8 text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary-100 mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </div>
      <h2 className="text-lg font-semibold text-slate-900 mb-2">Registreren gaat op uitnodiging</h2>
      <p className="text-sm text-slate-500 mb-5">
        Deze app is alleen toegankelijk voor leden van een huishouden. Vraag iemand
        uit je huishouden om je uit te nodigen — je krijgt dan een persoonlijke link
        waarmee je een account aanmaakt.
      </p>
      <Link href="/login" className="btn-primary w-full">
        Naar inloggen
      </Link>
    </div>
  )
}
