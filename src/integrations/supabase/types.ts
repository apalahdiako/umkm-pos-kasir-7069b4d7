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
      attendance: {
        Row: {
          clock_in: string | null
          clock_out: string | null
          created_at: string
          date: string
          employee_id: string
          id: string
          notes: string | null
          status: string
          user_id: string
        }
        Insert: {
          clock_in?: string | null
          clock_out?: string | null
          created_at?: string
          date?: string
          employee_id: string
          id?: string
          notes?: string | null
          status?: string
          user_id: string
        }
        Update: {
          clock_in?: string | null
          clock_out?: string | null
          created_at?: string
          date?: string
          employee_id?: string
          id?: string
          notes?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      chart_of_accounts: {
        Row: {
          account_type: string
          code: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          parent_code: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_type: string
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          parent_code?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_type?: string
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          parent_code?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          points: number
          tier: string
          total_spent: number
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          points?: number
          tier?: string
          total_spent?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          points?: number
          tier?: string
          total_spent?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
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
      employees: {
        Row: {
          base_salary: number
          commission_percent: number
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          name: string
          phone: string | null
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          base_salary?: number
          commission_percent?: number
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          phone?: string | null
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          base_salary?: number
          commission_percent?: number
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          phone?: string | null
          role?: string
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
      inventory_items: {
        Row: {
          category: string | null
          cost_price: number
          created_at: string
          current_stock: number
          id: string
          min_stock: number
          name: string
          notes: string | null
          sell_price: number
          sku: string | null
          unit: string
          updated_at: string
          user_id: string
          warehouse_id: string | null
        }
        Insert: {
          category?: string | null
          cost_price?: number
          created_at?: string
          current_stock?: number
          id?: string
          min_stock?: number
          name: string
          notes?: string | null
          sell_price?: number
          sku?: string | null
          unit?: string
          updated_at?: string
          user_id: string
          warehouse_id?: string | null
        }
        Update: {
          category?: string | null
          cost_price?: number
          created_at?: string
          current_stock?: number
          id?: string
          min_stock?: number
          name?: string
          notes?: string | null
          sell_price?: number
          sku?: string | null
          unit?: string
          updated_at?: string
          user_id?: string
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
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
      journal_entries: {
        Row: {
          created_at: string
          description: string
          entry_date: string
          id: string
          reference: string | null
          total_amount: number
          user_id: string
        }
        Insert: {
          created_at?: string
          description: string
          entry_date?: string
          id?: string
          reference?: string | null
          total_amount?: number
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          entry_date?: string
          id?: string
          reference?: string | null
          total_amount?: number
          user_id?: string
        }
        Relationships: []
      }
      journal_lines: {
        Row: {
          account_code: string
          account_name: string
          created_at: string
          credit: number
          debit: number
          entry_id: string
          id: string
          user_id: string
        }
        Insert: {
          account_code: string
          account_name: string
          created_at?: string
          credit?: number
          debit?: number
          entry_id: string
          id?: string
          user_id: string
        }
        Update: {
          account_code?: string
          account_name?: string
          created_at?: string
          credit?: number
          debit?: number
          entry_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_lines_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_transactions: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          notes: string | null
          points: number
          reference: string | null
          tx_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          notes?: string | null
          points: number
          reference?: string | null
          tx_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          notes?: string | null
          points?: number
          reference?: string | null
          tx_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
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
      payables: {
        Row: {
          amount: number
          created_at: string
          due_date: string | null
          id: string
          notes: string | null
          paid_amount: number
          status: string
          updated_at: string
          user_id: string
          vendor_name: string
        }
        Insert: {
          amount: number
          created_at?: string
          due_date?: string | null
          id?: string
          notes?: string | null
          paid_amount?: number
          status?: string
          updated_at?: string
          user_id: string
          vendor_name: string
        }
        Update: {
          amount?: number
          created_at?: string
          due_date?: string | null
          id?: string
          notes?: string | null
          paid_amount?: number
          status?: string
          updated_at?: string
          user_id?: string
          vendor_name?: string
        }
        Relationships: []
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
      receivables: {
        Row: {
          amount: number
          created_at: string
          customer_id: string | null
          customer_name: string
          due_date: string | null
          id: string
          notes: string | null
          paid_amount: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          customer_id?: string | null
          customer_name: string
          due_date?: string | null
          id?: string
          notes?: string | null
          paid_amount?: number
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          customer_id?: string | null
          customer_name?: string
          due_date?: string | null
          id?: string
          notes?: string | null
          paid_amount?: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "receivables_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
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
      shifts: {
        Row: {
          closing_cash: number | null
          created_at: string
          employee_id: string | null
          end_at: string | null
          id: string
          notes: string | null
          opening_cash: number
          start_at: string
          status: string
          total_sales: number
          total_transactions: number
          updated_at: string
          user_id: string
        }
        Insert: {
          closing_cash?: number | null
          created_at?: string
          employee_id?: string | null
          end_at?: string | null
          id?: string
          notes?: string | null
          opening_cash?: number
          start_at?: string
          status?: string
          total_sales?: number
          total_transactions?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          closing_cash?: number | null
          created_at?: string
          employee_id?: string | null
          end_at?: string | null
          id?: string
          notes?: string | null
          opening_cash?: number
          start_at?: string
          status?: string
          total_sales?: number
          total_transactions?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shifts_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          created_at: string
          id: string
          item_id: string
          movement_type: string
          notes: string | null
          qty: number
          reference: string | null
          unit_cost: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          movement_type: string
          notes?: string | null
          qty: number
          reference?: string | null
          unit_cost?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          movement_type?: string
          notes?: string | null
          qty?: number
          reference?: string | null
          unit_cost?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
        ]
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
      vouchers: {
        Row: {
          code: string
          created_at: string
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          is_active: boolean
          min_purchase: number
          quota: number
          updated_at: string
          used_count: number
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          discount_type: string
          discount_value: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          min_purchase?: number
          quota?: number
          updated_at?: string
          used_count?: number
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          min_purchase?: number
          quota?: number
          updated_at?: string
          used_count?: number
          user_id?: string
        }
        Relationships: []
      }
      warehouses: {
        Row: {
          address: string | null
          created_at: string
          id: string
          is_default: boolean
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          is_default?: boolean
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          is_default?: boolean
          name?: string
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
