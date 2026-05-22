export type Categorie = {
  id: string
  naam: string
  volgorde: number
  huishouden_id: string | null
}

export type Ingredient = {
  id: string
  recept_id: string
  naam: string
  hoeveelheid: number | null
  eenheid: string | null
  volgorde: number
}

export type Stap = {
  id: string
  recept_id: string
  stap_nummer: number
  omschrijving: string
}

export type Recept = {
  id: string
  huishouden_id: string
  naam: string
  beschrijving: string | null
  aantal_personen: number | null
  bereidingstijd_min: number | null
  foto_url: string | null
  aangemaakt_door: string | null
  aangemaakt_op: string
  bijgewerkt_op: string
  ingredienten: Ingredient[]
  stappen: Stap[]
  categorie_ids: string[]   // platte lijst van categorie-UUIDs
}

export type ReceptKaart = {
  id: string
  naam: string
  beschrijving: string | null
  aantal_personen: number | null
  bereidingstijd_min: number | null
  foto_url: string | null
  categorieen: Pick<Categorie, 'id' | 'naam'>[]
}

// Formulier-types (zonder DB-ids)
export type IngredientInvoer = {
  naam: string
  hoeveelheid: string
  eenheid: string
}

export type StapInvoer = {
  omschrijving: string
}

export type ReceptInvoer = {
  naam: string
  beschrijving: string
  aantal_personen: string
  bereidingstijd_min: string
  ingredienten: IngredientInvoer[]
  stappen: StapInvoer[]
  foto_url?: string | null
}
