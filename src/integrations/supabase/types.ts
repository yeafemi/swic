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
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          is_read: boolean
          message: string
          name: string
          subject: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_read?: boolean
          message: string
          name: string
          subject?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_read?: boolean
          message?: string
          name?: string
          subject?: string | null
        }
        Relationships: []
      }
      events: {
        Row: {
          created_at: string
          description: string | null
          event_date: string | null
          event_time: string | null
          id: string
          is_ongoing: boolean
          is_published: boolean
          name: string
          updated_at: string
          venue: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_date?: string | null
          event_time?: string | null
          id?: string
          is_ongoing?: boolean
          is_published?: boolean
          name: string
          updated_at?: string
          venue?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          event_date?: string | null
          event_time?: string | null
          id?: string
          is_ongoing?: boolean
          is_published?: boolean
          name?: string
          updated_at?: string
          venue?: string | null
        }
        Relationships: []
      }
      gallery_images: {
        Row: {
          category: Database["public"]["Enums"]["gallery_category"]
          created_at: string
          id: string
          image_url: string
          is_published: boolean
          title: string | null
        }
        Insert: {
          category: Database["public"]["Enums"]["gallery_category"]
          created_at?: string
          id?: string
          image_url: string
          is_published?: boolean
          title?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["gallery_category"]
          created_at?: string
          id?: string
          image_url?: string
          is_published?: boolean
          title?: string | null
        }
        Relationships: []
      }
      giving_records: {
        Row: {
          amount: number
          channel: string | null
          created_at: string
          currency: string
          donor_name: string
          email: string
          giving_type: string
          id: string
          phone: string | null
          reference: string
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          channel?: string | null
          created_at?: string
          currency?: string
          donor_name: string
          email: string
          giving_type: string
          id?: string
          phone?: string | null
          reference: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          channel?: string | null
          created_at?: string
          currency?: string
          donor_name?: string
          email?: string
          giving_type?: string
          id?: string
          phone?: string | null
          reference?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_visits: {
        Row: {
          id: string
          visitor_id: string
          visited_at: string
        }
        Insert: {
          id?: string
          visitor_id: string
          visited_at?: string
        }
        Update: {
          id?: string
          visitor_id?: string
          visited_at?: string
        }
        Relationships: []
      }
      leaders: {
        Row: {
          bio: string | null
          created_at: string
          display_order: number
          id: string
          is_published: boolean
          name: string
          photo_url: string | null
          role: string
          updated_at: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          display_order?: number
          id?: string
          is_published?: boolean
          name: string
          photo_url?: string | null
          role: string
          updated_at?: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          display_order?: number
          id?: string
          is_published?: boolean
          name?: string
          photo_url?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name: string
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      live_stream_settings: {
        Row: {
          created_at: string
          description: string | null
          embed_url: string
          id: boolean
          is_live: boolean
          is_published: boolean
          schedule_note: string | null
          title: string
          updated_at: string
          youtube_url: string | null
          zoom_url: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          embed_url?: string
          id?: boolean
          is_live?: boolean
          is_published?: boolean
          schedule_note?: string | null
          title?: string
          updated_at?: string
          youtube_url?: string | null
          zoom_url?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          embed_url?: string
          id?: boolean
          is_live?: boolean
          is_published?: boolean
          schedule_note?: string | null
          title?: string
          updated_at?: string
          youtube_url?: string | null
          zoom_url?: string | null
        }
        Relationships: []
      }
      ministries: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          id: string
          image_url: string | null
          is_published: boolean
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          image_url?: string | null
          is_published?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          image_url?: string | null
          is_published?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      prayer_requests: {
        Row: {
          created_at: string
          email: string | null
          id: string
          is_anonymous: boolean
          name: string
          prayed_for: boolean
          request: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          is_anonymous?: boolean
          name: string
          prayed_for?: boolean
          request: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          is_anonymous?: boolean
          name?: string
          prayed_for?: boolean
          request?: string
        }
        Relationships: []
      }
      testimonies: {
        Row: {
          created_at: string
          email: string | null
          id: string
          is_published: boolean
          name: string
          phone: string
          text: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          is_published?: boolean
          name: string
          phone: string
          text: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          is_published?: boolean
          name?: string
          phone?: string
          text?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      sermons: {
        Row: {
          audio_url: string | null
          created_at: string
          date: string
          description: string | null
          external_link: string | null
          id: string
          is_published: boolean
          speaker: string
          title: string
          updated_at: string
          youtube_url: string | null
        }
        Insert: {
          audio_url?: string | null
          created_at?: string
          date: string
          description?: string | null
          external_link?: string | null
          id?: string
          is_published?: boolean
          speaker: string
          title: string
          updated_at?: string
          youtube_url?: string | null
        }
        Update: {
          audio_url?: string | null
          created_at?: string
          date?: string
          description?: string | null
          external_link?: string | null
          id?: string
          is_published?: boolean
          speaker?: string
          title?: string
          updated_at?: string
          youtube_url?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
    }
    Enums: {
      app_role: "super_admin" | "admin" | "editor" | "user"
      gallery_category: "Services" | "Conferences" | "Outreach" | "Youth Events"
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
      app_role: ["super_admin", "admin", "editor", "user"],
      gallery_category: ["Services", "Conferences", "Outreach", "Youth Events"],
    },
  },
} as const
