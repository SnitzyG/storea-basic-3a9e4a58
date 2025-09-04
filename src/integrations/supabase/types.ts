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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          action: string
          created_at: string
          description: string
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json | null
          project_id: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          description: string
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json | null
          project_id?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          description?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json | null
          project_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      companies: {
        Row: {
          address: string | null
          created_at: string
          id: string
          name: string
          settings: Json | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          name: string
          settings?: Json | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          name?: string
          settings?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      document_approvals: {
        Row: {
          approved_date: string | null
          approver_id: string
          comments: string | null
          created_at: string
          document_id: string
          id: string
          status: string
        }
        Insert: {
          approved_date?: string | null
          approver_id: string
          comments?: string | null
          created_at?: string
          document_id: string
          id?: string
          status?: string
        }
        Update: {
          approved_date?: string | null
          approver_id?: string
          comments?: string | null
          created_at?: string
          document_id?: string
          id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_approvals_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_versions: {
        Row: {
          changes_summary: string | null
          created_at: string
          document_id: string
          file_path: string
          id: string
          uploaded_by: string
          version_number: number
        }
        Insert: {
          changes_summary?: string | null
          created_at?: string
          document_id: string
          file_path: string
          id?: string
          uploaded_by: string
          version_number: number
        }
        Update: {
          changes_summary?: string | null
          created_at?: string
          document_id?: string
          file_path?: string
          id?: string
          uploaded_by?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "document_versions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          category: string | null
          created_at: string
          file_extension: string | null
          file_path: string
          file_size: number | null
          file_type: string
          id: string
          name: string
          project_id: string
          status: Database["public"]["Enums"]["document_status"]
          tags: string[] | null
          updated_at: string
          uploaded_by: string
          version: number | null
          visibility_scope: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          file_extension?: string | null
          file_path: string
          file_size?: number | null
          file_type: string
          id?: string
          name: string
          project_id: string
          status?: Database["public"]["Enums"]["document_status"]
          tags?: string[] | null
          updated_at?: string
          uploaded_by: string
          version?: number | null
          visibility_scope?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          file_extension?: string | null
          file_path?: string
          file_size?: number | null
          file_type?: string
          id?: string
          name?: string
          project_id?: string
          status?: Database["public"]["Enums"]["document_status"]
          tags?: string[] | null
          updated_at?: string
          uploaded_by?: string
          version?: number | null
          visibility_scope?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      message_participants: {
        Row: {
          created_at: string
          id: string
          message_id: string
          read_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message_id: string
          read_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message_id?: string
          read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_participants_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      message_threads: {
        Row: {
          created_at: string
          created_by: string
          id: string
          participants: string[] | null
          project_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          participants?: string[] | null
          project_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          participants?: string[] | null
          project_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_threads_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachments: Json | null
          content: string
          created_at: string
          id: string
          message_type: string | null
          project_id: string
          sender_id: string
          thread_id: string | null
          updated_at: string
        }
        Insert: {
          attachments?: Json | null
          content: string
          created_at?: string
          id?: string
          message_type?: string | null
          project_id: string
          sender_id: string
          thread_id?: string | null
          updated_at?: string
        }
        Update: {
          attachments?: Json | null
          content?: string
          created_at?: string
          id?: string
          message_type?: string | null
          project_id?: string
          sender_id?: string
          thread_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "message_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          message: string
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          message: string
          read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          message?: string
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company_id: string | null
          created_at: string
          id: string
          name: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string
          id?: string
          name: string
          phone?: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string
          id?: string
          name?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      project_users: {
        Row: {
          created_at: string
          id: string
          invited_by: string
          joined_at: string | null
          permissions: Json | null
          project_id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_by: string
          joined_at?: string | null
          permissions?: Json | null
          project_id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_by?: string
          joined_at?: string | null
          permissions?: Json | null
          project_id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_users_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          address: string | null
          budget: number | null
          company_id: string | null
          created_at: string
          created_by: string
          description: string | null
          estimated_finish_date: string | null
          estimated_start_date: string | null
          homeowner_email: string | null
          homeowner_name: string | null
          homeowner_phone: string | null
          id: string
          name: string
          status: Database["public"]["Enums"]["project_status"]
          timeline: Json | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          budget?: number | null
          company_id?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          estimated_finish_date?: string | null
          estimated_start_date?: string | null
          homeowner_email?: string | null
          homeowner_name?: string | null
          homeowner_phone?: string | null
          id?: string
          name: string
          status?: Database["public"]["Enums"]["project_status"]
          timeline?: Json | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          budget?: number | null
          company_id?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          estimated_finish_date?: string | null
          estimated_start_date?: string | null
          homeowner_email?: string | null
          homeowner_name?: string | null
          homeowner_phone?: string | null
          id?: string
          name?: string
          status?: Database["public"]["Enums"]["project_status"]
          timeline?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      rfi_activities: {
        Row: {
          action: string
          created_at: string
          details: string | null
          id: string
          rfi_id: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: string | null
          id?: string
          rfi_id: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: string | null
          id?: string
          rfi_id?: string
          user_id?: string
        }
        Relationships: []
      }
      rfis: {
        Row: {
          assigned_to: string | null
          category: string | null
          created_at: string
          due_date: string | null
          id: string
          priority: Database["public"]["Enums"]["priority_level"]
          project_id: string
          question: string
          raised_by: string
          response: string | null
          status: Database["public"]["Enums"]["rfi_status"]
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          category?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["priority_level"]
          project_id: string
          question: string
          raised_by: string
          response?: string | null
          status?: Database["public"]["Enums"]["rfi_status"]
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          category?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["priority_level"]
          project_id?: string
          question?: string
          raised_by?: string
          response?: string | null
          status?: Database["public"]["Enums"]["rfi_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rfis_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      tender_bids: {
        Row: {
          attachments: Json | null
          bid_amount: number
          bidder_id: string
          created_at: string
          id: string
          proposal_text: string | null
          status: string | null
          submitted_at: string
          tender_id: string
          updated_at: string
        }
        Insert: {
          attachments?: Json | null
          bid_amount: number
          bidder_id: string
          created_at?: string
          id?: string
          proposal_text?: string | null
          status?: string | null
          submitted_at?: string
          tender_id: string
          updated_at?: string
        }
        Update: {
          attachments?: Json | null
          bid_amount?: number
          bidder_id?: string
          created_at?: string
          id?: string
          proposal_text?: string | null
          status?: string | null
          submitted_at?: string
          tender_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      tender_invitations: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          invited_by: string
          invited_email: string
          personal_message: string | null
          status: string
          tender_id: string
          token: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          invited_by: string
          invited_email: string
          personal_message?: string | null
          status?: string
          tender_id: string
          token: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          invited_by?: string
          invited_email?: string
          personal_message?: string | null
          status?: string
          tender_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "tender_invitations_tender_id_fkey"
            columns: ["tender_id"]
            isOneToOne: false
            referencedRelation: "tenders"
            referencedColumns: ["id"]
          },
        ]
      }
      tender_participants: {
        Row: {
          bid_amount: number | null
          bid_submitted_date: string | null
          created_at: string
          id: string
          proposal_docs: Json | null
          status: string | null
          tender_id: string
          user_id: string
        }
        Insert: {
          bid_amount?: number | null
          bid_submitted_date?: string | null
          created_at?: string
          id?: string
          proposal_docs?: Json | null
          status?: string | null
          tender_id: string
          user_id: string
        }
        Update: {
          bid_amount?: number | null
          bid_submitted_date?: string | null
          created_at?: string
          id?: string
          proposal_docs?: Json | null
          status?: string | null
          tender_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tender_participants_tender_id_fkey"
            columns: ["tender_id"]
            isOneToOne: false
            referencedRelation: "tenders"
            referencedColumns: ["id"]
          },
        ]
      }
      tenders: {
        Row: {
          awarded_to: string | null
          begin_date: string | null
          budget: number | null
          created_at: string
          deadline: string | null
          description: string | null
          documents: Json | null
          id: string
          issued_by: string
          project_id: string
          requirements: Json | null
          status: Database["public"]["Enums"]["tender_status"]
          title: string
          updated_at: string
        }
        Insert: {
          awarded_to?: string | null
          begin_date?: string | null
          budget?: number | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          documents?: Json | null
          id?: string
          issued_by: string
          project_id: string
          requirements?: Json | null
          status?: Database["public"]["Enums"]["tender_status"]
          title: string
          updated_at?: string
        }
        Update: {
          awarded_to?: string | null
          begin_date?: string | null
          budget?: number | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          documents?: Json | null
          id?: string
          issued_by?: string
          project_id?: string
          requirements?: Json | null
          status?: Database["public"]["Enums"]["tender_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      todos: {
        Row: {
          completed: boolean
          content: string
          created_at: string
          due_date: string | null
          id: string
          priority: string | null
          project_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          content: string
          created_at?: string
          due_date?: string | null
          id?: string
          priority?: string | null
          project_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          content?: string
          created_at?: string
          due_date?: string | null
          id?: string
          priority?: string | null
          project_id?: string | null
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
      is_project_creator: {
        Args: { project_id: string; user_id: string }
        Returns: boolean
      }
      is_project_member: {
        Args: { project_id: string; user_id: string }
        Returns: boolean
      }
      link_pending_users_to_projects: {
        Args: { target_user_id: string; user_email: string }
        Returns: undefined
      }
    }
    Enums: {
      document_status: "draft" | "under_review" | "approved" | "rejected"
      priority_level: "low" | "medium" | "high" | "critical"
      project_status:
        | "planning"
        | "active"
        | "on_hold"
        | "completed"
        | "cancelled"
      rfi_status: "submitted" | "in_review" | "responded" | "closed"
      tender_status: "draft" | "open" | "closed" | "awarded" | "cancelled"
      user_role: "architect" | "builder" | "homeowner" | "contractor"
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
      document_status: ["draft", "under_review", "approved", "rejected"],
      priority_level: ["low", "medium", "high", "critical"],
      project_status: [
        "planning",
        "active",
        "on_hold",
        "completed",
        "cancelled",
      ],
      rfi_status: ["submitted", "in_review", "responded", "closed"],
      tender_status: ["draft", "open", "closed", "awarded", "cancelled"],
      user_role: ["architect", "builder", "homeowner", "contractor"],
    },
  },
} as const
