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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      match_comments: {
        Row: {
          comment: string
          created_at: string
          created_by: string
          id: string
          match_id: string
          updated_at: string
        }
        Insert: {
          comment: string
          created_at?: string
          created_by: string
          id?: string
          match_id: string
          updated_at?: string
        }
        Update: {
          comment?: string
          created_at?: string
          created_by?: string
          id?: string
          match_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_comments_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          away_score: number
          away_team_id: string
          competition: string | null
          created_at: string | null
          home_score: number
          home_team_id: string
          id: string
          match_date: string
          venue: string | null
        }
        Insert: {
          away_score?: number
          away_team_id: string
          competition?: string | null
          created_at?: string | null
          home_score?: number
          home_team_id: string
          id?: string
          match_date: string
          venue?: string | null
        }
        Update: {
          away_score?: number
          away_team_id?: string
          competition?: string | null
          created_at?: string | null
          home_score?: number
          home_team_id?: string
          id?: string
          match_date?: string
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_away_team_id_fkey"
            columns: ["away_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_home_team_id_fkey"
            columns: ["home_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      player_match_stats: {
        Row: {
          aerial_duels_lost: number | null
          aerial_duels_won: number | null
          backward_pass: number | null
          clearance: number | null
          corner_failed: number | null
          corner_success: number | null
          corners: number | null
          created_at: string | null
          crosses: number | null
          cut_backs: number | null
          defensive_errors: number | null
          forward_pass: number | null
          foul_won: number | null
          fouls: number | null
          fouls_defensive_third: number | null
          fouls_final_third: number | null
          fouls_middle_third: number | null
          free_kicks: number | null
          fw_defensive_3rd: number | null
          fw_final_3rd: number | null
          fw_middle_3rd: number | null
          goals: number | null
          half: number
          id: string
          match_id: string
          minutes_played: number | null
          miss_pass: number | null
          offside: number | null
          overlaps: number | null
          pass_count: number | null
          penalty_area_entry: number | null
          penalty_area_pass: number | null
          player_id: string
          run_in_behind: number | null
          saves: number | null
          shots_attempted: number | null
          shots_on_target: number | null
          successful_pass: number | null
          tackles: number | null
          throw_ins: number | null
          ti_failed: number | null
          ti_success: number | null
        }
        Insert: {
          aerial_duels_lost?: number | null
          aerial_duels_won?: number | null
          backward_pass?: number | null
          clearance?: number | null
          corner_failed?: number | null
          corner_success?: number | null
          corners?: number | null
          created_at?: string | null
          crosses?: number | null
          cut_backs?: number | null
          defensive_errors?: number | null
          forward_pass?: number | null
          foul_won?: number | null
          fouls?: number | null
          fouls_defensive_third?: number | null
          fouls_final_third?: number | null
          fouls_middle_third?: number | null
          free_kicks?: number | null
          fw_defensive_3rd?: number | null
          fw_final_3rd?: number | null
          fw_middle_3rd?: number | null
          goals?: number | null
          half: number
          id?: string
          match_id: string
          minutes_played?: number | null
          miss_pass?: number | null
          offside?: number | null
          overlaps?: number | null
          pass_count?: number | null
          penalty_area_entry?: number | null
          penalty_area_pass?: number | null
          player_id: string
          run_in_behind?: number | null
          saves?: number | null
          shots_attempted?: number | null
          shots_on_target?: number | null
          successful_pass?: number | null
          tackles?: number | null
          throw_ins?: number | null
          ti_failed?: number | null
          ti_success?: number | null
        }
        Update: {
          aerial_duels_lost?: number | null
          aerial_duels_won?: number | null
          backward_pass?: number | null
          clearance?: number | null
          corner_failed?: number | null
          corner_success?: number | null
          corners?: number | null
          created_at?: string | null
          crosses?: number | null
          cut_backs?: number | null
          defensive_errors?: number | null
          forward_pass?: number | null
          foul_won?: number | null
          fouls?: number | null
          fouls_defensive_third?: number | null
          fouls_final_third?: number | null
          fouls_middle_third?: number | null
          free_kicks?: number | null
          fw_defensive_3rd?: number | null
          fw_final_3rd?: number | null
          fw_middle_3rd?: number | null
          goals?: number | null
          half?: number
          id?: string
          match_id?: string
          minutes_played?: number | null
          miss_pass?: number | null
          offside?: number | null
          overlaps?: number | null
          pass_count?: number | null
          penalty_area_entry?: number | null
          penalty_area_pass?: number | null
          player_id?: string
          run_in_behind?: number | null
          saves?: number | null
          shots_attempted?: number | null
          shots_on_target?: number | null
          successful_pass?: number | null
          tackles?: number | null
          throw_ins?: number | null
          ti_failed?: number | null
          ti_success?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "player_match_stats_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_match_stats_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          created_at: string | null
          id: string
          jersey_number: number
          name: string
          role: string | null
          team_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          jersey_number: number
          name: string
          role?: string | null
          team_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          jersey_number?: number
          name?: string
          role?: string | null
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "players_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          display_name: string | null
          id: string
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          id: string
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      teams: {
        Row: {
          created_at: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_coach: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user" | "coach"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user", "coach"],
    },
  },
} as const
