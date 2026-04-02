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
      activity_logs: {
        Row: {
          action_details: Json | null
          action_type: string
          created_at: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          action_details?: Json | null
          action_type: string
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          action_details?: Json | null
          action_type?: string
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      admin_notifications: {
        Row: {
          action_label: string | null
          action_url: string | null
          body: string
          created_at: string | null
          created_by: string
          failed_count: number | null
          icon: string | null
          id: string
          recipients_count: number | null
          successful_count: number | null
          title: string
        }
        Insert: {
          action_label?: string | null
          action_url?: string | null
          body: string
          created_at?: string | null
          created_by: string
          failed_count?: number | null
          icon?: string | null
          id?: string
          recipients_count?: number | null
          successful_count?: number | null
          title: string
        }
        Update: {
          action_label?: string | null
          action_url?: string | null
          body?: string
          created_at?: string | null
          created_by?: string
          failed_count?: number | null
          icon?: string | null
          id?: string
          recipients_count?: number | null
          successful_count?: number | null
          title?: string
        }
        Relationships: []
      }
      baby_birthday_notifications: {
        Row: {
          baby_age_months: number
          id: string
          insight_text: string | null
          seen: boolean | null
          sent_at: string | null
          user_id: string
        }
        Insert: {
          baby_age_months: number
          id?: string
          insight_text?: string | null
          seen?: boolean | null
          sent_at?: string | null
          user_id: string
        }
        Update: {
          baby_age_months?: number
          id?: string
          insight_text?: string | null
          seen?: boolean | null
          sent_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
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
      baby_meal_times: {
        Row: {
          created_at: string | null
          enabled: boolean | null
          id: string
          meal_type: string
          preferred_hour: number
          preferred_minute: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          meal_type: string
          preferred_hour: number
          preferred_minute?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          meal_type?: string
          preferred_hour?: number
          preferred_minute?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          conversation_id?: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      completed_challenges_history: {
        Row: {
          challenge_id: string
          challenge_title: string
          completed_at: string
          id: string
          reward_points: number | null
          user_id: string
        }
        Insert: {
          challenge_id: string
          challenge_title: string
          completed_at?: string
          id?: string
          reward_points?: number | null
          user_id: string
        }
        Update: {
          challenge_id?: string
          challenge_title?: string
          completed_at?: string
          id?: string
          reward_points?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "completed_challenges_history_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "weekly_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_checkins: {
        Row: {
          checkin_date: string
          created_at: string
          id: string
          notes: string | null
          status: string
          user_id: string
        }
        Insert: {
          checkin_date?: string
          created_at?: string
          id?: string
          notes?: string | null
          status: string
          user_id: string
        }
        Update: {
          checkin_date?: string
          created_at?: string
          id?: string
          notes?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_content: {
        Row: {
          age_range: string | null
          content_text: string
          content_type: string
          created_at: string
          day_of_week: number | null
          icon: string | null
          id: string
          is_active: boolean | null
          title: string
        }
        Insert: {
          age_range?: string | null
          content_text: string
          content_type: string
          created_at?: string
          day_of_week?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          title: string
        }
        Update: {
          age_range?: string | null
          content_text?: string
          content_type?: string
          created_at?: string
          day_of_week?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          title?: string
        }
        Relationships: []
      }
      daily_polls: {
        Row: {
          answer: string | null
          answered_at: string | null
          created_at: string | null
          id: string
          poll_date: string | null
          question: string
          user_id: string
        }
        Insert: {
          answer?: string | null
          answered_at?: string | null
          created_at?: string | null
          id?: string
          poll_date?: string | null
          question: string
          user_id: string
        }
        Update: {
          answer?: string | null
          answered_at?: string | null
          created_at?: string | null
          id?: string
          poll_date?: string | null
          question?: string
          user_id?: string
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
      daily_tips: {
        Row: {
          age_range: string | null
          category: string
          created_at: string
          display_date: string | null
          id: string
          tip_text: string
        }
        Insert: {
          age_range?: string | null
          category?: string
          created_at?: string
          display_date?: string | null
          id?: string
          tip_text: string
        }
        Update: {
          age_range?: string | null
          category?: string
          created_at?: string
          display_date?: string | null
          id?: string
          tip_text?: string
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
      food_analyses: {
        Row: {
          allergens: string[] | null
          baby_age_months: number
          choking_risk: string | null
          confidence_score: number | null
          created_at: string
          estimated_calories: number | null
          estimated_carbs_g: number | null
          estimated_fats_g: number | null
          estimated_protein_g: number | null
          id: string
          identified_food: string
          image_url: string | null
          is_recommended: boolean
          minerals: string[] | null
          preparation_tips: string | null
          recommendation_reason: string | null
          suggested_recipes: string[] | null
          user_id: string
          vitamins: string[] | null
        }
        Insert: {
          allergens?: string[] | null
          baby_age_months: number
          choking_risk?: string | null
          confidence_score?: number | null
          created_at?: string
          estimated_calories?: number | null
          estimated_carbs_g?: number | null
          estimated_fats_g?: number | null
          estimated_protein_g?: number | null
          id?: string
          identified_food: string
          image_url?: string | null
          is_recommended?: boolean
          minerals?: string[] | null
          preparation_tips?: string | null
          recommendation_reason?: string | null
          suggested_recipes?: string[] | null
          user_id: string
          vitamins?: string[] | null
        }
        Update: {
          allergens?: string[] | null
          baby_age_months?: number
          choking_risk?: string | null
          confidence_score?: number | null
          created_at?: string
          estimated_calories?: number | null
          estimated_carbs_g?: number | null
          estimated_fats_g?: number | null
          estimated_protein_g?: number | null
          id?: string
          identified_food?: string
          image_url?: string | null
          is_recommended?: boolean
          minerals?: string[] | null
          preparation_tips?: string | null
          recommendation_reason?: string | null
          suggested_recipes?: string[] | null
          user_id?: string
          vitamins?: string[] | null
        }
        Relationships: []
      }
      food_diary: {
        Row: {
          created_at: string
          food_name: string
          id: string
          notes: string | null
          reaction: string
          recipe_id: string | null
          tried_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          food_name: string
          id?: string
          notes?: string | null
          reaction: string
          recipe_id?: string | null
          tried_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          food_name?: string
          id?: string
          notes?: string | null
          reaction?: string
          recipe_id?: string | null
          tried_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      food_firsts: {
        Row: {
          category: string
          celebrated: boolean | null
          created_at: string | null
          first_tried_at: string | null
          food_name: string
          id: string
          photo_url: string | null
          reaction: string | null
          user_id: string
        }
        Insert: {
          category: string
          celebrated?: boolean | null
          created_at?: string | null
          first_tried_at?: string | null
          food_name: string
          id?: string
          photo_url?: string | null
          reaction?: string | null
          user_id: string
        }
        Update: {
          category?: string
          celebrated?: boolean | null
          created_at?: string | null
          first_tried_at?: string | null
          food_name?: string
          id?: string
          photo_url?: string | null
          reaction?: string | null
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
          plan_type: string
          prepared: boolean | null
          recipe_id: string
          user_id: string
          week_start_date: string | null
        }
        Insert: {
          created_at?: string | null
          day_of_week: string
          id?: string
          meal_type: string
          plan_type?: string
          prepared?: boolean | null
          recipe_id: string
          user_id: string
          week_start_date?: string | null
        }
        Update: {
          created_at?: string | null
          day_of_week?: string
          id?: string
          meal_type?: string
          plan_type?: string
          prepared?: boolean | null
          recipe_id?: string
          user_id?: string
          week_start_date?: string | null
        }
        Relationships: []
      }
      milestone_alerts_viewed: {
        Row: {
          id: string
          milestone_month: number
          user_id: string
          viewed_at: string
        }
        Insert: {
          id?: string
          milestone_month: number
          user_id: string
          viewed_at?: string
        }
        Update: {
          id?: string
          milestone_month?: number
          user_id?: string
          viewed_at?: string
        }
        Relationships: []
      }
      notification_logs: {
        Row: {
          id: string
          meal_type: string
          sent_at: string | null
          sent_date: string | null
          user_id: string
        }
        Insert: {
          id?: string
          meal_type: string
          sent_at?: string | null
          sent_date?: string | null
          user_id: string
        }
        Update: {
          id?: string
          meal_type?: string
          sent_at?: string | null
          sent_date?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          achievement_celebration_enabled: boolean | null
          challenge_alerts_enabled: boolean | null
          checkin_reminder_enabled: boolean | null
          created_at: string
          enabled: boolean
          hour: number
          id: string
          meal_type: string
          minute: number
          streak_risk_alerts_enabled: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          achievement_celebration_enabled?: boolean | null
          challenge_alerts_enabled?: boolean | null
          checkin_reminder_enabled?: boolean | null
          created_at?: string
          enabled?: boolean
          hour: number
          id?: string
          meal_type: string
          minute: number
          streak_risk_alerts_enabled?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          achievement_celebration_enabled?: boolean | null
          challenge_alerts_enabled?: boolean | null
          checkin_reminder_enabled?: boolean | null
          created_at?: string
          enabled?: boolean
          hour?: number
          id?: string
          meal_type?: string
          minute?: number
          streak_risk_alerts_enabled?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      onboarding_progress: {
        Row: {
          completed_steps: string[] | null
          created_at: string | null
          day_of_journey: number | null
          first_checkin_done: boolean | null
          first_recipe_prepared: boolean | null
          id: string
          meal_times_configured: boolean | null
          seven_day_challenge_completed: boolean | null
          seven_day_challenge_started: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_steps?: string[] | null
          created_at?: string | null
          day_of_journey?: number | null
          first_checkin_done?: boolean | null
          first_recipe_prepared?: boolean | null
          id?: string
          meal_times_configured?: boolean | null
          seven_day_challenge_completed?: boolean | null
          seven_day_challenge_started?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_steps?: string[] | null
          created_at?: string | null
          day_of_journey?: number | null
          first_checkin_done?: boolean | null
          first_recipe_prepared?: boolean | null
          id?: string
          meal_times_configured?: boolean | null
          seven_day_challenge_completed?: boolean | null
          seven_day_challenge_started?: boolean | null
          updated_at?: string | null
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
          baby_birth_date: string | null
          baby_name: string | null
          banned_at: string | null
          banned_reason: string | null
          bio: string | null
          created_at: string | null
          dietary_preferences: string[] | null
          full_name: string
          id: string
          is_banned: boolean | null
          is_verified_pediatrician: boolean | null
          mother_name: string | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          baby_birth_date?: string | null
          baby_name?: string | null
          banned_at?: string | null
          banned_reason?: string | null
          bio?: string | null
          created_at?: string | null
          dietary_preferences?: string[] | null
          full_name: string
          id: string
          is_banned?: boolean | null
          is_verified_pediatrician?: boolean | null
          mother_name?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          baby_birth_date?: string | null
          baby_name?: string | null
          banned_at?: string | null
          banned_reason?: string | null
          bio?: string | null
          created_at?: string | null
          dietary_preferences?: string[] | null
          full_name?: string
          id?: string
          is_banned?: boolean | null
          is_verified_pediatrician?: boolean | null
          mother_name?: string | null
          timezone?: string | null
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
      recipe_image_overrides: {
        Row: {
          created_at: string
          image_url: string
          recipe_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          image_url: string
          recipe_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          image_url?: string
          recipe_id?: string
          updated_at?: string
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
      referrals: {
        Row: {
          code: string
          created_at: string | null
          id: string
          referred_user_id: string | null
          referrer_id: string
          reward_claimed: boolean | null
          reward_points: number | null
          status: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          id?: string
          referred_user_id?: string | null
          referrer_id: string
          reward_claimed?: boolean | null
          reward_points?: number | null
          status?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          id?: string
          referred_user_id?: string | null
          referrer_id?: string
          reward_claimed?: boolean | null
          reward_points?: number | null
          status?: string | null
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
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_challenge_progress: {
        Row: {
          challenge_id: string
          completed: boolean
          completed_at: string | null
          created_at: string
          current_count: number
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          challenge_id: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          current_count?: number
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          challenge_id?: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          current_count?: number
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_challenge_progress_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "weekly_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          created_at: string | null
          has_completed_tour: boolean | null
          has_seen_welcome: boolean | null
          id: string
          language: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          has_completed_tour?: boolean | null
          has_seen_welcome?: boolean | null
          id?: string
          language?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          has_completed_tour?: boolean | null
          has_seen_welcome?: boolean | null
          id?: string
          language?: string
          updated_at?: string | null
          user_id?: string
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
      user_sessions: {
        Row: {
          created_at: string | null
          device_info: string | null
          id: string
          last_active: string | null
          last_login: string | null
          total_sessions: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          device_info?: string | null
          id?: string
          last_active?: string | null
          last_login?: string | null
          total_sessions?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          device_info?: string | null
          id?: string
          last_active?: string | null
          last_login?: string | null
          total_sessions?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_streaks: {
        Row: {
          created_at: string
          current_streak: number
          grace_period_days_missed: number | null
          grace_period_eligible: boolean | null
          id: string
          last_activity_date: string | null
          last_freeze_reset_at: string | null
          longest_streak: number
          streak_freezes_available: number | null
          total_points: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_streak?: number
          grace_period_days_missed?: number | null
          grace_period_eligible?: boolean | null
          id?: string
          last_activity_date?: string | null
          last_freeze_reset_at?: string | null
          longest_streak?: number
          streak_freezes_available?: number | null
          total_points?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_streak?: number
          grace_period_days_missed?: number | null
          grace_period_eligible?: boolean | null
          id?: string
          last_activity_date?: string | null
          last_freeze_reset_at?: string | null
          longest_streak?: number
          streak_freezes_available?: number | null
          total_points?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      weekly_challenges: {
        Row: {
          challenge_type: string
          created_at: string
          description: string
          ends_at: string
          goal_count: number
          id: string
          is_active: boolean
          reward_points: number
          starts_at: string
          title: string
        }
        Insert: {
          challenge_type: string
          created_at?: string
          description: string
          ends_at: string
          goal_count?: number
          id?: string
          is_active?: boolean
          reward_points?: number
          starts_at?: string
          title: string
        }
        Update: {
          challenge_type?: string
          created_at?: string
          description?: string
          ends_at?: string
          goal_count?: number
          id?: string
          is_active?: boolean
          reward_points?: number
          starts_at?: string
          title?: string
        }
        Relationships: []
      }
      winback_campaigns: {
        Row: {
          campaign_type: string
          converted_at: string | null
          created_at: string | null
          id: string
          message_sent: string | null
          opened_at: string | null
          sent_at: string | null
          user_id: string
        }
        Insert: {
          campaign_type: string
          converted_at?: string | null
          created_at?: string | null
          id?: string
          message_sent?: string | null
          opened_at?: string | null
          sent_at?: string | null
          user_id: string
        }
        Update: {
          campaign_type?: string
          converted_at?: string | null
          created_at?: string | null
          id?: string
          message_sent?: string | null
          opened_at?: string | null
          sent_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      public_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          full_name: string | null
          id: string | null
          is_verified_pediatrician: boolean | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          full_name?: string | null
          id?: string | null
          is_verified_pediatrician?: boolean | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          full_name?: string | null
          id?: string | null
          is_verified_pediatrician?: boolean | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_challenge_progress: {
        Args: { p_challenge_id: string; p_user_id: string }
        Returns: undefined
      }
      is_user_banned: { Args: { check_user_id: string }; Returns: boolean }
      update_user_streak: {
        Args: { p_last_activity_date: string; p_user_id: string }
        Returns: undefined
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
