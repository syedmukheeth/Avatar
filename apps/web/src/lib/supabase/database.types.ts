// Hand-written to match supabase/migrations until `pnpm db:types` can run against a local stack
// (requires Docker). Regenerate and replace this file once it can; keep the shape identical.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

type Timestamp = string

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "13"
  }
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          account_type: "creator" | "user" | null
          created_at: Timestamp
          updated_at: Timestamp
        }
        Insert: never
        Update: { full_name?: string | null }
        Relationships: []
      }
      creators: {
        Row: {
          id: string
          user_id: string
          display_name: string
          profession: string | null
          bio: string | null
          social_links: Json
          created_at: Timestamp
          updated_at: Timestamp
        }
        Insert: {
          user_id: string
          display_name: string
          profession?: string | null
          bio?: string | null
          social_links?: Json
        }
        Update: {
          display_name?: string
          profession?: string | null
          bio?: string | null
          social_links?: Json
        }
        Relationships: [
          {
            foreignKeyName: "creators_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      characters: {
        Row: {
          id: string
          creator_id: string
          slug: string
          name: string
          tagline: string | null
          description: string | null
          avatar_path: string | null
          language: CharacterLanguage
          status: "draft" | "published"
          voice_ready: boolean
          published_at: Timestamp | null
          created_at: Timestamp
          updated_at: Timestamp
        }
        Insert: {
          creator_id: string
          name: string
          slug?: string
          tagline?: string | null
          description?: string | null
          avatar_path?: string | null
          language?: CharacterLanguage
        }
        Update: {
          slug?: string
          name?: string
          tagline?: string | null
          description?: string | null
          avatar_path?: string | null
          language?: CharacterLanguage
          status?: "draft" | "published"
        }
        Relationships: [
          {
            foreignKeyName: "characters_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      character_private: {
        Row: {
          character_id: string
          personality: string | null
          instructions: string | null
          voice_provider: "cartesia" | null
          voice_id: string | null
          voice_status: "not_setup" | "processing" | "ready" | "failed"
          voice_error: string | null
          voice_updated_at: Timestamp | null
          updated_at: Timestamp
        }
        Insert: never
        Update: { personality?: string | null; instructions?: string | null }
        Relationships: [
          {
            foreignKeyName: "character_private_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: true
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_sources: {
        Row: {
          id: string
          character_id: string
          source_type: "pdf" | "text" | "note"
          title: string
          storage_path: string | null
          note_content: string | null
          byte_size: number | null
          status: "queued" | "processing" | "ready" | "failed"
          error: string | null
          attempts: number
          locked_at: Timestamp | null
          char_count: number | null
          chunk_count: number | null
          processed_at: Timestamp | null
          created_at: Timestamp
          updated_at: Timestamp
        }
        Insert: never
        Update: never
        Relationships: [
          {
            foreignKeyName: "knowledge_sources_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          id: string
          audience_user_id: string
          character_id: string
          channel: "text" | "voice"
          created_at: Timestamp
          updated_at: Timestamp
        }
        Insert: never
        Update: never
        Relationships: [
          {
            foreignKeyName: "conversations_audience_user_id_fkey"
            columns: ["audience_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          id: number
          conversation_id: string
          role: "user" | "assistant"
          content: string
          metadata: Json
          created_at: Timestamp
        }
        Insert: never
        Update: never
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      call_sessions: {
        Row: {
          id: string
          user_id: string
          character_id: string
          conversation_id: string | null
          status: "active" | "ended"
          started_at: Timestamp
          last_seen_at: Timestamp
          ended_at: Timestamp | null
          end_reason: string | null
          duration_secs: number | null
          stt_secs: number
          tts_chars: number
          llm_input_tokens: number
          llm_output_tokens: number
          est_cost_usd: number | null
          metrics: Json
        }
        Insert: never
        Update: never
        Relationships: []
      }
      voice_consents: {
        Row: {
          id: string
          user_id: string
          character_id: string | null
          consent_version: string
          language: string
          audio_sha256: string
          voice_id: string | null
          created_at: Timestamp
        }
        Insert: never
        Update: never
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      choose_account_type: {
        Args: { p_account_type: "creator" | "user" }
        Returns: "creator" | "user"
      }
    }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}

export type CharacterLanguage =
  "en" | "hi" | "ta" | "te" | "mr" | "bn" | "gu" | "kn" | "ml" | "pa" | "es" | "fr"

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"]
