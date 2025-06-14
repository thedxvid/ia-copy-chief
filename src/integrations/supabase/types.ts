export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      agent_files: {
        Row: {
          agent_id: string
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string
          id: string
          processed_content: string | null
        }
        Insert: {
          agent_id: string
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          file_type: string
          id?: string
          processed_content?: string | null
        }
        Update: {
          agent_id?: string
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string
          id?: string
          processed_content?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_files_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "custom_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_agents: {
        Row: {
          created_at: string
          description: string | null
          icon_name: string | null
          id: string
          knowledge_base: Json | null
          name: string
          prompt: string
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon_name?: string | null
          id?: string
          knowledge_base?: Json | null
          name: string
          prompt: string
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon_name?: string | null
          id?: string
          knowledge_base?: Json | null
          name?: string
          prompt?: string
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      product_analytics: {
        Row: {
          benchmark_data: Json | null
          campaign_end: string | null
          campaign_start: string | null
          conversion_rate: number | null
          copy_efficiency_score: number | null
          created_at: string
          ctr: number | null
          engagement_rate: number | null
          estimated_conversion_rate: number | null
          id: string
          impressions: number | null
          notes: string | null
          performance_metrics: Json | null
          product_id: string
          roi_real: number | null
          sales_generated: number | null
          status: string | null
          updated_at: string
        }
        Insert: {
          benchmark_data?: Json | null
          campaign_end?: string | null
          campaign_start?: string | null
          conversion_rate?: number | null
          copy_efficiency_score?: number | null
          created_at?: string
          ctr?: number | null
          engagement_rate?: number | null
          estimated_conversion_rate?: number | null
          id?: string
          impressions?: number | null
          notes?: string | null
          performance_metrics?: Json | null
          product_id: string
          roi_real?: number | null
          sales_generated?: number | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          benchmark_data?: Json | null
          campaign_end?: string | null
          campaign_start?: string | null
          conversion_rate?: number | null
          copy_efficiency_score?: number | null
          created_at?: string
          ctr?: number | null
          engagement_rate?: number | null
          estimated_conversion_rate?: number | null
          id?: string
          impressions?: number | null
          notes?: string | null
          performance_metrics?: Json | null
          product_id?: string
          roi_real?: number | null
          sales_generated?: number | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_analytics_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_copy: {
        Row: {
          created_at: string
          email_campaign: Json | null
          id: string
          landing_page_copy: Json | null
          product_id: string
          social_media_content: Json | null
          telegram_messages: string[] | null
          updated_at: string
          vsl_script: string | null
          whatsapp_messages: string[] | null
        }
        Insert: {
          created_at?: string
          email_campaign?: Json | null
          id?: string
          landing_page_copy?: Json | null
          product_id: string
          social_media_content?: Json | null
          telegram_messages?: string[] | null
          updated_at?: string
          vsl_script?: string | null
          whatsapp_messages?: string[] | null
        }
        Update: {
          created_at?: string
          email_campaign?: Json | null
          id?: string
          landing_page_copy?: Json | null
          product_id?: string
          social_media_content?: Json | null
          telegram_messages?: string[] | null
          updated_at?: string
          vsl_script?: string | null
          whatsapp_messages?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "product_copy_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_history: {
        Row: {
          change_type: string
          created_at: string
          description: string | null
          field_changed: string | null
          id: string
          new_value: Json | null
          old_value: Json | null
          product_id: string
          user_id: string
        }
        Insert: {
          change_type: string
          created_at?: string
          description?: string | null
          field_changed?: string | null
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          product_id: string
          user_id: string
        }
        Update: {
          change_type?: string
          created_at?: string
          description?: string | null
          field_changed?: string | null
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_history_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_meta: {
        Row: {
          ai_evaluation: Json | null
          created_at: string
          id: string
          private_notes: string | null
          product_id: string
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          ai_evaluation?: Json | null
          created_at?: string
          id?: string
          private_notes?: string | null
          product_id: string
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          ai_evaluation?: Json | null
          created_at?: string
          id?: string
          private_notes?: string | null
          product_id?: string
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_meta_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_offer: {
        Row: {
          bonuses: Json[] | null
          created_at: string
          downsell: Json | null
          id: string
          main_offer: Json | null
          order_bump: Json | null
          pricing_strategy: Json | null
          product_id: string
          updated_at: string
          upsell: Json | null
        }
        Insert: {
          bonuses?: Json[] | null
          created_at?: string
          downsell?: Json | null
          id?: string
          main_offer?: Json | null
          order_bump?: Json | null
          pricing_strategy?: Json | null
          product_id: string
          updated_at?: string
          upsell?: Json | null
        }
        Update: {
          bonuses?: Json[] | null
          created_at?: string
          downsell?: Json | null
          id?: string
          main_offer?: Json | null
          order_bump?: Json | null
          pricing_strategy?: Json | null
          product_id?: string
          updated_at?: string
          upsell?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "product_offer_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_strategy: {
        Row: {
          created_at: string
          id: string
          market_positioning: string | null
          product_id: string
          target_audience: Json | null
          updated_at: string
          value_proposition: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          market_positioning?: string | null
          product_id: string
          target_audience?: Json | null
          updated_at?: string
          value_proposition?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          market_positioning?: string | null
          product_id?: string
          target_audience?: Json | null
          updated_at?: string
          value_proposition?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_strategy_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          created_at: string
          id: string
          name: string
          niche: string
          status: string | null
          sub_niche: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          niche: string
          status?: string | null
          sub_niche?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          niche?: string
          status?: string | null
          sub_niche?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          extra_tokens: number | null
          full_name: string | null
          id: string
          monthly_tokens: number | null
          notified_10: boolean | null
          notified_50: boolean | null
          notified_90: boolean | null
          tokens_reset_date: string | null
          total_tokens_used: number | null
          tutorial_completed: boolean
          tutorial_skipped: boolean
          tutorial_step: number | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          extra_tokens?: number | null
          full_name?: string | null
          id: string
          monthly_tokens?: number | null
          notified_10?: boolean | null
          notified_50?: boolean | null
          notified_90?: boolean | null
          tokens_reset_date?: string | null
          total_tokens_used?: number | null
          tutorial_completed?: boolean
          tutorial_skipped?: boolean
          tutorial_step?: number | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          extra_tokens?: number | null
          full_name?: string | null
          id?: string
          monthly_tokens?: number | null
          notified_10?: boolean | null
          notified_50?: boolean | null
          notified_90?: boolean | null
          tokens_reset_date?: string | null
          total_tokens_used?: number | null
          tutorial_completed?: boolean
          tutorial_skipped?: boolean
          tutorial_step?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      token_purchases: {
        Row: {
          amount_paid: number | null
          created_at: string | null
          id: string
          payment_id: string | null
          status: string | null
          tokens_purchased: number
          user_id: string
        }
        Insert: {
          amount_paid?: number | null
          created_at?: string | null
          id?: string
          payment_id?: string | null
          status?: string | null
          tokens_purchased: number
          user_id: string
        }
        Update: {
          amount_paid?: number | null
          created_at?: string | null
          id?: string
          payment_id?: string | null
          status?: string | null
          tokens_purchased?: number
          user_id?: string
        }
        Relationships: []
      }
      token_usage: {
        Row: {
          completion_tokens: number | null
          created_at: string | null
          feature_used: string
          id: string
          prompt_tokens: number | null
          tokens_used: number
          total_tokens: number
          user_id: string
        }
        Insert: {
          completion_tokens?: number | null
          created_at?: string | null
          feature_used: string
          id?: string
          prompt_tokens?: number | null
          tokens_used: number
          total_tokens: number
          user_id: string
        }
        Update: {
          completion_tokens?: number | null
          created_at?: string | null
          feature_used?: string
          id?: string
          prompt_tokens?: number | null
          tokens_used?: number
          total_tokens?: number
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      consume_tokens: {
        Args: {
          p_user_id: string
          p_tokens_used: number
          p_feature_used: string
          p_prompt_tokens?: number
          p_completion_tokens?: number
        }
        Returns: boolean
      }
      get_available_tokens: {
        Args: { p_user_id: string }
        Returns: {
          monthly_tokens: number
          extra_tokens: number
          total_available: number
          total_used: number
        }[]
      }
      reset_monthly_tokens: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
