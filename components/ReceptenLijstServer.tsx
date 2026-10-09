'use server'

import { createClient } from '@/lib/supabase/server'
import { PAGINA_GROOTTE } from '@/lib/paginering'
import type { ReceptKaart, Categorie } from '@/lib/types'

// Input types voor de server action
export type ReceptenFilter = {
  zoekterm: string
  ingChips: string[]
  actieveCategorieen: string[]
  maxBereidingstijd: number | null
  paginaNr: number
  huishoudenId: string
}

export type ReceptenLijstData = {
  recepten: ReceptKaart[]
  categorieen: Categorie[]
  aantalResultaten: number
}

/**
 * Server Action: Haalt gefilterde en gepagineerde recepten op.
 * Dit is de core van T-01: alle filter- en pagineringslogica wordt server-side uitgevoerd.
 * 
 * Optimalisaties:
 * - Alleen de benodigde recepten worden opgevraagd (max. PAGINA_GROOTTE per request)
 * - Joins worden direct in de query gedaan
 * - Count wordt in één query meegehaald
 * - Ingrediënten filter wordt server-side opgelost met subqueries
 */
export async function haalRecepten(
  filter: ReceptenFilter
): Promise<ReceptenLijstData> {
  const { zoekterm, ingChips, actieveCategorieen, maxBereidingstijd, paginaNr, huishoudenId } = filter
  const supabase = createClient()

  const from = (paginaNr - 1) * PAGINA_GROOTTE
  const to = from + PAGINA_GROOTTE - 1

  // 1. Categorieën laden (altijd nodig voor UI)
  const { data: categorieenData } = await supabase
    .from('categorieen')
    .select('id, naam, volgorde, huishouden_id')
    .or(`huishouden_id.is.null,huishouden_id.eq.${huishoudenId}`)
    .order('volgorde')

  // 2. Voorbereid: ingrediënten filter (AND-logica)
  // We bepalen de recept IDs die alle ingrediënten chips bevatten
  let ingrediëntenReceptIds: string[] | null = null
  if (ingChips.length > 0) {
    const receptIdSets: Set<string>[] = []
    
    for (const chip of ingChips) {
      const { data: matchingIngredienten } = await supabase
        .from('ingredienten')
        .select('recept_id')
        .ilike('naam', `%${chip}%`)
      
      const ids = new Set((matchingIngredienten ?? []).map(i => i.recept_id))
      receptIdSets.push(ids)
    }
    
    // Doorsnede: recepten die in ALLE sets zitten
    const [eersteSet, ...restSets] = receptIdSets
    ingrediëntenReceptIds = Array.from(eersteSet).filter(id => 
      restSets.every(set => set.has(id))
    )
    
    if (ingrediëntenReceptIds.length === 0) {
      return {
        recepten: [],
        categorieen: categorieenData || [],
        aantalResultaten: 0
      }
    }
  }

  // 3. Voorbereid: categorie filter
  let categorieReceptIds: string[] | null = null
  if (actieveCategorieen.length > 0) {
    const { data: receptIdsViaCategorie } = await supabase
      .from('recept_categorieen')
      .select('recept_id')
      .in('categorie_id', actieveCategorieen)
    
    categorieReceptIds = receptIdsViaCategorie?.map(r => r.recept_id) || []
    
    if (categorieReceptIds.length === 0) {
      return {
        recepten: [],
        categorieen: categorieenData || [],
        aantalResultaten: 0
      }
    }
  }

  // 4. Combineer filters voor de count en data queries
  // We bepalen de uiteindelijke set van recept IDs die aan ALLE filters voldoen
  let gefilterdeReceptIds: string[] | null = null
  
  if (ingrediëntenReceptIds !== null && categorieReceptIds !== null) {
    // Doorsnede van ingrediënten en categorie filters
    const ingrediëntenSet = new Set(ingrediëntenReceptIds)
    gefilterdeReceptIds = categorieReceptIds.filter(id => ingrediëntenSet.has(id))
  } else {
    gefilterdeReceptIds = ingrediëntenReceptIds ?? categorieReceptIds
  }

  // 5. Bouw de hoofdquery voor recepten
  let query = supabase
    .from('recepten')
    .select(
      `id, naam, beschrijving, aantal_personen, bereidingstijd_min, foto_url,
       recept_categorieen ( categorieen (id, naam) )`,
      { count: 'exact', head: false }
    )
    .eq('huishouden_id', huishoudenId)
    .order('naam')

  // 5a. Filter op naam (zoekterm)
  if (zoekterm) {
    query = query.ilike('naam', `%${zoekterm}%`)
  }

  // 5b. Filter op bereidingstijd
  if (maxBereidingstijd !== null) {
    query = query.lte('bereidingstijd_min', maxBereidingstijd).not('bereidingstijd_min', 'is', null)
  }

  // 5c. Pas gefilterde IDs toe
  if (gefilterdeReceptIds !== null && gefilterdeReceptIds.length > 0) {
    query = query.in('id', gefilterdeReceptIds)
  } else if (gefilterdeReceptIds !== null && gefilterdeReceptIds.length === 0) {
    // Geen recepten voldoen aan de filters
    return {
      recepten: [],
      categorieen: categorieenData || [],
      aantalResultaten: 0
    }
  }

  // 6. Eerst de count ophalen ZONDER paginering (voor accurate teller)
  let countQuery = supabase
    .from('recepten')
    .select('id', { count: 'exact', head: true })
    .eq('huishouden_id', huishoudenId)

  if (zoekterm) {
    countQuery = countQuery.ilike('naam', `%${zoekterm}%`)
  }
  if (maxBereidingstijd !== null) {
    countQuery = countQuery.lte('bereidingstijd_min', maxBereidingstijd).not('bereidingstijd_min', 'is', null)
  }
  if (gefilterdeReceptIds !== null && gefilterdeReceptIds.length > 0) {
    countQuery = countQuery.in('id', gefilterdeReceptIds)
  }

  const { count, error: countError } = await countQuery
  
  if (countError) {
    console.error('Fout bij tellen recepten:', countError)
  }

  // 7. Paginering toepassen en query uitvoeren
  const { data, error } = await query.range(from, to)

  if (error) {
    console.error('Fout bij ophalen recepten:', error)
    return {
      recepten: [],
      categorieen: categorieenData || [],
      aantalResultaten: 0
    }
  }

  // 8. Map data naar ReceptKaart format
  const recepten: ReceptKaart[] = (data ?? []).map(r => ({
    id: r.id,
    naam: r.naam,
    beschrijving: r.beschrijving,
    aantal_personen: r.aantal_personen,
    bereidingstijd_min: r.bereidingstijd_min,
    foto_url: r.foto_url,
    categorieen: (r.recept_categorieen ?? [])
      .map(rc => rc.categorieen)
      .filter((c): c is { id: string; naam: string } => c !== null),
  }))

  return {
    recepten,
    categorieen: categorieenData || [],
    aantalResultaten: count ?? recepten.length
  }
}
