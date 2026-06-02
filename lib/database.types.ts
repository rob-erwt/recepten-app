// Gegenereerd door: npx supabase gen types typescript --project-id cetjxdqlbqqqflaeewbe
// Handmatig aangemaakt op basis van schema.sql — vervang dit bestand door het
// gegenereerde bestand na: npx supabase login && npm run gen-types

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      huishoudens: {
        Row: {
          id: string
          naam: string
          aangemaakt_op: string
        }
        Insert: {
          id?: string
          naam: string
          aangemaakt_op?: string
        }
        Update: {
          id?: string
          naam?: string
          aangemaakt_op?: string
        }
        Relationships: []
      }
      gebruikers: {
        Row: {
          id: string
          huishouden_id: string | null
          naam: string | null
          aangemaakt_op: string
        }
        Insert: {
          id: string
          huishouden_id?: string | null
          naam?: string | null
          aangemaakt_op?: string
        }
        Update: {
          id?: string
          huishouden_id?: string | null
          naam?: string | null
          aangemaakt_op?: string
        }
        Relationships: [
          {
            foreignKeyName: 'gebruikers_huishouden_id_fkey'
            columns: ['huishouden_id']
            isOneToOne: false
            referencedRelation: 'huishoudens'
            referencedColumns: ['id']
          },
        ]
      }
      recepten: {
        Row: {
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
        }
        Insert: {
          id?: string
          huishouden_id: string
          naam: string
          beschrijving?: string | null
          aantal_personen?: number | null
          bereidingstijd_min?: number | null
          foto_url?: string | null
          aangemaakt_door?: string | null
          aangemaakt_op?: string
          bijgewerkt_op?: string
        }
        Update: {
          id?: string
          huishouden_id?: string
          naam?: string
          beschrijving?: string | null
          aantal_personen?: number | null
          bereidingstijd_min?: number | null
          foto_url?: string | null
          aangemaakt_door?: string | null
          aangemaakt_op?: string
          bijgewerkt_op?: string
        }
        Relationships: [
          {
            foreignKeyName: 'recepten_huishouden_id_fkey'
            columns: ['huishouden_id']
            isOneToOne: false
            referencedRelation: 'huishoudens'
            referencedColumns: ['id']
          },
        ]
      }
      ingredienten: {
        Row: {
          id: string
          recept_id: string
          naam: string
          hoeveelheid: number | null
          eenheid: string | null
          volgorde: number
        }
        Insert: {
          id?: string
          recept_id: string
          naam: string
          hoeveelheid?: number | null
          eenheid?: string | null
          volgorde?: number
        }
        Update: {
          id?: string
          recept_id?: string
          naam?: string
          hoeveelheid?: number | null
          eenheid?: string | null
          volgorde?: number
        }
        Relationships: [
          {
            foreignKeyName: 'ingredienten_recept_id_fkey'
            columns: ['recept_id']
            isOneToOne: false
            referencedRelation: 'recepten'
            referencedColumns: ['id']
          },
        ]
      }
      stappen: {
        Row: {
          id: string
          recept_id: string
          stap_nummer: number
          omschrijving: string
        }
        Insert: {
          id?: string
          recept_id: string
          stap_nummer: number
          omschrijving: string
        }
        Update: {
          id?: string
          recept_id?: string
          stap_nummer?: number
          omschrijving?: string
        }
        Relationships: [
          {
            foreignKeyName: 'stappen_recept_id_fkey'
            columns: ['recept_id']
            isOneToOne: false
            referencedRelation: 'recepten'
            referencedColumns: ['id']
          },
        ]
      }
      categorieen: {
        Row: {
          id: string
          naam: string
          huishouden_id: string | null
          volgorde: number
        }
        Insert: {
          id?: string
          naam: string
          huishouden_id?: string | null
          volgorde?: number
        }
        Update: {
          id?: string
          naam?: string
          huishouden_id?: string | null
          volgorde?: number
        }
        Relationships: [
          {
            foreignKeyName: 'categorieen_huishouden_id_fkey'
            columns: ['huishouden_id']
            isOneToOne: false
            referencedRelation: 'huishoudens'
            referencedColumns: ['id']
          },
        ]
      }
      recept_categorieen: {
        Row: {
          recept_id: string
          categorie_id: string
        }
        Insert: {
          recept_id: string
          categorie_id: string
        }
        Update: {
          recept_id?: string
          categorie_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'recept_categorieen_recept_id_fkey'
            columns: ['recept_id']
            isOneToOne: false
            referencedRelation: 'recepten'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'recept_categorieen_categorie_id_fkey'
            columns: ['categorie_id']
            isOneToOne: false
            referencedRelation: 'categorieen'
            referencedColumns: ['id']
          },
        ]
      }
      weekmenu: {
        Row: {
          id: string
          huishouden_id: string
          datum: string
          recept_id: string | null
        }
        Insert: {
          id?: string
          huishouden_id: string
          datum: string
          recept_id?: string | null
        }
        Update: {
          id?: string
          huishouden_id?: string
          datum?: string
          recept_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'weekmenu_huishouden_id_fkey'
            columns: ['huishouden_id']
            isOneToOne: false
            referencedRelation: 'huishoudens'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'weekmenu_recept_id_fkey'
            columns: ['recept_id']
            isOneToOne: false
            referencedRelation: 'recepten'
            referencedColumns: ['id']
          },
        ]
      }
      boodschappenlijst_items: {
        Row: {
          id: string
          huishouden_id: string
          naam: string
          hoeveelheid: string | null
          eenheid: string | null
          afgevinkt: boolean
          bron: 'weekmenu' | 'handmatig'
          recept_naam: string | null
          aangemaakt_op: string
        }
        Insert: {
          id?: string
          huishouden_id: string
          naam: string
          hoeveelheid?: string | null
          eenheid?: string | null
          afgevinkt?: boolean
          bron: 'weekmenu' | 'handmatig'
          recept_naam?: string | null
          aangemaakt_op?: string
        }
        Update: {
          id?: string
          huishouden_id?: string
          naam?: string
          hoeveelheid?: string | null
          eenheid?: string | null
          afgevinkt?: boolean
          bron?: 'weekmenu' | 'handmatig'
          recept_naam?: string | null
          aangemaakt_op?: string
        }
        Relationships: [
          {
            foreignKeyName: 'boodschappenlijst_items_huishouden_id_fkey'
            columns: ['huishouden_id']
            isOneToOne: false
            referencedRelation: 'huishoudens'
            referencedColumns: ['id']
          },
        ]
      }
      uitnodigingen: {
        Row: {
          id: string
          huishouden_id: string
          token: string
          email: string | null
          aangemaakt_door: string
          aangemaakt_op: string
          verloopt_op: string
          gebruikt_op: string | null
        }
        Insert: {
          id?: string
          huishouden_id: string
          token?: string
          email?: string | null
          aangemaakt_door: string
          aangemaakt_op?: string
          verloopt_op?: string
          gebruikt_op?: string | null
        }
        Update: {
          id?: string
          huishouden_id?: string
          token?: string
          email?: string | null
          aangemaakt_door?: string
          aangemaakt_op?: string
          verloopt_op?: string
          gebruikt_op?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'uitnodigingen_huishouden_id_fkey'
            columns: ['huishouden_id']
            isOneToOne: false
            referencedRelation: 'huishoudens'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: Record<string, never>
    Functions: {
      get_huishouden_id: {
        Args: Record<string, never>
        Returns: string
      }
      sla_recept_op: {
        Args: {
          p_recept_id: string | null
          p_huishouden_id: string
          p_naam: string
          p_beschrijving: string | null
          p_aantal_personen: number | null
          p_bereidingstijd: number | null
          p_foto_url: string | null
          p_ingredienten: Json
          p_stappen: Json
          p_categorie_ids: string[]
        }
        Returns: string
      }
      valideer_uitnodiging: {
        Args: { p_token: string }
        Returns: Json
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
