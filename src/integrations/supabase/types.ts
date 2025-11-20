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
      baby_growth: {
        Row: {
          baby_name: string
          created_at: string | null
          height_cm: number | null
          id: string
          milestone: string | null
          notes: string | null
          recorded_at: string
          user_id: string
          weight_kg: number | null
        }
        Insert: {
          baby_name: string
          created_at?: string | null
          height_cm?: number | null
          id?: string
          milestone?: string | null
          notes?: string | null
          recorded_at: string
          user_id: string
          weight_kg?: number | null
        }
        Update: {
          baby_name?: string
          created_at?: string | null
          height_cm?: number | null
          id?: string
          milestone?: string | null
          notes?: string | null
          recorded_at?: string
          user_id?: string
          weight_kg?: number | null
        }
        Relationships: []
      }
      daily_tasks: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          id: string
          task_date: string | null
          task_type: string
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          task_date?: string | null
          task_type: string
          user_id: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          task_date?: string | null
          task_type?: string
          user_id?: string
        }
        Relationships: []
      }
      favorite_recipes: {
        Row: {
          created_at: string | null
          id: string
          recipe_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          recipe_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          recipe_id?: string
          user_id?: string
        }
        Relationships: []
      }
      forum_posts: {
        Row: {
          comments_count: number | null
          content: string
          created_at: string | null
          id: string
          image_urls: string[] | null
          likes_count: number | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          comments_count?: number | null
          content: string
          created_at?: string | null
          id?: string
          image_urls?: string[] | null
          likes_count?: number | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          comments_count?: number | null
          content?: string
          created_at?: string | null
          id?: string
          image_urls?: string[] | null
          likes_count?: number | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      meal_logs: {
        Row: {
          baby_name: string
          calories: number | null
          carbs_g: number | null
          created_at: string | null
          eaten_at: string
          fats_g: number | null
          id: string
          ingredients: string[] | null
          meal_type: string
          notes: string | null
          protein_g: number | null
          recipe_title: string | null
          user_id: string
        }
        Insert: {
          baby_name: string
          calories?: number | null
          carbs_g?: number | null
          created_at?: string | null
          eaten_at: string
          fats_g?: number | null
          id?: string
          ingredients?: string[] | null
          meal_type: string
          notes?: string | null
          protein_g?: number | null
          recipe_title?: string | null
          user_id: string
        }
        Update: {
          baby_name?: string
          calories?: number | null
          carbs_g?: number | null
          created_at?: string | null
          eaten_at?: string
          fats_g?: number | null
          id?: string
          ingredients?: string[] | null
          meal_type?: string
          notes?: string | null
          protein_g?: number | null
          recipe_title?: string | null
          user_id?: string
        }
        Relationships: []
      }
      meal_plans: {
        Row: {
          created_at: string | null
          day_of_week: string
          id: string
          meal_type: string
          prepared: boolean | null
          recipe_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          day_of_week: string
          id?: string
          meal_type: string
          prepared?: boolean | null
          recipe_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          day_of_week?: string
          id?: string
          meal_type?: string
          prepared?: boolean | null
          recipe_id?: string
          user_id?: string
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          baby_name: string | null
          bio: string | null
          created_at: string | null
          dietary_preferences: string[] | null
          full_name: string
          id: string
          is_verified_pediatrician: boolean | null
          mother_name: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          baby_name?: string | null
          bio?: string | null
          created_at?: string | null
          dietary_preferences?: string[] | null
          full_name: string
          id: string
          is_verified_pediatrician?: boolean | null
          mother_name?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          baby_name?: string | null
          bio?: string | null
          created_at?: string | null
          dietary_preferences?: string[] | null
          full_name?: string
          id?: string
          is_verified_pediatrician?: boolean | null
          mother_name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          created_at: string
          endpoint: string
          id: string
          keys: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: string
          keys: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: string
          keys?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      recipe_views: {
        Row: {
          id: string
          recipe_id: string
          user_id: string
          viewed_at: string | null
        }
        Insert: {
          id?: string
          recipe_id: string
          user_id: string
          viewed_at?: string | null
        }
        Update: {
          id?: string
          recipe_id?: string
          user_id?: string
          viewed_at?: string | null
        }
        Relationships: []
      }
      saved_posts: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_posts_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      scanned_products: {
        Row: {
          allergens: string[] | null
          barcode: string
          barcode_type: string | null
          brands: string | null
          id: string
          image_url: string | null
          is_baby_safe: boolean | null
          nutrition_grade: string | null
          product_name: string | null
          safety_notes: string | null
          scanned_at: string | null
          suggested_recipes: string[] | null
          user_id: string
          verification_source: string | null
          verified: boolean | null
        }
        Insert: {
          allergens?: string[] | null
          barcode: string
          barcode_type?: string | null
          brands?: string | null
          id?: string
          image_url?: string | null
          is_baby_safe?: boolean | null
          nutrition_grade?: string | null
          product_name?: string | null
          safety_notes?: string | null
          scanned_at?: string | null
          suggested_recipes?: string[] | null
          user_id: string
          verification_source?: string | null
          verified?: boolean | null
        }
        Update: {
          allergens?: string[] | null
          barcode?: string
          barcode_type?: string | null
          brands?: string | null
          id?: string
          image_url?: string | null
          is_baby_safe?: boolean | null
          nutrition_grade?: string | null
          product_name?: string | null
          safety_notes?: string | null
          scanned_at?: string | null
          suggested_recipes?: string[] | null
          user_id?: string
          verification_source?: string | null
          verified?: boolean | null
        }
        Relationships: []
      }
      shopping_list_items: {
        Row: {
          category: string
          checked: boolean | null
          created_at: string | null
          from_recipe: string | null
          id: string
          ingredient: string
          user_id: string
        }
        Insert: {
          category: string
          checked?: boolean | null
          created_at?: string | null
          from_recipe?: string | null
          id?: string
          ingredient: string
          user_id: string
        }
        Update: {
          category?: string
          checked?: boolean | null
          created_at?: string | null
          from_recipe?: string | null
          id?: string
          ingredient?: string
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string | null
          has_seen_welcome: boolean | null
          id: string
          language: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          has_seen_welcome?: boolean | null
          id?: string
          language?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          has_seen_welcome?: boolean | null
          id?: string
          language?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
