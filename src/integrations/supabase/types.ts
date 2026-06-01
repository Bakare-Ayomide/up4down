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
      ad_events: {
        Row: {
          ad_id: string
          browser: string | null
          city: string | null
          country: string | null
          created_at: string
          device_type: string | null
          event_type: string
          id: string
          ip_address: string | null
          os: string | null
          page: string | null
          referrer: string | null
          screen_resolution: string | null
          user_agent: string | null
        }
        Insert: {
          ad_id: string
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_type: string
          id?: string
          ip_address?: string | null
          os?: string | null
          page?: string | null
          referrer?: string | null
          screen_resolution?: string | null
          user_agent?: string | null
        }
        Update: {
          ad_id?: string
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_type?: string
          id?: string
          ip_address?: string | null
          os?: string | null
          page?: string | null
          referrer?: string | null
          screen_resolution?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_events_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ads"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_snippets: {
        Row: {
          ad_type: string
          created_at: string
          id: string
          name: string
          placement: string
          preview_notes: string | null
          snippet: string
          status: string
          updated_at: string
        }
        Insert: {
          ad_type?: string
          created_at?: string
          id?: string
          name: string
          placement?: string
          preview_notes?: string | null
          snippet: string
          status?: string
          updated_at?: string
        }
        Update: {
          ad_type?: string
          created_at?: string
          id?: string
          name?: string
          placement?: string
          preview_notes?: string | null
          snippet?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      ads: {
        Row: {
          ad_size: string
          ad_url: string
          clicks: number
          created_at: string
          custom_height: number | null
          custom_width: number | null
          description: string | null
          id: string
          impressions: number
          is_active: boolean
          media_type: string
          media_url: string | null
          pages: string[]
          position: string
          redirect_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          ad_size?: string
          ad_url: string
          clicks?: number
          created_at?: string
          custom_height?: number | null
          custom_width?: number | null
          description?: string | null
          id?: string
          impressions?: number
          is_active?: boolean
          media_type?: string
          media_url?: string | null
          pages?: string[]
          position?: string
          redirect_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          ad_size?: string
          ad_url?: string
          clicks?: number
          created_at?: string
          custom_height?: number | null
          custom_width?: number | null
          description?: string | null
          id?: string
          impressions?: number
          is_active?: boolean
          media_type?: string
          media_url?: string | null
          pages?: string[]
          position?: string
          redirect_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      announcements: {
        Row: {
          created_at: string
          display_type: string
          id: string
          image: string | null
          link: string | null
          message: string
          schedule_time: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_type?: string
          id?: string
          image?: string | null
          link?: string | null
          message?: string
          schedule_time?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_type?: string
          id?: string
          image?: string | null
          link?: string | null
          message?: string
          schedule_time?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      channel_members: {
        Row: {
          channel_id: string
          id: string
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          channel_id: string
          id?: string
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          channel_id?: string
          id?: string
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "channel_members_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
        ]
      }
      channel_messages: {
        Row: {
          attachment_type: string | null
          attachment_url: string | null
          channel_id: string
          content: string | null
          created_at: string
          edited_at: string | null
          id: string
          pinned: boolean
          reply_to_id: string | null
          user_display_name: string | null
          user_id: string
        }
        Insert: {
          attachment_type?: string | null
          attachment_url?: string | null
          channel_id: string
          content?: string | null
          created_at?: string
          edited_at?: string | null
          id?: string
          pinned?: boolean
          reply_to_id?: string | null
          user_display_name?: string | null
          user_id: string
        }
        Update: {
          attachment_type?: string | null
          attachment_url?: string | null
          channel_id?: string
          content?: string | null
          created_at?: string
          edited_at?: string | null
          id?: string
          pinned?: boolean
          reply_to_id?: string | null
          user_display_name?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "channel_messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
        ]
      }
      channels: {
        Row: {
          cover_url: string | null
          created_at: string
          created_by: string | null
          description: string | null
          icon_url: string | null
          id: string
          is_announcement_only: boolean
          is_public: boolean
          member_count: number
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          icon_url?: string | null
          id?: string
          is_announcement_only?: boolean
          is_public?: boolean
          member_count?: number
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          icon_url?: string | null
          id?: string
          is_announcement_only?: boolean
          is_public?: boolean
          member_count?: number
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      custom_pages: {
        Row: {
          content: Json
          created_at: string
          id: string
          published: boolean
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          content?: Json
          created_at?: string
          id?: string
          published?: boolean
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          published?: boolean
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      download_item_categories: {
        Row: {
          category_id: string
          created_at: string
          id: string
          item_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          item_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "download_item_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "download_item_categories_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "download_items"
            referencedColumns: ["id"]
          },
        ]
      }
      download_items: {
        Row: {
          average_rating: number | null
          created_at: string
          custom_js: string | null
          description: string | null
          download_count: number
          download_url: string
          featured: boolean | null
          file_size: string | null
          file_type: string
          id: string
          rating_count: number
          thumbnail_url: string | null
          title: string
          updated_at: string
          version: string | null
        }
        Insert: {
          average_rating?: number | null
          created_at?: string
          custom_js?: string | null
          description?: string | null
          download_count?: number
          download_url: string
          featured?: boolean | null
          file_size?: string | null
          file_type: string
          id?: string
          rating_count?: number
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          version?: string | null
        }
        Update: {
          average_rating?: number | null
          created_at?: string
          custom_js?: string | null
          description?: string | null
          download_count?: number
          download_url?: string
          featured?: boolean | null
          file_size?: string | null
          file_type?: string
          id?: string
          rating_count?: number
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          version?: string | null
        }
        Relationships: []
      }
      download_logs: {
        Row: {
          created_at: string
          id: string
          item_id: string | null
          item_title: string
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          item_id?: string | null
          item_title: string
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string | null
          item_title?: string
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "download_logs_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "download_items"
            referencedColumns: ["id"]
          },
        ]
      }
      faq_entries: {
        Row: {
          answer: string
          created_at: string
          id: string
          published: boolean
          question: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          answer?: string
          created_at?: string
          id?: string
          published?: boolean
          question: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          answer?: string
          created_at?: string
          id?: string
          published?: boolean
          question?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      media_assets: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          image_url: string
          title: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url: string
          title: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string
          title?: string
        }
        Relationships: []
      }
      news: {
        Row: {
          content: string
          created_at: string
          excerpt: string | null
          file_urls: Json | null
          id: string
          published: boolean
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          content?: string
          created_at?: string
          excerpt?: string | null
          file_urls?: Json | null
          id?: string
          published?: boolean
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          excerpt?: string | null
          file_urls?: Json | null
          id?: string
          published?: boolean
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      newsletter_logs: {
        Row: {
          content: string
          content_type: string
          created_at: string
          id: string
          news_id: string | null
          recipient_count: number
          sent_at: string
          subject: string
          trigger_type: string
        }
        Insert: {
          content: string
          content_type?: string
          created_at?: string
          id?: string
          news_id?: string | null
          recipient_count?: number
          sent_at?: string
          subject: string
          trigger_type?: string
        }
        Update: {
          content?: string
          content_type?: string
          created_at?: string
          id?: string
          news_id?: string | null
          recipient_count?: number
          sent_at?: string
          subject?: string
          trigger_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "newsletter_logs_news_id_fkey"
            columns: ["news_id"]
            isOneToOne: false
            referencedRelation: "news"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ratings: {
        Row: {
          created_at: string
          id: string
          item_id: string | null
          rating: number
          user_identifier: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id?: string | null
          rating: number
          user_identifier: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string | null
          rating?: number
          user_identifier?: string
        }
        Relationships: [
          {
            foreignKeyName: "ratings_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "download_items"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      subscription_notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read_at: string | null
          subscription_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read_at?: string | null
          subscription_id?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read_at?: string | null
          subscription_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          amount_paid: number
          created_at: string
          currency: string
          email: string | null
          expires_at: string | null
          id: string
          payment_reference: string | null
          rejection_reason: string | null
          screenshot_url: string | null
          started_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_paid?: number
          created_at?: string
          currency?: string
          email?: string | null
          expires_at?: string | null
          id?: string
          payment_reference?: string | null
          rejection_reason?: string | null
          screenshot_url?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_paid?: number
          created_at?: string
          currency?: string
          email?: string | null
          expires_at?: string | null
          id?: string
          payment_reference?: string | null
          rejection_reason?: string | null
          screenshot_url?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      telegram_bots: {
        Row: {
          bot_token: string
          bot_username: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
          webhook_url: string | null
        }
        Insert: {
          bot_token: string
          bot_username?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
          webhook_url?: string | null
        }
        Update: {
          bot_token?: string
          bot_username?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          webhook_url?: string | null
        }
        Relationships: []
      }
      telegram_connected_chats: {
        Row: {
          bot_id: string
          chat_id: number
          chat_title: string | null
          chat_type: string
          created_at: string
          id: string
          is_active: boolean
          last_message_at: string | null
          messages_processed: number
          updated_at: string
        }
        Insert: {
          bot_id: string
          chat_id: number
          chat_title?: string | null
          chat_type?: string
          created_at?: string
          id?: string
          is_active?: boolean
          last_message_at?: string | null
          messages_processed?: number
          updated_at?: string
        }
        Update: {
          bot_id?: string
          chat_id?: number
          chat_title?: string | null
          chat_type?: string
          created_at?: string
          id?: string
          is_active?: boolean
          last_message_at?: string | null
          messages_processed?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "telegram_connected_chats_bot_id_fkey"
            columns: ["bot_id"]
            isOneToOne: false
            referencedRelation: "telegram_bots"
            referencedColumns: ["id"]
          },
        ]
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
      waitlist_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          source: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          source?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          source?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auto_downgrade_expired_subscriptions: { Args: never; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_ad_clicks: { Args: { ad_id: string }; Returns: undefined }
      increment_ad_impressions: { Args: { ad_id: string }; Returns: undefined }
      increment_chat_messages: {
        Args: { _bot_id: string; _chat_id: number }
        Returns: undefined
      }
      increment_download_count: {
        Args: { item_id: string }
        Returns: undefined
      }
      is_channel_member: {
        Args: { _channel_id: string; _user_id: string }
        Returns: boolean
      }
      update_item_rating: { Args: { item_id: string }; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
