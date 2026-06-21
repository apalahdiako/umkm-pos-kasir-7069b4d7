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
      disbursements: {
        Row: {
          account_number: string
          amount: number
          bank_code: string
          completed_at: string | null
          created_at: string
          fee: number
          flip_id: number | null
          id: string
          idempotency_key: string
          raw: Json | null
          recipient_name: string | null
          remark: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_number: string
          amount: number
          bank_code: string
          completed_at?: string | null
          created_at?: string
          fee?: number
          flip_id?: number | null
          id?: string
          idempotency_key: string
          raw?: Json | null
          recipient_name?: string | null
          remark?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_number?: string
          amount?: number
          bank_code?: string
          completed_at?: string | null
          created_at?: string
          fee?: number
          flip_id?: number | null
          id?: string
          idempotency_key?: string
          raw?: Json | null
          recipient_name?: string | null
          remark?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      hpp_products: {
        Row: {
          biaya_lain: Json
          category: string
          created_at: string
          description: string | null
          handling: number
          harga_beli: number
          harga_jual: number
          id: string
          images: Json
          is_active: boolean
          kemasan: number
          margin_target: number
          min_stock: number
          name: string
          notes: string | null
          ongkir: number
          owner_id: string
          packaging_final: number
          pajak: number
          shrinkage: number
          sku: string
          stock: number
          total_hpp: number
          updated_at: string
        }
        Insert: {
          biaya_lain?: Json
          category?: string
          created_at?: string
          description?: string | null
          handling?: number
          harga_beli?: number
          harga_jual?: number
          id?: string
          images?: Json
          is_active?: boolean
          kemasan?: number
          margin_target?: number
          min_stock?: number
          name: string
          notes?: string | null
          ongkir?: number
          owner_id: string
          packaging_final?: number
          pajak?: number
          shrinkage?: number
          sku: string
          stock?: number
          total_hpp?: number
          updated_at?: string
        }
        Update: {
          biaya_lain?: Json
          category?: string
          created_at?: string
          description?: string | null
          handling?: number
          harga_beli?: number
          harga_jual?: number
          id?: string
          images?: Json
          is_active?: boolean
          kemasan?: number
          margin_target?: number
          min_stock?: number
          name?: string
          notes?: string | null
          ongkir?: number
          owner_id?: string
          packaging_final?: number
          pajak?: number
          shrinkage?: number
          sku?: string
          stock?: number
          total_hpp?: number
          updated_at?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          created_at: string
          customer_email: string | null
          customer_name: string
          customer_phone: string | null
          discount: number
          due_date: string | null
          id: string
          invoice_no: string
          issue_date: string
          items: Json
          notes: string | null
          owner_id: string
          paid_at: string | null
          payment_method: string | null
          status: string
          subtotal: number
          tax: number
          total: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_email?: string | null
          customer_name: string
          customer_phone?: string | null
          discount?: number
          due_date?: string | null
          id?: string
          invoice_no: string
          issue_date?: string
          items?: Json
          notes?: string | null
          owner_id: string
          paid_at?: string | null
          payment_method?: string | null
          status?: string
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string | null
          discount?: number
          due_date?: string | null
          id?: string
          invoice_no?: string
          issue_date?: string
          items?: Json
          notes?: string | null
          owner_id?: string
          paid_at?: string | null
          payment_method?: string | null
          status?: string
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string
        }
        Relationships: []
      }
      open_bills: {
        Row: {
          closed_at: string | null
          created_at: string
          id: string
          items: Json
          notes: string | null
          opened_at: string
          owner_id: string
          status: string
          subtotal: number
          table_id: string | null
          table_name: string | null
          updated_at: string
        }
        Insert: {
          closed_at?: string | null
          created_at?: string
          id?: string
          items?: Json
          notes?: string | null
          opened_at?: string
          owner_id: string
          status?: string
          subtotal?: number
          table_id?: string | null
          table_name?: string | null
          updated_at?: string
        }
        Update: {
          closed_at?: string | null
          created_at?: string
          id?: string
          items?: Json
          notes?: string | null
          opened_at?: string
          owner_id?: string
          status?: string
          subtotal?: number
          table_id?: string | null
          table_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "open_bills_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_requests: {
        Row: {
          amount: number
          bill_payload: Json | null
          created_at: string
          flip_link_id: number | null
          flip_link_url: string | null
          id: string
          paid_at: string | null
          payment_method: string | null
          sender_name: string | null
          status: string
          step: number
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          bill_payload?: Json | null
          created_at?: string
          flip_link_id?: number | null
          flip_link_url?: string | null
          id?: string
          paid_at?: string | null
          payment_method?: string | null
          sender_name?: string | null
          status?: string
          step?: number
          title: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          bill_payload?: Json | null
          created_at?: string
          flip_link_id?: number | null
          flip_link_url?: string | null
          id?: string
          paid_at?: string | null
          payment_method?: string | null
          sender_name?: string | null
          status?: string
          step?: number
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      product_channels: {
        Row: {
          channel_name: string
          created_at: string
          fee_nominal: number
          fee_persen: number
          harga_jual: number
          id: string
          owner_id: string
          product_id: string
          updated_at: string
        }
        Insert: {
          channel_name: string
          created_at?: string
          fee_nominal?: number
          fee_persen?: number
          harga_jual?: number
          id?: string
          owner_id: string
          product_id: string
          updated_at?: string
        }
        Update: {
          channel_name?: string
          created_at?: string
          fee_nominal?: number
          fee_persen?: number
          harga_jual?: number
          id?: string
          owner_id?: string
          product_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_channels_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "hpp_products"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          dana_active: boolean
          dana_holder_name: string | null
          dana_number: string | null
          dana_qr_url: string | null
          email: string | null
          full_name: string | null
          id: string
          store_name: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          dana_active?: boolean
          dana_holder_name?: string | null
          dana_number?: string | null
          dana_qr_url?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          store_name?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          dana_active?: boolean
          dana_holder_name?: string | null
          dana_number?: string | null
          dana_qr_url?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          store_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      recipes: {
        Row: {
          created_at: string
          difficulty: string | null
          hpp_per_porsi: number
          id: string
          images: Json
          ingredients: Json
          name: string
          notes: string | null
          owner_id: string
          prep_time: number | null
          total_hpp: number
          updated_at: string
          yield_qty: number
        }
        Insert: {
          created_at?: string
          difficulty?: string | null
          hpp_per_porsi?: number
          id?: string
          images?: Json
          ingredients?: Json
          name: string
          notes?: string | null
          owner_id: string
          prep_time?: number | null
          total_hpp?: number
          updated_at?: string
          yield_qty?: number
        }
        Update: {
          created_at?: string
          difficulty?: string | null
          hpp_per_porsi?: number
          id?: string
          images?: Json
          ingredients?: Json
          name?: string
          notes?: string | null
          owner_id?: string
          prep_time?: number | null
          total_hpp?: number
          updated_at?: string
          yield_qty?: number
        }
        Relationships: []
      }
      tables: {
        Row: {
          capacity: number
          created_at: string
          id: string
          name: string
          owner_id: string
          status: string
          updated_at: string
        }
        Insert: {
          capacity?: number
          created_at?: string
          id?: string
          name: string
          owner_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          capacity?: number
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
          status?: string
          updated_at?: string
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
      is_email_available: { Args: { _email: string }; Returns: boolean }
      is_store_name_available: { Args: { _name: string }; Returns: boolean }
    }
    Enums: {
      app_role: "owner" | "manajer" | "kasir"
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
      app_role: ["owner", "manajer", "kasir"],
    },
  },
} as const
