export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      characters: {
        Row: {
          created_at: string
          id: string
          name: string
          outfit_url: string | null
          user_id: string
          vocation: string
          world: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          outfit_url?: string | null
          user_id: string
          vocation: string
          world: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          outfit_url?: string | null
          user_id?: string
          vocation?: string
          world?: string
        }
        Relationships: []
      }
      deaths: {
        Row: {
          blessings: number
          character_id: string
          created_at: string
          id: string
          level: number | null
          note: string | null
          promoted: boolean
          session_id: string | null
          user_id: string
          xp_lost: number
        }
        Insert: {
          blessings?: number
          character_id: string
          created_at?: string
          id?: string
          level?: number | null
          note?: string | null
          promoted?: boolean
          session_id?: string | null
          user_id: string
          xp_lost: number
        }
        Update: {
          blessings?: number
          character_id?: string
          created_at?: string
          id?: string
          level?: number | null
          note?: string | null
          promoted?: boolean
          session_id?: string | null
          user_id?: string
          xp_lost?: number
        }
        Relationships: [
          {
            foreignKeyName: "deaths_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deaths_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "hunt_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          character_id: string
          created_at: string
          description: string
          id: string
          user_id: string
        }
        Insert: {
          amount: number
          character_id: string
          created_at?: string
          description: string
          id?: string
          user_id: string
        }
        Update: {
          amount?: number
          character_id?: string
          created_at?: string
          description?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          character_id: string
          created_at: string
          currency_label: string
          id: string
          image_url: string | null
          name: string
          target_amount: number
          user_id: string
        }
        Insert: {
          character_id: string
          created_at?: string
          currency_label?: string
          id?: string
          image_url?: string | null
          name: string
          target_amount?: number
          user_id: string
        }
        Update: {
          character_id?: string
          created_at?: string
          currency_label?: string
          id?: string
          image_url?: string | null
          name?: string
          target_amount?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      hunt_sessions: {
        Row: {
          bounty_difficulty: string | null
          bounty_tier: string | null
          bounty_xp: number | null
          char_level: number | null
          char_name: string | null
          char_vocation: string | null
          character_id: string
          created_at: string
          damage: Json | null
          gear_url: string | null
          hunt_name: string
          hunting: Json
          id: string
          is_public: boolean
          misc: Json | null
          notes: string | null
          prey: Json | null
          user_id: string
        }
        Insert: {
          bounty_difficulty?: string | null
          bounty_tier?: string | null
          bounty_xp?: number | null
          char_level?: number | null
          char_name?: string | null
          char_vocation?: string | null
          character_id: string
          created_at?: string
          damage?: Json | null
          gear_url?: string | null
          hunt_name: string
          hunting: Json
          id?: string
          is_public?: boolean
          misc?: Json | null
          notes?: string | null
          prey?: Json | null
          user_id: string
        }
        Update: {
          bounty_difficulty?: string | null
          bounty_tier?: string | null
          bounty_xp?: number | null
          char_level?: number | null
          char_name?: string | null
          char_vocation?: string | null
          character_id?: string
          created_at?: string
          damage?: Json | null
          gear_url?: string | null
          hunt_name?: string
          hunting?: Json
          id?: string
          is_public?: boolean
          misc?: Json | null
          notes?: string | null
          prey?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hunt_sessions_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      hunts: {
        Row: {
          character_id: string
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          character_id: string
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          character_id?: string
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hunts_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      imbuements: {
        Row: {
          character_id: string
          created_at: string
          gear_slot: string | null
          gold_token_cost: number
          hours_remaining: number
          id: string
          label: string | null
          tier: string
          user_id: string
        }
        Insert: {
          character_id: string
          created_at?: string
          gear_slot?: string | null
          gold_token_cost?: number
          hours_remaining?: number
          id?: string
          label?: string | null
          tier: string
          user_id: string
        }
        Update: {
          character_id?: string
          created_at?: string
          gear_slot?: string | null
          gold_token_cost?: number
          hours_remaining?: number
          id?: string
          label?: string | null
          tier?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "imbuements_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      level_snapshots: {
        Row: {
          character_id: string
          created_at: string
          id: string
          level: number
          user_id: string
        }
        Insert: {
          character_id: string
          created_at?: string
          id?: string
          level: number
          user_id: string
        }
        Update: {
          character_id?: string
          created_at?: string
          id?: string
          level?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "level_snapshots_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      linked_tasks_cache: {
        Row: {
          id: number
          rooms: Json
          synced_at: string
        }
        Insert: {
          id?: number
          rooms: Json
          synced_at?: string
        }
        Update: {
          id?: number
          rooms?: Json
          synced_at?: string
        }
        Relationships: []
      }
      monster_weakness_cache: {
        Row: {
          mods: Json | null
          name: string
          updated_at: string
        }
        Insert: {
          mods?: Json | null
          name: string
          updated_at?: string
        }
        Update: {
          mods?: Json | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      rc_price_entries: {
        Row: {
          created_at: string
          id: string
          price: number
          recorded_on: string
          target_gold: number | null
          user_id: string
          world: string
        }
        Insert: {
          created_at?: string
          id?: string
          price: number
          recorded_on?: string
          target_gold?: number | null
          user_id: string
          world: string
        }
        Update: {
          created_at?: string
          id?: string
          price?: number
          recorded_on?: string
          target_gold?: number | null
          user_id?: string
          world?: string
        }
        Relationships: []
      }
      saved_comparisons: {
        Row: {
          created_at: string
          hunt_notes: Json
          hunts: Json
          id: string
          include_bounty: boolean
          include_prey: boolean
          notes: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          hunt_notes?: Json
          hunts?: Json
          id?: string
          include_bounty?: boolean
          include_prey?: boolean
          notes?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          hunt_notes?: Json
          hunts?: Json
          id?: string
          include_bounty?: boolean
          include_prey?: boolean
          notes?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
