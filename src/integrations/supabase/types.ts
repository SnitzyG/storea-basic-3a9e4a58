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
      budget_categories: {
        Row: {
          allocated_amount: number
          category_type: string
          created_at: string
          id: string
          name: string
          project_id: string
          spent_amount: number
          updated_at: string
        }
        Insert: {
          allocated_amount?: number
          category_type?: string
          created_at?: string
          id?: string
          name: string
          project_id: string
          spent_amount?: number
          updated_at?: string
        }
        Update: {
          allocated_amount?: number
          category_type?: string
          created_at?: string
          id?: string
          name?: string
          project_id?: string
          spent_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      calendar_events: {
        Row: {
          attendees: Json | null
          created_at: string
          created_by: string
          description: string | null
          end_datetime: string | null
          external_attendees: string[] | null
          id: string
          is_meeting: boolean | null
          priority: string | null
          project_id: string | null
          start_datetime: string
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          attendees?: Json | null
          created_at?: string
          created_by: string
          description?: string | null
          end_datetime?: string | null
          external_attendees?: string[] | null
          id?: string
          is_meeting?: boolean | null
          priority?: string | null
          project_id?: string | null
          start_datetime: string
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          attendees?: Json | null
          created_at?: string
          created_by?: string
          description?: string | null
          end_datetime?: string | null
          external_attendees?: string[] | null
          id?: string
          is_meeting?: boolean | null
          priority?: string | null
          project_id?: string | null
          start_datetime?: string
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      cashflow_items: {
        Row: {
          amount: number
          category: string | null
          created_at: string
          created_by: string
          description: string
          forecast_date: string
          id: string
          item_type: string
          linked_invoice_id: string | null
          linked_payment_id: string | null
          project_id: string
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string
          created_by: string
          description: string
          forecast_date: string
          id?: string
          item_type: string
          linked_invoice_id?: string | null
          linked_payment_id?: string | null
          project_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string
          created_by?: string
          description?: string
          forecast_date?: string
          id?: string
          item_type?: string
          linked_invoice_id?: string | null
          linked_payment_id?: string | null
          project_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      change_orders: {
        Row: {
          approval_date: string | null
          approved_by: string | null
          created_at: string
          description: string | null
          financial_impact: number
          id: string
          order_number: string
          project_id: string
          reason: string | null
          requested_by: string
          status: string
          timeline_impact_days: number | null
          title: string
          updated_at: string
        }
        Insert: {
          approval_date?: string | null
          approved_by?: string | null
          created_at?: string
          description?: string | null
          financial_impact?: number
          id?: string
          order_number: string
          project_id: string
          reason?: string | null
          requested_by: string
          status?: string
          timeline_impact_days?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          approval_date?: string | null
          approved_by?: string | null
          created_at?: string
          description?: string | null
          financial_impact?: number
          id?: string
          order_number?: string
          project_id?: string
          reason?: string | null
          requested_by?: string
          status?: string
          timeline_impact_days?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      client_contributions: {
        Row: {
          amount: number
          contribution_type: string
          created_at: string
          created_by: string
          description: string | null
          expected_date: string | null
          id: string
          payment_method: string | null
          project_id: string
          received_date: string | null
          reference_number: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          contribution_type?: string
          created_at?: string
          created_by: string
          description?: string | null
          expected_date?: string | null
          id?: string
          payment_method?: string | null
          project_id: string
          received_date?: string | null
          reference_number?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          contribution_type?: string
          created_at?: string
          created_by?: string
          description?: string | null
          expected_date?: string | null
          id?: string
          payment_method?: string | null
          project_id?: string
          received_date?: string | null
          reference_number?: string | null
          status?: string
          updated_at?: string
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
      document_events: {
        Row: {
          created_at: string | null
          document_id: string | null
          event_description: string
          event_type: string
          id: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          document_id?: string | null
          event_description: string
          event_type: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          document_id?: string | null
          event_description?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_events_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_groups: {
        Row: {
          category: string
          created_at: string
          created_by: string
          current_revision_id: string | null
          document_number: string | null
          id: string
          is_locked: boolean | null
          locked_at: string | null
          locked_by: string | null
          project_id: string
          status: string
          title: string
          updated_at: string
          visibility_scope: string
        }
        Insert: {
          category?: string
          created_at?: string
          created_by: string
          current_revision_id?: string | null
          document_number?: string | null
          id?: string
          is_locked?: boolean | null
          locked_at?: string | null
          locked_by?: string | null
          project_id: string
          status?: string
          title: string
          updated_at?: string
          visibility_scope?: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string
          current_revision_id?: string | null
          document_number?: string | null
          id?: string
          is_locked?: boolean | null
          locked_at?: string | null
          locked_by?: string | null
          project_id?: string
          status?: string
          title?: string
          updated_at?: string
          visibility_scope?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_current_revision"
            columns: ["current_revision_id"]
            isOneToOne: false
            referencedRelation: "document_revisions"
            referencedColumns: ["id"]
          },
        ]
      }
      document_revisions: {
        Row: {
          changes_summary: string | null
          created_at: string
          document_group_id: string
          file_extension: string | null
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string
          id: string
          is_archived: boolean
          is_current: boolean
          revision_number: number
          uploaded_by: string
        }
        Insert: {
          changes_summary?: string | null
          created_at?: string
          document_group_id: string
          file_extension?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          file_type: string
          id?: string
          is_archived?: boolean
          is_current?: boolean
          revision_number: number
          uploaded_by: string
        }
        Update: {
          changes_summary?: string | null
          created_at?: string
          document_group_id?: string
          file_extension?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string
          id?: string
          is_archived?: boolean
          is_current?: boolean
          revision_number?: number
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_revisions_document_group_id_fkey"
            columns: ["document_group_id"]
            isOneToOne: false
            referencedRelation: "document_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      document_shares: {
        Row: {
          created_at: string
          document_id: string
          expires_at: string | null
          id: string
          permission_level: string
          shared_by: string
          shared_with: string
        }
        Insert: {
          created_at?: string
          document_id: string
          expires_at?: string | null
          id?: string
          permission_level?: string
          shared_by: string
          shared_with: string
        }
        Update: {
          created_at?: string
          document_id?: string
          expires_at?: string | null
          id?: string
          permission_level?: string
          shared_by?: string
          shared_with?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_shares_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_status_options: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          name: string
          project_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          name: string
          project_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          name?: string
          project_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_status_options_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      document_transmittals: {
        Row: {
          created_at: string | null
          document_id: string | null
          id: string
          notes: string | null
          purpose: string | null
          sent_at: string | null
          sent_by: string | null
          sent_to: string
          transmittal_number: string
        }
        Insert: {
          created_at?: string | null
          document_id?: string | null
          id?: string
          notes?: string | null
          purpose?: string | null
          sent_at?: string | null
          sent_by?: string | null
          sent_to: string
          transmittal_number: string
        }
        Update: {
          created_at?: string | null
          document_id?: string | null
          id?: string
          notes?: string | null
          purpose?: string | null
          sent_at?: string | null
          sent_by?: string | null
          sent_to?: string
          transmittal_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_transmittals_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_types: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          name: string
          project_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          name: string
          project_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          name?: string
          project_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_types_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
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
          assigned_to: string | null
          category: string | null
          created_at: string
          custom_document_number: string | null
          document_number: string | null
          file_extension: string | null
          file_path: string
          file_size: number | null
          file_type: string
          file_type_category: string | null
          id: string
          is_locked: boolean | null
          is_superseded: boolean | null
          locked_at: string | null
          locked_by: string | null
          name: string
          project_id: string
          status: Database["public"]["Enums"]["document_status"]
          status_category: string | null
          superseded_by: string | null
          tags: string[] | null
          title: string | null
          updated_at: string
          uploaded_by: string
          version: number | null
          visibility_scope: string | null
        }
        Insert: {
          assigned_to?: string | null
          category?: string | null
          created_at?: string
          custom_document_number?: string | null
          document_number?: string | null
          file_extension?: string | null
          file_path: string
          file_size?: number | null
          file_type: string
          file_type_category?: string | null
          id?: string
          is_locked?: boolean | null
          is_superseded?: boolean | null
          locked_at?: string | null
          locked_by?: string | null
          name: string
          project_id: string
          status?: Database["public"]["Enums"]["document_status"]
          status_category?: string | null
          superseded_by?: string | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string
          uploaded_by: string
          version?: number | null
          visibility_scope?: string | null
        }
        Update: {
          assigned_to?: string | null
          category?: string | null
          created_at?: string
          custom_document_number?: string | null
          document_number?: string | null
          file_extension?: string | null
          file_path?: string
          file_size?: number | null
          file_type?: string
          file_type_category?: string | null
          id?: string
          is_locked?: boolean | null
          is_superseded?: boolean | null
          locked_at?: string | null
          locked_by?: string | null
          name?: string
          project_id?: string
          status?: Database["public"]["Enums"]["document_status"]
          status_category?: string | null
          superseded_by?: string | null
          tags?: string[] | null
          title?: string | null
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
      invitations: {
        Row: {
          created_at: string | null
          email: string
          expires_at: string | null
          id: string
          inviter_id: string
          project_id: string
          role: string
          status: string | null
          token: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          expires_at?: string | null
          id?: string
          inviter_id: string
          project_id: string
          role?: string
          status?: string | null
          token?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          expires_at?: string | null
          id?: string
          inviter_id?: string
          project_id?: string
          role?: string
          status?: string | null
          token?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invitations_project_id_fkey"
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
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          participants?: string[] | null
          project_id: string
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          participants?: string[] | null
          project_id?: string
          status?: string | null
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
          inquiry_status: string | null
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
          inquiry_status?: string | null
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
          inquiry_status?: string | null
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
          full_name: string | null
          id: string
          last_seen: string | null
          name: string
          online_status: boolean | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          last_seen?: string | null
          name: string
          online_status?: boolean | null
          phone?: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          last_seen?: string | null
          name?: string
          online_status?: boolean | null
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
      project_budgets: {
        Row: {
          created_at: string
          created_by: string
          currency: string
          id: string
          original_budget: number
          project_id: string
          revised_budget: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          currency?: string
          id?: string
          original_budget: number
          project_id: string
          revised_budget?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          currency?: string
          id?: string
          original_budget?: number
          project_id?: string
          revised_budget?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      project_invoices: {
        Row: {
          amount: number
          approved_by: string | null
          attachment_path: string | null
          category_id: string | null
          created_at: string
          created_by: string
          currency: string
          description: string | null
          due_date: string | null
          id: string
          invoice_date: string
          invoice_number: string
          paid_date: string | null
          project_id: string
          status: string
          tax_amount: number | null
          updated_at: string
          vendor_email: string | null
          vendor_name: string
        }
        Insert: {
          amount: number
          approved_by?: string | null
          attachment_path?: string | null
          category_id?: string | null
          created_at?: string
          created_by: string
          currency?: string
          description?: string | null
          due_date?: string | null
          id?: string
          invoice_date: string
          invoice_number: string
          paid_date?: string | null
          project_id: string
          status?: string
          tax_amount?: number | null
          updated_at?: string
          vendor_email?: string | null
          vendor_name: string
        }
        Update: {
          amount?: number
          approved_by?: string | null
          attachment_path?: string | null
          category_id?: string | null
          created_at?: string
          created_by?: string
          currency?: string
          description?: string | null
          due_date?: string | null
          id?: string
          invoice_date?: string
          invoice_number?: string
          paid_date?: string | null
          project_id?: string
          status?: string
          tax_amount?: number | null
          updated_at?: string
          vendor_email?: string | null
          vendor_name?: string
        }
        Relationships: []
      }
      project_join_requests: {
        Row: {
          company: string | null
          created_at: string
          id: string
          message: string | null
          project_code: string
          project_id: string
          requester_email: string | null
          requester_id: string
          requester_name: string | null
          responded_at: string | null
          responded_by: string | null
          role: string | null
          status: string
          updated_at: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          id?: string
          message?: string | null
          project_code: string
          project_id: string
          requester_email?: string | null
          requester_id: string
          requester_name?: string | null
          responded_at?: string | null
          responded_by?: string | null
          role?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          company?: string | null
          created_at?: string
          id?: string
          message?: string | null
          project_code?: string
          project_id?: string
          requester_email?: string | null
          requester_id?: string
          requester_name?: string | null
          responded_at?: string | null
          responded_by?: string | null
          role?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_join_requests_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_payments: {
        Row: {
          amount: number
          created_at: string
          created_by: string
          description: string | null
          id: string
          invoice_id: string | null
          payment_date: string
          payment_method: string | null
          project_id: string
          recipient_name: string
          reference_number: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          invoice_id?: string | null
          payment_date: string
          payment_method?: string | null
          project_id: string
          recipient_name: string
          reference_number?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          invoice_id?: string | null
          payment_date?: string
          payment_method?: string | null
          project_id?: string
          recipient_name?: string
          reference_number?: string | null
        }
        Relationships: []
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
          additional_homeowners: Json | null
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
          invitation_token: string | null
          name: string
          project_id: string | null
          status: Database["public"]["Enums"]["project_status"]
          timeline: Json | null
          updated_at: string
        }
        Insert: {
          additional_homeowners?: Json | null
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
          invitation_token?: string | null
          name: string
          project_id?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          timeline?: Json | null
          updated_at?: string
        }
        Update: {
          additional_homeowners?: Json | null
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
          invitation_token?: string | null
          name?: string
          project_id?: string | null
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
      rfi_collaboration_comments: {
        Row: {
          comment: string
          comment_type: string
          created_at: string
          id: string
          rfi_id: string
          user_id: string
        }
        Insert: {
          comment: string
          comment_type?: string
          created_at?: string
          id?: string
          rfi_id: string
          user_id: string
        }
        Update: {
          comment?: string
          comment_type?: string
          created_at?: string
          id?: string
          rfi_id?: string
          user_id?: string
        }
        Relationships: []
      }
      rfi_collaborators: {
        Row: {
          comments: string | null
          created_at: string
          id: string
          rfi_id: string
          role: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          comments?: string | null
          created_at?: string
          id?: string
          rfi_id: string
          role: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          comments?: string | null
          created_at?: string
          id?: string
          rfi_id?: string
          role?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rfi_email_delivery: {
        Row: {
          attempt_count: number
          created_at: string
          delivered_at: string | null
          error_message: string | null
          id: string
          recipient_email: string
          rfi_id: string
          sent_at: string | null
          status: string
        }
        Insert: {
          attempt_count?: number
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          recipient_email: string
          rfi_id: string
          sent_at?: string | null
          status?: string
        }
        Update: {
          attempt_count?: number
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          recipient_email?: string
          rfi_id?: string
          sent_at?: string | null
          status?: string
        }
        Relationships: []
      }
      rfi_templates: {
        Row: {
          category: string
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_favorite: boolean
          is_shared: boolean
          name: string
          priority: Database["public"]["Enums"]["priority_level"]
          template_data: Json
          updated_at: string
          usage_count: number
        }
        Insert: {
          category: string
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_favorite?: boolean
          is_shared?: boolean
          name: string
          priority?: Database["public"]["Enums"]["priority_level"]
          template_data?: Json
          updated_at?: string
          usage_count?: number
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_favorite?: boolean
          is_shared?: boolean
          name?: string
          priority?: Database["public"]["Enums"]["priority_level"]
          template_data?: Json
          updated_at?: string
          usage_count?: number
        }
        Relationships: []
      }
      rfi_workflow_transitions: {
        Row: {
          action: string
          created_at: string
          from_state: string
          id: string
          notes: string | null
          rfi_id: string
          to_state: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          from_state: string
          id?: string
          notes?: string | null
          rfi_id: string
          to_state: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          from_state?: string
          id?: string
          notes?: string | null
          rfi_id?: string
          to_state?: string
          user_id?: string
        }
        Relationships: []
      }
      rfis: {
        Row: {
          assigned_to: string | null
          attachments: Json | null
          category: string | null
          contract_clause: string | null
          created_at: string
          drawing_no: string | null
          due_date: string | null
          id: string
          other_reference: string | null
          priority: Database["public"]["Enums"]["priority_level"]
          project_id: string
          project_name: string | null
          project_number: string | null
          proposed_solution: string | null
          question: string
          raised_by: string
          recipient_email: string | null
          recipient_name: string | null
          required_response_by: string | null
          responder_name: string | null
          responder_position: string | null
          response: string | null
          response_date: string | null
          rfi_number: string | null
          sender_email: string | null
          sender_name: string | null
          specification_section: string | null
          status: Database["public"]["Enums"]["rfi_status"]
          subject: string | null
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          attachments?: Json | null
          category?: string | null
          contract_clause?: string | null
          created_at?: string
          drawing_no?: string | null
          due_date?: string | null
          id?: string
          other_reference?: string | null
          priority?: Database["public"]["Enums"]["priority_level"]
          project_id: string
          project_name?: string | null
          project_number?: string | null
          proposed_solution?: string | null
          question: string
          raised_by: string
          recipient_email?: string | null
          recipient_name?: string | null
          required_response_by?: string | null
          responder_name?: string | null
          responder_position?: string | null
          response?: string | null
          response_date?: string | null
          rfi_number?: string | null
          sender_email?: string | null
          sender_name?: string | null
          specification_section?: string | null
          status?: Database["public"]["Enums"]["rfi_status"]
          subject?: string | null
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          attachments?: Json | null
          category?: string | null
          contract_clause?: string | null
          created_at?: string
          drawing_no?: string | null
          due_date?: string | null
          id?: string
          other_reference?: string | null
          priority?: Database["public"]["Enums"]["priority_level"]
          project_id?: string
          project_name?: string | null
          project_number?: string | null
          proposed_solution?: string | null
          question?: string
          raised_by?: string
          recipient_email?: string | null
          recipient_name?: string | null
          required_response_by?: string | null
          responder_name?: string | null
          responder_position?: string | null
          response?: string | null
          response_date?: string | null
          rfi_number?: string | null
          sender_email?: string | null
          sender_name?: string | null
          specification_section?: string | null
          status?: Database["public"]["Enums"]["rfi_status"]
          subject?: string | null
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
      accept_team_invitation: {
        Args: { invitation_token_param: string; user_id_param: string }
        Returns: Json
      }
      cleanup_expired_invitations: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_document_supersede: {
        Args: {
          changes_summary?: string
          group_id: string
          new_file_extension: string
          new_file_name: string
          new_file_path: string
          new_file_size: number
          new_file_type: string
        }
        Returns: string
      }
      generate_document_group_number: {
        Args: { project_id_param: string }
        Returns: string
      }
      generate_document_number: {
        Args: { project_id_param: string }
        Returns: string
      }
      generate_project_invitation_token: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_rfi_number: {
        Args: { project_id_param: string }
        Returns: string
      }
      generate_unique_project_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
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
      migrate_existing_documents: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      toggle_document_lock: {
        Args: { group_id: string; should_lock: boolean }
        Returns: Json
      }
      update_document_group_metadata: {
        Args: {
          group_id: string
          new_category?: string
          new_status?: string
          new_title?: string
          new_visibility_scope?: string
        }
        Returns: Json
      }
    }
    Enums: {
      document_status: "For Tender" | "For Information" | "For Construction"
      priority_level: "low" | "medium" | "high" | "critical"
      project_status:
        | "planning"
        | "active"
        | "on_hold"
        | "completed"
        | "cancelled"
      rfi_status:
        | "outstanding"
        | "overdue"
        | "responded"
        | "closed"
        | "draft"
        | "sent"
        | "received"
        | "in_review"
        | "answered"
        | "rejected"
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
      document_status: ["For Tender", "For Information", "For Construction"],
      priority_level: ["low", "medium", "high", "critical"],
      project_status: [
        "planning",
        "active",
        "on_hold",
        "completed",
        "cancelled",
      ],
      rfi_status: [
        "outstanding",
        "overdue",
        "responded",
        "closed",
        "draft",
        "sent",
        "received",
        "in_review",
        "answered",
        "rejected",
      ],
      tender_status: ["draft", "open", "closed", "awarded", "cancelled"],
      user_role: ["architect", "builder", "homeowner", "contractor"],
    },
  },
} as const
