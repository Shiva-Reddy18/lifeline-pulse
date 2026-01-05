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
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          actor_role: Database["public"]["Enums"]["app_role"] | null
          created_at: string | null
          details: Json | null
          entity_id: string
          entity_type: string
          id: string
          ip_address: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_role?: Database["public"]["Enums"]["app_role"] | null
          created_at?: string | null
          details?: Json | null
          entity_id: string
          entity_type: string
          id?: string
          ip_address?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_role?: Database["public"]["Enums"]["app_role"] | null
          created_at?: string | null
          details?: Json | null
          entity_id?: string
          entity_type?: string
          id?: string
          ip_address?: string | null
        }
        Relationships: []
      }
      blood_banks: {
        Row: {
          address: string
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          is_verified: boolean | null
          license_number: string | null
          location_lat: number
          location_lng: number
          name: string
          operating_hours: string | null
          phone: string
          stock: Json | null
          updated_at: string | null
        }
        Insert: {
          address: string
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          license_number?: string | null
          location_lat: number
          location_lng: number
          name: string
          operating_hours?: string | null
          phone: string
          stock?: Json | null
          updated_at?: string | null
        }
        Update: {
          address?: string
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          license_number?: string | null
          location_lat?: number
          location_lng?: number
          name?: string
          operating_hours?: string | null
          phone?: string
          stock?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_emergency_detected: boolean | null
          language: string | null
          role: string
          session_id: string
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_emergency_detected?: boolean | null
          language?: string | null
          role: string
          session_id: string
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_emergency_detected?: boolean | null
          language?: string | null
          role?: string
          session_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      donation_history: {
        Row: {
          blood_group: Database["public"]["Enums"]["blood_group"]
          created_at: string | null
          donation_date: string
          donor_id: string
          emergency_id: string | null
          hospital_id: string | null
          id: string
          units_donated: number | null
          verified_by: string | null
        }
        Insert: {
          blood_group: Database["public"]["Enums"]["blood_group"]
          created_at?: string | null
          donation_date?: string
          donor_id: string
          emergency_id?: string | null
          hospital_id?: string | null
          id?: string
          units_donated?: number | null
          verified_by?: string | null
        }
        Update: {
          blood_group?: Database["public"]["Enums"]["blood_group"]
          created_at?: string | null
          donation_date?: string
          donor_id?: string
          emergency_id?: string | null
          hospital_id?: string | null
          id?: string
          units_donated?: number | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "donation_history_donor_id_fkey"
            columns: ["donor_id"]
            isOneToOne: false
            referencedRelation: "donors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donation_history_emergency_id_fkey"
            columns: ["emergency_id"]
            isOneToOne: false
            referencedRelation: "emergencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donation_history_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      donors: {
        Row: {
          blacklist_reason: string | null
          blood_group: Database["public"]["Enums"]["blood_group"]
          created_at: string | null
          credibility_score: number | null
          id: string
          is_active: boolean | null
          is_blacklisted: boolean | null
          is_eligible: boolean | null
          is_verified: boolean | null
          last_donation_date: string | null
          location_lat: number | null
          location_lng: number | null
          total_donations: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          blacklist_reason?: string | null
          blood_group: Database["public"]["Enums"]["blood_group"]
          created_at?: string | null
          credibility_score?: number | null
          id?: string
          is_active?: boolean | null
          is_blacklisted?: boolean | null
          is_eligible?: boolean | null
          is_verified?: boolean | null
          last_donation_date?: string | null
          location_lat?: number | null
          location_lng?: number | null
          total_donations?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          blacklist_reason?: string | null
          blood_group?: Database["public"]["Enums"]["blood_group"]
          created_at?: string | null
          credibility_score?: number | null
          id?: string
          is_active?: boolean | null
          is_blacklisted?: boolean | null
          is_eligible?: boolean | null
          is_verified?: boolean | null
          last_donation_date?: string | null
          location_lat?: number | null
          location_lng?: number | null
          total_donations?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      emergencies: {
        Row: {
          accepted_by_hospital_at: string | null
          assigned_donor_id: string | null
          assigned_volunteer_id: string | null
          audit_log: Json | null
          auto_closed_at: string | null
          blood_group: Database["public"]["Enums"]["blood_group"]
          condition: Database["public"]["Enums"]["condition_type"]
          condition_details: string | null
          created_at: string | null
          criticality_score: number | null
          escalation_level: number | null
          estimated_arrival_minutes: number | null
          expires_at: string | null
          fulfilled_at: string | null
          hospital_id: string | null
          id: string
          location_address: string | null
          location_lat: number
          location_lng: number
          patient_id: string | null
          patient_name: string
          patient_phone: string | null
          status: Database["public"]["Enums"]["emergency_status"]
          units_required: number
          updated_at: string | null
          urgency_level: Database["public"]["Enums"]["urgency_level"]
          verification_otp: string | null
        }
        Insert: {
          accepted_by_hospital_at?: string | null
          assigned_donor_id?: string | null
          assigned_volunteer_id?: string | null
          audit_log?: Json | null
          auto_closed_at?: string | null
          blood_group: Database["public"]["Enums"]["blood_group"]
          condition?: Database["public"]["Enums"]["condition_type"]
          condition_details?: string | null
          created_at?: string | null
          criticality_score?: number | null
          escalation_level?: number | null
          estimated_arrival_minutes?: number | null
          expires_at?: string | null
          fulfilled_at?: string | null
          hospital_id?: string | null
          id?: string
          location_address?: string | null
          location_lat: number
          location_lng: number
          patient_id?: string | null
          patient_name: string
          patient_phone?: string | null
          status?: Database["public"]["Enums"]["emergency_status"]
          units_required?: number
          updated_at?: string | null
          urgency_level?: Database["public"]["Enums"]["urgency_level"]
          verification_otp?: string | null
        }
        Update: {
          accepted_by_hospital_at?: string | null
          assigned_donor_id?: string | null
          assigned_volunteer_id?: string | null
          audit_log?: Json | null
          auto_closed_at?: string | null
          blood_group?: Database["public"]["Enums"]["blood_group"]
          condition?: Database["public"]["Enums"]["condition_type"]
          condition_details?: string | null
          created_at?: string | null
          criticality_score?: number | null
          escalation_level?: number | null
          estimated_arrival_minutes?: number | null
          expires_at?: string | null
          fulfilled_at?: string | null
          hospital_id?: string | null
          id?: string
          location_address?: string | null
          location_lat?: number
          location_lng?: number
          patient_id?: string | null
          patient_name?: string
          patient_phone?: string | null
          status?: Database["public"]["Enums"]["emergency_status"]
          units_required?: number
          updated_at?: string | null
          urgency_level?: Database["public"]["Enums"]["urgency_level"]
          verification_otp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "emergencies_assigned_donor_id_fkey"
            columns: ["assigned_donor_id"]
            isOneToOne: false
            referencedRelation: "donors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emergencies_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      emergency_responses: {
        Row: {
          donor_id: string
          emergency_id: string
          id: string
          notes: string | null
          responded_at: string | null
          response_type: string
        }
        Insert: {
          donor_id: string
          emergency_id: string
          id?: string
          notes?: string | null
          responded_at?: string | null
          response_type: string
        }
        Update: {
          donor_id?: string
          emergency_id?: string
          id?: string
          notes?: string | null
          responded_at?: string | null
          response_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "emergency_responses_donor_id_fkey"
            columns: ["donor_id"]
            isOneToOne: false
            referencedRelation: "donors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emergency_responses_emergency_id_fkey"
            columns: ["emergency_id"]
            isOneToOne: false
            referencedRelation: "emergencies"
            referencedColumns: ["id"]
          },
        ]
      }
      hospital_staff: {
        Row: {
          created_at: string | null
          hospital_id: string
          id: string
          is_active: boolean | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          hospital_id: string
          id?: string
          is_active?: boolean | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          hospital_id?: string
          id?: string
          is_active?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hospital_staff_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      hospitals: {
        Row: {
          address: string
          blood_stock: Json | null
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          is_verified: boolean | null
          license_number: string | null
          location_lat: number
          location_lng: number
          name: string
          operating_hours: string | null
          phone: string
          updated_at: string | null
        }
        Insert: {
          address: string
          blood_stock?: Json | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          license_number?: string | null
          location_lat: number
          location_lng: number
          name: string
          operating_hours?: string | null
          phone: string
          updated_at?: string | null
        }
        Update: {
          address?: string
          blood_stock?: Json | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          license_number?: string | null
          location_lat?: number
          location_lng?: number
          name?: string
          operating_hours?: string | null
          phone?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      live_tracking: {
        Row: {
          emergency_id: string
          eta_minutes: number | null
          heading: number | null
          id: string
          is_active: boolean | null
          last_updated: string | null
          location_lat: number
          location_lng: number
          speed: number | null
          tracker_type: string
          tracker_user_id: string | null
        }
        Insert: {
          emergency_id: string
          eta_minutes?: number | null
          heading?: number | null
          id?: string
          is_active?: boolean | null
          last_updated?: string | null
          location_lat: number
          location_lng: number
          speed?: number | null
          tracker_type: string
          tracker_user_id?: string | null
        }
        Update: {
          emergency_id?: string
          eta_minutes?: number | null
          heading?: number | null
          id?: string
          is_active?: boolean | null
          last_updated?: string | null
          location_lat?: number
          location_lng?: number
          speed?: number | null
          tracker_type?: string
          tracker_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "live_tracking_emergency_id_fkey"
            columns: ["emergency_id"]
            isOneToOne: false
            referencedRelation: "emergencies"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string | null
          emergency_id: string | null
          id: string
          is_read: boolean | null
          message: string
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string | null
          emergency_id?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string | null
          emergency_id?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_emergency_id_fkey"
            columns: ["emergency_id"]
            isOneToOne: false
            referencedRelation: "emergencies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          blood_group: Database["public"]["Enums"]["blood_group"] | null
          created_at: string | null
          full_name: string
          id: string
          is_verified: boolean | null
          language_preference: string | null
          location_lat: number | null
          location_lng: number | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          blood_group?: Database["public"]["Enums"]["blood_group"] | null
          created_at?: string | null
          full_name: string
          id: string
          is_verified?: boolean | null
          language_preference?: string | null
          location_lat?: number | null
          location_lng?: number | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          blood_group?: Database["public"]["Enums"]["blood_group"] | null
          created_at?: string | null
          full_name?: string
          id?: string
          is_verified?: boolean | null
          language_preference?: string | null
          location_lat?: number | null
          location_lng?: number | null
          phone?: string | null
          updated_at?: string | null
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
      app_role:
        | "patient"
        | "attender"
        | "donor"
        | "hospital_staff"
        | "blood_bank"
        | "volunteer"
        | "transport"
        | "admin"
      blood_group: "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-"
      condition_type: "trauma" | "surgery" | "dengue" | "other"
      emergency_status:
        | "created"
        | "hospital_verified"
        | "accepted"
        | "in_transit"
        | "fulfilled"
        | "auto_closed"
        | "expired"
      urgency_level: "stable" | "warning" | "critical"
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
      app_role: [
        "patient",
        "attender",
        "donor",
        "hospital_staff",
        "blood_bank",
        "volunteer",
        "transport",
        "admin",
      ],
      blood_group: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
      condition_type: ["trauma", "surgery", "dengue", "other"],
      emergency_status: [
        "created",
        "hospital_verified",
        "accepted",
        "in_transit",
        "fulfilled",
        "auto_closed",
        "expired",
      ],
      urgency_level: ["stable", "warning", "critical"],
    },
  },
} as const
