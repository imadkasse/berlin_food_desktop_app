export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      categories: {
        Row: {
          id: string;
          image_url: string | null;
          name: string;
        };
        Insert: {
          id?: string;
          image_url?: string | null;
          name: string;
        };
        Update: {
          id?: string;
          image_url?: string | null;
          name?: string;
        };
        Relationships: [];
      };
      delivery_requests: {
        Row: {
          created_at: string;
          email: string | null;
          full_name: string;
          id: string;
          phone_number: string;
          status: Database["public"]["Enums"]["delivery_status"];
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email?: string | null;
          full_name: string;
          id?: string;
          phone_number: string;
          status?: Database["public"]["Enums"]["delivery_status"];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string | null;
          full_name?: string;
          id?: string;
          phone_number?: string;
          status?: Database["public"]["Enums"]["delivery_status"];
          updated_at?: string;
        };
        Relationships: [];
      };
      menu_items: {
        Row: {
          category_id: string | null;
          created_at: string;
          description: string | null;
          id: string;
          image_url: string | null;
          is_available: boolean | null;
          name: string;
          price: number;
          updated_at: string;
        };
        Insert: {
          category_id?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          is_available?: boolean | null;
          name: string;
          price: number;
          updated_at?: string;
        };
        Update: {
          category_id?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          is_available?: boolean | null;
          name?: string;
          price?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "menu_items_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      order_items: {
        Row: {
          created_at: string;
          id: string;
          menu_item_id: string | null;
          order_id: string | null;
          price: number | null;
          quantity: number | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          menu_item_id?: string | null;
          order_id?: string | null;
          price?: number | null;
          quantity?: number | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          menu_item_id?: string | null;
          order_id?: string | null;
          price?: number | null;
          quantity?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_menu_item_id_fkey";
            columns: ["menu_item_id"];
            isOneToOne: false;
            referencedRelation: "menu_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "order_info";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders_with_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      orders: {
        Row: {
          created_at: string | null;
          customer_id: string | null;
          delivery_address: Json | null;
          delivery_id: string | null;
          delivery_rating: number | null;
          id: string;
          status: string;
          total_price: number;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          customer_id?: string | null;
          delivery_address?: Json | null;
          delivery_id?: string | null;
          delivery_rating?: number | null;
          id?: string;
          status?: string;
          total_price: number;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          customer_id?: string | null;
          delivery_address?: Json | null;
          delivery_id?: string | null;
          delivery_rating?: number | null;
          id?: string;
          status?: string;
          total_price?: number;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          address: Json | null;
          availability_status: boolean | null;
          delivery_rating: number | null;
          email: string | null;
          full_name: string | null;
          id: string;
          number_ratings: number | null;
          phone_number: string | null;
          role: string | null;
          updated_at: string | null;
          vehicle_type: string | null;
        };
        Insert: {
          address?: Json | null;
          availability_status?: boolean | null;
          delivery_rating?: number | null;
          email?: string | null;
          full_name?: string | null;
          id: string;
          number_ratings?: number | null;
          phone_number?: string | null;
          role?: string | null;
          updated_at?: string | null;
          vehicle_type?: string | null;
        };
        Update: {
          address?: Json | null;
          availability_status?: boolean | null;
          delivery_rating?: number | null;
          email?: string | null;
          full_name?: string | null;
          id?: string;
          number_ratings?: number | null;
          phone_number?: string | null;
          role?: string | null;
          updated_at?: string | null;
          vehicle_type?: string | null;
        };
        Relationships: [];
      };
      reservations: {
        Row: {
          customer_id: string | null;
          id: string;
          party_size: number;
          reservation_time: string;
          status: string | null;
          table_number: number | null;
        };
        Insert: {
          customer_id?: string | null;
          id?: string;
          party_size: number;
          reservation_time: string;
          status?: string | null;
          table_number?: number | null;
        };
        Update: {
          customer_id?: string | null;
          id?: string;
          party_size?: number;
          reservation_time?: string;
          status?: string | null;
          table_number?: number | null;
        };
        Relationships: [];
      };
    };
    Views: {
      order_info: {
        Row: {
          created_at: string | null;
          customer: Json | null;
          delivery_address: Json | null;
          id: string | null;
          items: Json | null;
          status: string | null;
          total_price: number | null;
        };
        Relationships: [];
      };
      orders_with_profiles: {
        Row: {
          created_at: string | null;
          customer_id: string | null;
          customer_name: string | null;
          deliver_name: string | null;
          delivery_address: Json | null;
          delivery_id: string | null;
          id: string | null;
          status: string | null;
          total_price: number | null;
          updated_at: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      add_delivery_rating: {
        Args: { delivery_id: string; new_rating: number };
        Returns: undefined;
      };
      health: { Args: never; Returns: Json };
    };
    Enums: {
      delivery_status: "pending" | "approved" | "rejected";
      order_status_type: "pending" | "preparing" | "on_the_way" | "ready";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      delivery_status: ["pending", "approved", "rejected"],
      order_status_type: ["pending", "preparing", "on_the_way", "ready"],
    },
  },
} as const;
