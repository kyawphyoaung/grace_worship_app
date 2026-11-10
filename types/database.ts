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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      bible_books: {
        Row: {
          abbreviation: string
          book_order: number
          id: string
          name_chin: string | null
          name_en: string
          name_mm: string
          testament: string
        }
        Insert: {
          abbreviation: string
          book_order: number
          id?: string
          name_chin?: string | null
          name_en: string
          name_mm: string
          testament: string
        }
        Update: {
          abbreviation?: string
          book_order?: number
          id?: string
          name_chin?: string | null
          name_en?: string
          name_mm?: string
          testament?: string
        }
        Relationships: []
      }
      bible_favorites: {
        Row: {
          book_id: string
          chapter: number
          created_at: string
          highlighted_text: string | null
          id: string
          is_shared: boolean
          kind: string
          user_id: string
          verse: number
          verse_end: number | null
        }
        Insert: {
          book_id: string
          chapter: number
          created_at?: string
          highlighted_text?: string | null
          id?: string
          is_shared?: boolean
          kind: string
          user_id: string
          verse: number
          verse_end?: number | null
        }
        Update: {
          book_id?: string
          chapter?: number
          created_at?: string
          highlighted_text?: string | null
          id?: string
          is_shared?: boolean
          kind?: string
          user_id?: string
          verse?: number
          verse_end?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bible_favorites_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "bible_books"
            referencedColumns: ["id"]
          },
        ]
      }
      bible_study_notes: {
        Row: {
          book_id: string
          chapter: number
          created_at: string
          id: string
          is_shared: boolean
          reflection: string
          user_id: string
          verse_end: number
          verse_start: number
        }
        Insert: {
          book_id: string
          chapter: number
          created_at?: string
          id?: string
          is_shared?: boolean
          reflection: string
          user_id: string
          verse_end: number
          verse_start: number
        }
        Update: {
          book_id?: string
          chapter?: number
          created_at?: string
          id?: string
          is_shared?: boolean
          reflection?: string
          user_id?: string
          verse_end?: number
          verse_start?: number
        }
        Relationships: [
          {
            foreignKeyName: "bible_study_notes_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "bible_books"
            referencedColumns: ["id"]
          },
        ]
      }
      bible_study_sessions: {
        Row: {
          book_id: string
          chapter: number
          completed: boolean
          created_at: string
          id: string
          session_date: string
          user_id: string
          verses_read: number
        }
        Insert: {
          book_id: string
          chapter: number
          completed?: boolean
          created_at?: string
          id?: string
          session_date?: string
          user_id: string
          verses_read?: number
        }
        Update: {
          book_id?: string
          chapter?: number
          completed?: boolean
          created_at?: string
          id?: string
          session_date?: string
          user_id?: string
          verses_read?: number
        }
        Relationships: [
          {
            foreignKeyName: "bible_study_sessions_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "bible_books"
            referencedColumns: ["id"]
          },
        ]
      }
      bible_verses: {
        Row: {
          book_id: string
          chapter: number
          id: string
          text_chin: string | null
          text_en: string
          text_kjv: string | null
          text_mm: string
          verse: number
        }
        Insert: {
          book_id: string
          chapter: number
          id?: string
          text_chin?: string | null
          text_en: string
          text_kjv?: string | null
          text_mm: string
          verse: number
        }
        Update: {
          book_id?: string
          chapter?: number
          id?: string
          text_chin?: string | null
          text_en?: string
          text_kjv?: string | null
          text_mm?: string
          verse?: number
        }
        Relationships: [
          {
            foreignKeyName: "bible_verses_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "bible_books"
            referencedColumns: ["id"]
          },
        ]
      }
      event_feedback: {
        Row: {
          created_at: string
          event_id: string
          from_user_id: string
          id: string
          note: string
          to_user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          from_user_id: string
          id?: string
          note: string
          to_user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          from_user_id?: string
          id?: string
          note?: string
          to_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_feedback_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_prayers: {
        Row: {
          created_at: string
          event_id: string
          from_user_id: string
          id: string
          note: string
        }
        Insert: {
          created_at?: string
          event_id: string
          from_user_id: string
          id?: string
          note: string
        }
        Update: {
          created_at?: string
          event_id?: string
          from_user_id?: string
          id?: string
          note?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_prayers_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          event_date: string
          event_name: string
          event_type: string
          id: string
          notes: string | null
          role: string
          updated_at: string
          updated_by: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event_date: string
          event_name: string
          event_type: string
          id?: string
          notes?: string | null
          role: string
          updated_at?: string
          updated_by?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          event_date?: string
          event_name?: string
          event_type?: string
          id?: string
          notes?: string | null
          role?: string
          updated_at?: string
          updated_by?: string | null
          user_id?: string
        }
        Relationships: []
      }
      gratitude_entries: {
        Row: {
          content: string
          created_at: string
          entry_date: string
          id: string
          is_shared: boolean
          recipient_id: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          entry_date?: string
          id?: string
          is_shared?: boolean
          recipient_id?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          entry_date?: string
          id?: string
          is_shared?: boolean
          recipient_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ministry_reflections: {
        Row: {
          created_at: string
          event_id: string
          id: string
          is_shared: boolean
          post_service_reflection: string | null
          serving_gratitude: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          is_shared?: boolean
          post_service_reflection?: string | null
          serving_gratitude?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          is_shared?: boolean
          post_service_reflection?: string | null
          serving_gratitude?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ministry_reflections_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          id: string
          linked_at: string
          user_a: string
          user_b: string
        }
        Insert: {
          id?: string
          linked_at?: string
          user_a: string
          user_b: string
        }
        Update: {
          id?: string
          linked_at?: string
          user_a?: string
          user_b?: string
        }
        Relationships: []
      }
      feed_comments: {
        Row: {
          content: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      feed_reactions: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          reaction: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          reaction?: string
          user_id: string
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          reaction?: string
          user_id?: string
        }
        Relationships: []
      }
      prayer_interactions: {
        Row: {
          created_at: string
          id: string
          interaction_type: string
          note: string | null
          prayer_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          interaction_type: string
          note?: string | null
          prayer_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          interaction_type?: string
          note?: string | null
          prayer_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prayer_interactions_prayer_id_fkey"
            columns: ["prayer_id"]
            isOneToOne: false
            referencedRelation: "prayers"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          actor_id: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          message: string
          read_at: string | null
          type: string
          user_id: string
        }
        Insert: {
          actor_id: string
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          message: string
          read_at?: string | null
          type: string
          user_id: string
        }
        Update: {
          actor_id?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          message?: string
          read_at?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      prayers: {
        Row: {
          answered_at: string | null
          content: string
          created_at: string
          id: string
          is_shared: boolean
          recipient_id: string | null
          status: string
          testimony: string | null
          title: string
          user_id: string
        }
        Insert: {
          answered_at?: string | null
          content: string
          created_at?: string
          id?: string
          is_shared?: boolean
          recipient_id?: string | null
          status?: string
          testimony?: string | null
          title: string
          user_id: string
        }
        Update: {
          answered_at?: string | null
          content?: string
          created_at?: string
          id?: string
          is_shared?: boolean
          recipient_id?: string | null
          status?: string
          testimony?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          prayer_reminder_time: string | null
          preferred_bible_languages: string[]
          preferred_language: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          prayer_reminder_time?: string | null
          preferred_bible_languages?: string[]
          preferred_language?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          prayer_reminder_time?: string | null
          preferred_bible_languages?: string[]
          preferred_language?: string
        }
        Relationships: []
      }
      setlist_items: {
        Row: {
          id: string
          item_bpm: number | null
          item_notes: string | null
          key_override: string | null
          position: number
          setlist_id: string
          song_id: string
          transition_note: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: string
          item_bpm?: number | null
          item_notes?: string | null
          key_override?: string | null
          position: number
          setlist_id: string
          song_id: string
          transition_note?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: string
          item_bpm?: number | null
          item_notes?: string | null
          key_override?: string | null
          position?: number
          setlist_id?: string
          song_id?: string
          transition_note?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "setlist_items_setlist_id_fkey"
            columns: ["setlist_id"]
            isOneToOne: false
            referencedRelation: "setlists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "setlist_items_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
        ]
      }
      setlists: {
        Row: {
          created_at: string
          event_id: string
          id: string
          updated_at: string
          updated_by: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          updated_at?: string
          updated_by?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          updated_at?: string
          updated_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "setlists_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      song_sections: {
        Row: {
          bpm_override: number | null
          id: string
          key_override: string | null
          label: string | null
          lyrics_en: string | null
          lyrics_mm: string | null
          notes: string | null
          section_order: number
          section_type: string
          song_id: string
        }
        Insert: {
          bpm_override?: number | null
          id?: string
          key_override?: string | null
          label?: string | null
          lyrics_en?: string | null
          lyrics_mm?: string | null
          notes?: string | null
          section_order: number
          section_type: string
          song_id: string
        }
        Update: {
          bpm_override?: number | null
          id?: string
          key_override?: string | null
          label?: string | null
          lyrics_en?: string | null
          lyrics_mm?: string | null
          notes?: string | null
          section_order?: number
          section_type?: string
          song_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "song_sections_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
        ]
      }
      songs: {
        Row: {
          author: string | null
          bpm: number | null
          created_at: string
          default_key: string | null
          id: string
          last_sung_date: string | null
          tags: string[]
          tempo: string | null
          time_signature: string
          times_sung: number
          title_en: string | null
          title_mm: string | null
          updated_at: string
          user_id: string
          youtube_url: string | null
        }
        Insert: {
          author?: string | null
          bpm?: number | null
          created_at?: string
          default_key?: string | null
          id?: string
          last_sung_date?: string | null
          tags?: string[]
          tempo?: string | null
          time_signature?: string
          times_sung?: number
          title_en?: string | null
          title_mm?: string | null
          updated_at?: string
          user_id: string
          youtube_url?: string | null
        }
        Update: {
          author?: string | null
          bpm?: number | null
          created_at?: string
          default_key?: string | null
          id?: string
          last_sung_date?: string | null
          tags?: string[]
          tempo?: string | null
          time_signature?: string
          times_sung?: number
          title_en?: string | null
          title_mm?: string | null
          updated_at?: string
          user_id?: string
          youtube_url?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_partner_id: { Args: never; Returns: string }
      is_partner: { Args: { target: string }; Returns: boolean }
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
