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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      custom_domains: {
        Row: {
          created_at: string
          domain: string
          id: string
          status: string
          store_id: string
          updated_at: string
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          domain: string
          id?: string
          status?: string
          store_id: string
          updated_at?: string
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          domain?: string
          id?: string
          status?: string
          store_id?: string
          updated_at?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_domains_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string
          state: string | null
          store_id: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone: string
          state?: string | null
          store_id: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string
          state?: string | null
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_id: string
          quantity: number
          total: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_id: string
          quantity?: number
          total: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          city: string | null
          created_at: string
          customer_id: string
          delivery_address: string | null
          delivery_fee: number
          id: string
          notes: string | null
          order_number: string
          state: string | null
          status: Database["public"]["Enums"]["order_status"]
          store_id: string
          subtotal: number
          total: number
          updated_at: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          customer_id: string
          delivery_address?: string | null
          delivery_fee?: number
          id?: string
          notes?: string | null
          order_number: string
          state?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          store_id: string
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Update: {
          city?: string | null
          created_at?: string
          customer_id?: string
          delivery_address?: string | null
          delivery_fee?: number
          id?: string
          notes?: string | null
          order_number?: string
          state?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          store_id?: string
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          order_id: string
          paid_at: string | null
          payment_channel: string | null
          paystack_access_code: string | null
          paystack_reference: string | null
          status: Database["public"]["Enums"]["payment_status"]
          store_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          order_id: string
          paid_at?: string | null
          payment_channel?: string | null
          paystack_access_code?: string | null
          paystack_reference?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          store_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          order_id?: string
          paid_at?: string | null
          payment_channel?: string | null
          paystack_access_code?: string | null
          paystack_reference?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          created_at: string
          display_order: number
          id: string
          image_url: string
          product_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          image_url: string
          product_id: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
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
          description: string | null
          digital_file_url: string | null
          id: string
          is_active: boolean
          name: string
          price: number
          product_type: Database["public"]["Enums"]["product_type"]
          slug: string
          stock_quantity: number | null
          store_id: string
          track_inventory: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          digital_file_url?: string | null
          id?: string
          is_active?: boolean
          name: string
          price: number
          product_type?: Database["public"]["Enums"]["product_type"]
          slug: string
          stock_quantity?: number | null
          store_id: string
          track_inventory?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          digital_file_url?: string | null
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          product_type?: Database["public"]["Enums"]["product_type"]
          slug?: string
          stock_quantity?: number | null
          store_id?: string
          track_inventory?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reserved_slugs: {
        Row: {
          slug: string
        }
        Insert: {
          slug: string
        }
        Update: {
          slug?: string
        }
        Relationships: []
      }
      stores: {
        Row: {
          brand_color: string | null
          category: string
          created_at: string
          delivery_fee: number | null
          description: string | null
          id: string
          instagram_handle: string | null
          is_active: boolean
          logo_url: string | null
          name: string
          paystack_subaccount_code: string | null
          slug: string
          updated_at: string
          user_id: string
          whatsapp_number: string | null
        }
        Insert: {
          brand_color?: string | null
          category?: string
          created_at?: string
          delivery_fee?: number | null
          description?: string | null
          id?: string
          instagram_handle?: string | null
          is_active?: boolean
          logo_url?: string | null
          name: string
          paystack_subaccount_code?: string | null
          slug: string
          updated_at?: string
          user_id: string
          whatsapp_number?: string | null
        }
        Update: {
          brand_color?: string | null
          category?: string
          created_at?: string
          delivery_fee?: number | null
          description?: string | null
          id?: string
          instagram_handle?: string | null
          is_active?: boolean
          logo_url?: string | null
          name?: string
          paystack_subaccount_code?: string | null
          slug?: string
          updated_at?: string
          user_id?: string
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          plan: Database["public"]["Enums"]["subscription_plan"]
          started_at: string
          store_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          plan?: Database["public"]["Enums"]["subscription_plan"]
          started_at?: string
          store_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          plan?: Database["public"]["Enums"]["subscription_plan"]
          started_at?: string
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      order_status: "pending" | "paid" | "shipped" | "delivered" | "cancelled"
      payment_status: "pending" | "success" | "failed"
      product_type: "physical" | "digital"
      subscription_plan: "free" | "pro"
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
      order_status: ["pending", "paid", "shipped", "delivered", "cancelled"],
      payment_status: ["pending", "success", "failed"],
      product_type: ["physical", "digital"],
      subscription_plan: ["free", "pro"],
    },
  },
} as const
