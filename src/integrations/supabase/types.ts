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
      hold_settings: {
        Row: {
          company_address: string | null
          company_email: string | null
          company_logo_url: string | null
          company_name: string | null
          default_bank_account_name: string | null
          default_bank_account_number: string | null
          default_bank_name: string | null
          default_btc_wallet: string | null
          default_crypto_currency: string | null
          default_crypto_wallet: string | null
          default_eth_wallet: string | null
          default_hold_body: string | null
          default_hold_footer: string | null
          default_hold_headline: string | null
          default_payment_mode: string | null
          default_payment_note: string | null
          default_usdt_wallet: string | null
          id: number
          support_email: string | null
          updated_at: string
        }
        Insert: {
          company_address?: string | null
          company_email?: string | null
          company_logo_url?: string | null
          company_name?: string | null
          default_bank_account_name?: string | null
          default_bank_account_number?: string | null
          default_bank_name?: string | null
          default_btc_wallet?: string | null
          default_crypto_currency?: string | null
          default_crypto_wallet?: string | null
          default_eth_wallet?: string | null
          default_hold_body?: string | null
          default_hold_footer?: string | null
          default_hold_headline?: string | null
          default_payment_mode?: string | null
          default_payment_note?: string | null
          default_usdt_wallet?: string | null
          id?: number
          support_email?: string | null
          updated_at?: string
        }
        Update: {
          company_address?: string | null
          company_email?: string | null
          company_logo_url?: string | null
          company_name?: string | null
          default_bank_account_name?: string | null
          default_bank_account_number?: string | null
          default_bank_name?: string | null
          default_btc_wallet?: string | null
          default_crypto_currency?: string | null
          default_crypto_wallet?: string | null
          default_eth_wallet?: string | null
          default_hold_body?: string | null
          default_hold_footer?: string | null
          default_hold_headline?: string | null
          default_payment_mode?: string | null
          default_payment_note?: string | null
          default_usdt_wallet?: string | null
          id?: number
          support_email?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      shipments: {
        Row: {
          amount_due: number | null
          bank_account_name: string | null
          bank_account_number: string | null
          bank_instruction_note: string | null
          bank_name: string | null
          comments: string | null
          created_at: string
          crypto_currency: string | null
          crypto_wallet_address: string | null
          current_location: string | null
          current_stop_label: string | null
          current_stop_lat: number | null
          current_stop_lng: number | null
          date_sent: string | null
          description: string | null
          destination_label: string | null
          destination_lat: number | null
          destination_lng: number | null
          expected_delivery_date: string | null
          history: Json
          hold_amount: string | null
          hold_body: string | null
          hold_contact_email: string | null
          hold_footer_note: string | null
          hold_headline: string | null
          id: string
          origin_label: string | null
          origin_lat: number | null
          origin_lng: number | null
          package_image_url: string | null
          package_type: string | null
          payment_instruction_note: string | null
          payment_mode: string | null
          proof_of_delivery_url: string | null
          receiver_address: string | null
          receiver_country: string | null
          receiver_email: string | null
          receiver_name: string | null
          receiver_phone: string | null
          sender_address: string | null
          sender_country: string | null
          sender_email: string | null
          sender_name: string | null
          sender_phone: string | null
          show_airport_step: boolean | null
          show_image: boolean | null
          status: string | null
          tracking_number: string
          transport_mode: string
          updated_at: string
          weight: string | null
        }
        Insert: {
          amount_due?: number | null
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_instruction_note?: string | null
          bank_name?: string | null
          comments?: string | null
          created_at?: string
          crypto_currency?: string | null
          crypto_wallet_address?: string | null
          current_location?: string | null
          current_stop_label?: string | null
          current_stop_lat?: number | null
          current_stop_lng?: number | null
          date_sent?: string | null
          description?: string | null
          destination_label?: string | null
          destination_lat?: number | null
          destination_lng?: number | null
          expected_delivery_date?: string | null
          history?: Json
          hold_amount?: string | null
          hold_body?: string | null
          hold_contact_email?: string | null
          hold_footer_note?: string | null
          hold_headline?: string | null
          id?: string
          origin_label?: string | null
          origin_lat?: number | null
          origin_lng?: number | null
          package_image_url?: string | null
          package_type?: string | null
          payment_instruction_note?: string | null
          payment_mode?: string | null
          proof_of_delivery_url?: string | null
          receiver_address?: string | null
          receiver_country?: string | null
          receiver_email?: string | null
          receiver_name?: string | null
          receiver_phone?: string | null
          sender_address?: string | null
          sender_country?: string | null
          sender_email?: string | null
          sender_name?: string | null
          sender_phone?: string | null
          show_airport_step?: boolean | null
          show_image?: boolean | null
          status?: string | null
          tracking_number: string
          transport_mode?: string
          updated_at?: string
          weight?: string | null
        }
        Update: {
          amount_due?: number | null
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_instruction_note?: string | null
          bank_name?: string | null
          comments?: string | null
          created_at?: string
          crypto_currency?: string | null
          crypto_wallet_address?: string | null
          current_location?: string | null
          current_stop_label?: string | null
          current_stop_lat?: number | null
          current_stop_lng?: number | null
          date_sent?: string | null
          description?: string | null
          destination_label?: string | null
          destination_lat?: number | null
          destination_lng?: number | null
          expected_delivery_date?: string | null
          history?: Json
          hold_amount?: string | null
          hold_body?: string | null
          hold_contact_email?: string | null
          hold_footer_note?: string | null
          hold_headline?: string | null
          id?: string
          origin_label?: string | null
          origin_lat?: number | null
          origin_lng?: number | null
          package_image_url?: string | null
          package_type?: string | null
          payment_instruction_note?: string | null
          payment_mode?: string | null
          proof_of_delivery_url?: string | null
          receiver_address?: string | null
          receiver_country?: string | null
          receiver_email?: string | null
          receiver_name?: string | null
          receiver_phone?: string | null
          sender_address?: string | null
          sender_country?: string | null
          sender_email?: string | null
          sender_name?: string | null
          sender_phone?: string | null
          show_airport_step?: boolean | null
          show_image?: boolean | null
          status?: string | null
          tracking_number?: string
          transport_mode?: string
          updated_at?: string
          weight?: string | null
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
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
