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
      applications: {
        Row: {
          address: string | null
          age: number | null
          city: string | null
          created_at: string
          email: string | null
          experience: string | null
          fayda_back: string | null
          fayda_front: string | null
          fayda_number: string | null
          full_name: string | null
          gender: Database["public"]["Enums"]["gender_type"] | null
          id: string
          kebele: string | null
          latitude: number | null
          longitude: number | null
          personal_photo: string | null
          phone: string | null
          role: Database["public"]["Enums"]["app_role_type"] | null
          sector: Database["public"]["Enums"]["sector_type"] | null
          sector_other: string | null
          sectors: string[]
          sub_city: string | null
          updated_at: string
          user_id: string
          wereda: string | null
        }
        Insert: {
          address?: string | null
          age?: number | null
          city?: string | null
          created_at?: string
          email?: string | null
          experience?: string | null
          fayda_back?: string | null
          fayda_front?: string | null
          fayda_number?: string | null
          full_name?: string | null
          gender?: Database["public"]["Enums"]["gender_type"] | null
          id?: string
          kebele?: string | null
          latitude?: number | null
          longitude?: number | null
          personal_photo?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role_type"] | null
          sector?: Database["public"]["Enums"]["sector_type"] | null
          sector_other?: string | null
          sectors?: string[]
          sub_city?: string | null
          updated_at?: string
          user_id: string
          wereda?: string | null
        }
        Update: {
          address?: string | null
          age?: number | null
          city?: string | null
          created_at?: string
          email?: string | null
          experience?: string | null
          fayda_back?: string | null
          fayda_front?: string | null
          fayda_number?: string | null
          full_name?: string | null
          gender?: Database["public"]["Enums"]["gender_type"] | null
          id?: string
          kebele?: string | null
          latitude?: number | null
          longitude?: number | null
          personal_photo?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role_type"] | null
          sector?: Database["public"]["Enums"]["sector_type"] | null
          sector_other?: string | null
          sectors?: string[]
          sub_city?: string | null
          updated_at?: string
          user_id?: string
          wereda?: string | null
        }
        Relationships: []
      }
      assignments: {
        Row: {
          admin_note: string | null
          agreement_path: string | null
          broker_id: string
          created_at: string
          employer_ref: string
          id: string
          status: string
          updated_at: string
          witness_name: string | null
          witness_phone: string | null
          witness_sex: Database["public"]["Enums"]["gender_type"] | null
          worker_ref: string
        }
        Insert: {
          admin_note?: string | null
          agreement_path?: string | null
          broker_id: string
          created_at?: string
          employer_ref: string
          id?: string
          status?: string
          updated_at?: string
          witness_name?: string | null
          witness_phone?: string | null
          witness_sex?: Database["public"]["Enums"]["gender_type"] | null
          worker_ref: string
        }
        Update: {
          admin_note?: string | null
          agreement_path?: string | null
          broker_id?: string
          created_at?: string
          employer_ref?: string
          id?: string
          status?: string
          updated_at?: string
          witness_name?: string | null
          witness_phone?: string | null
          witness_sex?: Database["public"]["Enums"]["gender_type"] | null
          worker_ref?: string
        }
        Relationships: []
      }
      banners: {
        Row: {
          active: boolean
          body: string | null
          created_at: string
          created_by: string | null
          cta_label: string | null
          cta_link: string | null
          desktop_image: string | null
          ends_at: string | null
          id: string
          kind: string
          mobile_image: string | null
          placement: string
          sort_order: number
          starts_at: string | null
          subtitle: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          body?: string | null
          created_at?: string
          created_by?: string | null
          cta_label?: string | null
          cta_link?: string | null
          desktop_image?: string | null
          ends_at?: string | null
          id?: string
          kind?: string
          mobile_image?: string | null
          placement?: string
          sort_order?: number
          starts_at?: string | null
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          body?: string | null
          created_at?: string
          created_by?: string | null
          cta_label?: string | null
          cta_link?: string | null
          desktop_image?: string | null
          ends_at?: string | null
          id?: string
          kind?: string
          mobile_image?: string | null
          placement?: string
          sort_order?: number
          starts_at?: string | null
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          address: string | null
          admin_note: string | null
          created_at: string
          employer_id: string
          hours: number | null
          id: string
          notes: string | null
          price: number | null
          scheduled_date: string | null
          service: string
          status: Database["public"]["Enums"]["booking_status_type"]
          updated_at: string
          worker_id: string | null
          worker_name: string | null
          worker_ref: string | null
        }
        Insert: {
          address?: string | null
          admin_note?: string | null
          created_at?: string
          employer_id: string
          hours?: number | null
          id?: string
          notes?: string | null
          price?: number | null
          scheduled_date?: string | null
          service: string
          status?: Database["public"]["Enums"]["booking_status_type"]
          updated_at?: string
          worker_id?: string | null
          worker_name?: string | null
          worker_ref?: string | null
        }
        Update: {
          address?: string | null
          admin_note?: string | null
          created_at?: string
          employer_id?: string
          hours?: number | null
          id?: string
          notes?: string | null
          price?: number | null
          scheduled_date?: string | null
          service?: string
          status?: Database["public"]["Enums"]["booking_status_type"]
          updated_at?: string
          worker_id?: string | null
          worker_name?: string | null
          worker_ref?: string | null
        }
        Relationships: []
      }
      broker_employers: {
        Row: {
          address: string | null
          broker_id: string
          city: string | null
          created_at: string
          email: string | null
          fayda_back: string | null
          fayda_front: string | null
          fayda_number: string | null
          full_name: string
          id: string
          kebele: string | null
          latitude: number | null
          longitude: number | null
          personal_photo: string | null
          phone: string | null
          sub_city: string | null
          updated_at: string
          verification_note: string | null
          verification_status: Database["public"]["Enums"]["verification_status_type"]
          verified_at: string | null
          wereda: string | null
        }
        Insert: {
          address?: string | null
          broker_id: string
          city?: string | null
          created_at?: string
          email?: string | null
          fayda_back?: string | null
          fayda_front?: string | null
          fayda_number?: string | null
          full_name: string
          id?: string
          kebele?: string | null
          latitude?: number | null
          longitude?: number | null
          personal_photo?: string | null
          phone?: string | null
          sub_city?: string | null
          updated_at?: string
          verification_note?: string | null
          verification_status?: Database["public"]["Enums"]["verification_status_type"]
          verified_at?: string | null
          wereda?: string | null
        }
        Update: {
          address?: string | null
          broker_id?: string
          city?: string | null
          created_at?: string
          email?: string | null
          fayda_back?: string | null
          fayda_front?: string | null
          fayda_number?: string | null
          full_name?: string
          id?: string
          kebele?: string | null
          latitude?: number | null
          longitude?: number | null
          personal_photo?: string | null
          phone?: string | null
          sub_city?: string | null
          updated_at?: string
          verification_note?: string | null
          verification_status?: Database["public"]["Enums"]["verification_status_type"]
          verified_at?: string | null
          wereda?: string | null
        }
        Relationships: []
      }
      compliance_logs: {
        Row: {
          action: string
          actor_id: string | null
          actor_name: string | null
          created_at: string
          id: string
          subject_id: string | null
          subject_type: string
          summary: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string
          id?: string
          subject_id?: string | null
          subject_type: string
          summary?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string
          id?: string
          subject_id?: string | null
          subject_type?: string
          summary?: string | null
        }
        Relationships: []
      }
      direct_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          read_at: string | null
          recipient_id: string
          sender_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_id: string
          sender_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      employee_profiles: {
        Row: {
          age: number | null
          application_id: string | null
          contract_path: string | null
          created_at: string
          education: string | null
          education_document: string | null
          education_graduation_year: number | null
          education_institution: string | null
          education_qualification: string | null
          experience: string | null
          fayda_number: string | null
          gender: Database["public"]["Enums"]["gender_type"] | null
          guarantor_id_number: string | null
          guarantor_id_photo: string | null
          guarantor_name: string | null
          guarantor_phone: string | null
          guarantor_photo: string | null
          id: string
          id_photo_back: string | null
          id_photo_front: string | null
          language: string | null
          language_other: string | null
          photo_url: string | null
          sector: Database["public"]["Enums"]["sector_type"] | null
          sector_other: string | null
          sectors: string[]
          skills: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          age?: number | null
          application_id?: string | null
          contract_path?: string | null
          created_at?: string
          education?: string | null
          education_document?: string | null
          education_graduation_year?: number | null
          education_institution?: string | null
          education_qualification?: string | null
          experience?: string | null
          fayda_number?: string | null
          gender?: Database["public"]["Enums"]["gender_type"] | null
          guarantor_id_number?: string | null
          guarantor_id_photo?: string | null
          guarantor_name?: string | null
          guarantor_phone?: string | null
          guarantor_photo?: string | null
          id?: string
          id_photo_back?: string | null
          id_photo_front?: string | null
          language?: string | null
          language_other?: string | null
          photo_url?: string | null
          sector?: Database["public"]["Enums"]["sector_type"] | null
          sector_other?: string | null
          sectors?: string[]
          skills?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          age?: number | null
          application_id?: string | null
          contract_path?: string | null
          created_at?: string
          education?: string | null
          education_document?: string | null
          education_graduation_year?: number | null
          education_institution?: string | null
          education_qualification?: string | null
          experience?: string | null
          fayda_number?: string | null
          gender?: Database["public"]["Enums"]["gender_type"] | null
          guarantor_id_number?: string | null
          guarantor_id_photo?: string | null
          guarantor_name?: string | null
          guarantor_phone?: string | null
          guarantor_photo?: string | null
          id?: string
          id_photo_back?: string | null
          id_photo_front?: string | null
          language?: string | null
          language_other?: string | null
          photo_url?: string | null
          sector?: Database["public"]["Enums"]["sector_type"] | null
          sector_other?: string | null
          sectors?: string[]
          skills?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_profiles_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_requests: {
        Row: {
          admin_note: string | null
          admin_response: string | null
          allowances: number | null
          allowances_note: string | null
          assigned_worker_id: string | null
          assigned_worker_name: string | null
          budget: number | null
          contact_phone: string | null
          created_at: string
          duration: string | null
          employee_name: string
          employee_ref: string | null
          employer_id: string
          id: string
          location: string | null
          message: string | null
          paid_at: string | null
          salary: number | null
          sector: string | null
          sector_answers: Json | null
          service_fee: number | null
          status: string
          updated_at: string
        }
        Insert: {
          admin_note?: string | null
          admin_response?: string | null
          allowances?: number | null
          allowances_note?: string | null
          assigned_worker_id?: string | null
          assigned_worker_name?: string | null
          budget?: number | null
          contact_phone?: string | null
          created_at?: string
          duration?: string | null
          employee_name: string
          employee_ref?: string | null
          employer_id: string
          id?: string
          location?: string | null
          message?: string | null
          paid_at?: string | null
          salary?: number | null
          sector?: string | null
          sector_answers?: Json | null
          service_fee?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          admin_note?: string | null
          admin_response?: string | null
          allowances?: number | null
          allowances_note?: string | null
          assigned_worker_id?: string | null
          assigned_worker_name?: string | null
          budget?: number | null
          contact_phone?: string | null
          created_at?: string
          duration?: string | null
          employee_name?: string
          employee_ref?: string | null
          employer_id?: string
          id?: string
          location?: string | null
          message?: string | null
          paid_at?: string | null
          salary?: number | null
          sector?: string | null
          sector_answers?: Json | null
          service_fee?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      employee_termination_requests: {
        Row: {
          admin_note: string | null
          assignment_id: string | null
          broker_employer_id: string | null
          created_at: string
          details: string | null
          employee_id: string
          employer_ack_at: string | null
          employer_id: string | null
          employer_name: string
          hired_id: string | null
          id: string
          make_available: boolean
          reason: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          worker_id: string | null
        }
        Insert: {
          admin_note?: string | null
          assignment_id?: string | null
          broker_employer_id?: string | null
          created_at?: string
          details?: string | null
          employee_id: string
          employer_ack_at?: string | null
          employer_id?: string | null
          employer_name: string
          hired_id?: string | null
          id?: string
          make_available?: boolean
          reason: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          worker_id?: string | null
        }
        Update: {
          admin_note?: string | null
          assignment_id?: string | null
          broker_employer_id?: string | null
          created_at?: string
          details?: string | null
          employee_id?: string
          employer_ack_at?: string | null
          employer_id?: string | null
          employer_name?: string
          hired_id?: string | null
          id?: string
          make_available?: boolean
          reason?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          worker_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_termination_requests_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_termination_requests_broker_employer_id_fkey"
            columns: ["broker_employer_id"]
            isOneToOne: false
            referencedRelation: "broker_employers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_termination_requests_hired_id_fkey"
            columns: ["hired_id"]
            isOneToOne: false
            referencedRelation: "hired_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_termination_requests_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_termination_requests_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      employer_ratings: {
        Row: {
          broker_employer_id: string | null
          created_at: string
          employee_id: string
          employer_id: string | null
          employer_name: string
          id: string
          rating: number
          review: string | null
          updated_at: string
          worker_id: string | null
        }
        Insert: {
          broker_employer_id?: string | null
          created_at?: string
          employee_id: string
          employer_id?: string | null
          employer_name: string
          id?: string
          rating: number
          review?: string | null
          updated_at?: string
          worker_id?: string | null
        }
        Update: {
          broker_employer_id?: string | null
          created_at?: string
          employee_id?: string
          employer_id?: string | null
          employer_name?: string
          id?: string
          rating?: number
          review?: string | null
          updated_at?: string
          worker_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employer_ratings_broker_employer_id_fkey"
            columns: ["broker_employer_id"]
            isOneToOne: false
            referencedRelation: "broker_employers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employer_ratings_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employer_ratings_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      employer_reports: {
        Row: {
          admin_response: string | null
          attachments: Json
          broker_employer_id: string | null
          created_at: string
          details: string | null
          employee_id: string
          employer_id: string | null
          employer_name: string
          id: string
          reason: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          worker_id: string | null
        }
        Insert: {
          admin_response?: string | null
          attachments?: Json
          broker_employer_id?: string | null
          created_at?: string
          details?: string | null
          employee_id: string
          employer_id?: string | null
          employer_name: string
          id?: string
          reason: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          worker_id?: string | null
        }
        Update: {
          admin_response?: string | null
          attachments?: Json
          broker_employer_id?: string | null
          created_at?: string
          details?: string | null
          employee_id?: string
          employer_id?: string | null
          employer_name?: string
          id?: string
          reason?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          worker_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employer_reports_broker_employer_id_fkey"
            columns: ["broker_employer_id"]
            isOneToOne: false
            referencedRelation: "broker_employers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employer_reports_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employer_reports_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      hired_employees: {
        Row: {
          created_at: string
          employer_id: string
          id: string
          request_id: string | null
          salary: number | null
          sector: string | null
          status: string
          updated_at: string
          worker_name: string
          worker_ref: string | null
        }
        Insert: {
          created_at?: string
          employer_id: string
          id?: string
          request_id?: string | null
          salary?: number | null
          sector?: string | null
          status?: string
          updated_at?: string
          worker_name: string
          worker_ref?: string | null
        }
        Update: {
          created_at?: string
          employer_id?: string
          id?: string
          request_id?: string | null
          salary?: number | null
          sector?: string | null
          status?: string
          updated_at?: string
          worker_name?: string
          worker_ref?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hired_employees_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "employee_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_reports: {
        Row: {
          admin_response: string | null
          attachments: Json | null
          category: string
          created_at: string
          details: Json | null
          employer_id: string
          forwarded_at: string | null
          hired_id: string | null
          id: string
          status: string
          updated_at: string
          worker_name: string
          worker_ref: string | null
        }
        Insert: {
          admin_response?: string | null
          attachments?: Json | null
          category: string
          created_at?: string
          details?: Json | null
          employer_id: string
          forwarded_at?: string | null
          hired_id?: string | null
          id?: string
          status?: string
          updated_at?: string
          worker_name: string
          worker_ref?: string | null
        }
        Update: {
          admin_response?: string | null
          attachments?: Json | null
          category?: string
          created_at?: string
          details?: Json | null
          employer_id?: string
          forwarded_at?: string | null
          hired_id?: string | null
          id?: string
          status?: string
          updated_at?: string
          worker_name?: string
          worker_ref?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "incident_reports_hired_id_fkey"
            columns: ["hired_id"]
            isOneToOne: false
            referencedRelation: "hired_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      job_applications: {
        Row: {
          address: string | null
          applicant_id: string | null
          city: string | null
          claim_token: string
          created_at: string
          cv_path: string | null
          education: Json | null
          education_document: string | null
          email: string | null
          employer_note: string | null
          experience: string | null
          full_name: string
          id: string
          job_id: string
          message: string | null
          phone: string | null
          profile_complete: boolean
          status: string
          updated_at: string
          worker_id: string | null
        }
        Insert: {
          address?: string | null
          applicant_id?: string | null
          city?: string | null
          claim_token?: string
          created_at?: string
          cv_path?: string | null
          education?: Json | null
          education_document?: string | null
          email?: string | null
          employer_note?: string | null
          experience?: string | null
          full_name: string
          id?: string
          job_id: string
          message?: string | null
          phone?: string | null
          profile_complete?: boolean
          status?: string
          updated_at?: string
          worker_id?: string | null
        }
        Update: {
          address?: string | null
          applicant_id?: string | null
          city?: string | null
          claim_token?: string
          created_at?: string
          cv_path?: string | null
          education?: Json | null
          education_document?: string | null
          email?: string | null
          employer_note?: string | null
          experience?: string | null
          full_name?: string
          id?: string
          job_id?: string
          message?: string | null
          phone?: string | null
          profile_complete?: boolean
          status?: string
          updated_at?: string
          worker_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_applications_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_applications_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      job_posts: {
        Row: {
          address: string | null
          admin_note: string | null
          area: string | null
          city: string | null
          closed_at: string | null
          closing_date: string | null
          company_name: string | null
          contact_phone: string | null
          created_at: string
          description: string
          duration: string | null
          employer_id: string
          employer_name: string | null
          employment_type: string
          fee_amount: number
          id: string
          openings: number
          payment_id: string | null
          published_at: string | null
          requirements: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          salary: number | null
          salary_max: number | null
          sector: Database["public"]["Enums"]["sector_type"] | null
          sector_other: string | null
          status: string
          sub_city: string | null
          title: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          admin_note?: string | null
          area?: string | null
          city?: string | null
          closed_at?: string | null
          closing_date?: string | null
          company_name?: string | null
          contact_phone?: string | null
          created_at?: string
          description: string
          duration?: string | null
          employer_id: string
          employer_name?: string | null
          employment_type?: string
          fee_amount?: number
          id?: string
          openings?: number
          payment_id?: string | null
          published_at?: string | null
          requirements?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          salary?: number | null
          salary_max?: number | null
          sector?: Database["public"]["Enums"]["sector_type"] | null
          sector_other?: string | null
          status?: string
          sub_city?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          admin_note?: string | null
          area?: string | null
          city?: string | null
          closed_at?: string | null
          closing_date?: string | null
          company_name?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string
          duration?: string | null
          employer_id?: string
          employer_name?: string | null
          employment_type?: string
          fee_amount?: number
          id?: string
          openings?: number
          payment_id?: string | null
          published_at?: string | null
          requirements?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          salary?: number | null
          salary_max?: number | null
          sector?: Database["public"]["Enums"]["sector_type"] | null
          sector_other?: string | null
          status?: string
          sub_city?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_posts_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          admin_reply: string | null
          body: string
          created_at: string
          id: string
          sender_id: string
          status: string
          subject: string | null
          updated_at: string
        }
        Insert: {
          admin_reply?: string | null
          body: string
          created_at?: string
          id?: string
          sender_id: string
          status?: string
          subject?: string | null
          updated_at?: string
        }
        Update: {
          admin_reply?: string | null
          body?: string
          created_at?: string
          id?: string
          sender_id?: string
          status?: string
          subject?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          method: string
          package_id: string | null
          payer_name: string
          purpose: string | null
          receipt_path: string | null
          reviewed_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          method?: string
          package_id?: string | null
          payer_name: string
          purpose?: string | null
          receipt_path?: string | null
          reviewed_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          method?: string
          package_id?: string | null
          payer_name?: string
          purpose?: string | null
          receipt_path?: string | null
          reviewed_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "subscription_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_settings: {
        Row: {
          active: boolean
          amount: number
          category: string
          created_at: string
          key: string
          label: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          amount?: number
          category: string
          created_at?: string
          key: string
          label: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          amount?: number
          category?: string
          created_at?: string
          key?: string
          label?: string
          updated_at?: string
        }
        Relationships: []
      }
      profile_change_requests: {
        Row: {
          admin_note: string | null
          changes: Json
          created_at: string
          id: string
          note: string | null
          requested_by: string
          requester_name: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          target_id: string
          target_name: string | null
          target_table: string
          updated_at: string
        }
        Insert: {
          admin_note?: string | null
          changes: Json
          created_at?: string
          id?: string
          note?: string | null
          requested_by: string
          requester_name?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          target_id: string
          target_name?: string | null
          target_table: string
          updated_at?: string
        }
        Update: {
          admin_note?: string | null
          changes?: Json
          created_at?: string
          id?: string
          note?: string | null
          requested_by?: string
          requester_name?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          target_id?: string
          target_name?: string | null
          target_table?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          available: boolean
          avatar_url: string | null
          city: string | null
          created_at: string
          full_name: string | null
          id: string
          must_change_password: boolean
          phone: string | null
          registered_by: string | null
          registered_by_name: string | null
          registration_type: string | null
          role: Database["public"]["Enums"]["app_role_type"]
          updated_at: string
          verification_note: string | null
          verification_status: Database["public"]["Enums"]["verification_status_type"]
          verified_at: string | null
          wallet_balance: number
        }
        Insert: {
          available?: boolean
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          must_change_password?: boolean
          phone?: string | null
          registered_by?: string | null
          registered_by_name?: string | null
          registration_type?: string | null
          role?: Database["public"]["Enums"]["app_role_type"]
          updated_at?: string
          verification_note?: string | null
          verification_status?: Database["public"]["Enums"]["verification_status_type"]
          verified_at?: string | null
          wallet_balance?: number
        }
        Update: {
          available?: boolean
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          must_change_password?: boolean
          phone?: string | null
          registered_by?: string | null
          registered_by_name?: string | null
          registration_type?: string | null
          role?: Database["public"]["Enums"]["app_role_type"]
          updated_at?: string
          verification_note?: string | null
          verification_status?: Database["public"]["Enums"]["verification_status_type"]
          verified_at?: string | null
          wallet_balance?: number
        }
        Relationships: []
      }
      review_messages: {
        Row: {
          attachment_bucket: string | null
          attachment_name: string | null
          attachment_path: string | null
          body: string
          created_at: string
          from_staff: boolean
          id: string
          owner_id: string
          sender_id: string
          subject_id: string
          subject_source: string
        }
        Insert: {
          attachment_bucket?: string | null
          attachment_name?: string | null
          attachment_path?: string | null
          body: string
          created_at?: string
          from_staff?: boolean
          id?: string
          owner_id: string
          sender_id: string
          subject_id: string
          subject_source: string
        }
        Update: {
          attachment_bucket?: string | null
          attachment_name?: string | null
          attachment_path?: string | null
          body?: string
          created_at?: string
          from_staff?: boolean
          id?: string
          owner_id?: string
          sender_id?: string
          subject_id?: string
          subject_source?: string
        }
        Relationships: []
      }
      sectors: {
        Row: {
          active: boolean
          am: string | null
          created_at: string
          created_by: string | null
          id: string
          key: string
          label: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          am?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          key: string
          label: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          am?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          key?: string
          label?: string
          updated_at?: string
        }
        Relationships: []
      }
      sub_admins: {
        Row: {
          active: boolean
          age: number | null
          city: string | null
          created_at: string
          created_by: string | null
          email: string
          fayda_number: string | null
          full_name: string
          id: string
          permissions: Json
          phone: string | null
          photo_url: string | null
          sex: Database["public"]["Enums"]["gender_type"] | null
          updated_at: string
          user_id: string | null
          woreda: string | null
        }
        Insert: {
          active?: boolean
          age?: number | null
          city?: string | null
          created_at?: string
          created_by?: string | null
          email: string
          fayda_number?: string | null
          full_name: string
          id?: string
          permissions?: Json
          phone?: string | null
          photo_url?: string | null
          sex?: Database["public"]["Enums"]["gender_type"] | null
          updated_at?: string
          user_id?: string | null
          woreda?: string | null
        }
        Update: {
          active?: boolean
          age?: number | null
          city?: string | null
          created_at?: string
          created_by?: string | null
          email?: string
          fayda_number?: string | null
          full_name?: string
          id?: string
          permissions?: Json
          phone?: string | null
          photo_url?: string | null
          sex?: Database["public"]["Enums"]["gender_type"] | null
          updated_at?: string
          user_id?: string | null
          woreda?: string | null
        }
        Relationships: []
      }
      subscription_packages: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          duration_days: number
          feature_limits: Json
          fee_overrides: Json
          id: string
          name: string
          price: number
          updated_at: string
          user_type: Database["public"]["Enums"]["app_role_type"]
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          duration_days: number
          feature_limits?: Json
          fee_overrides?: Json
          id?: string
          name: string
          price: number
          updated_at?: string
          user_type: Database["public"]["Enums"]["app_role_type"]
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          duration_days?: number
          feature_limits?: Json
          fee_overrides?: Json
          id?: string
          name?: string
          price?: number
          updated_at?: string
          user_type?: Database["public"]["Enums"]["app_role_type"]
        }
        Relationships: []
      }
      termination_requests: {
        Row: {
          admin_note: string | null
          created_at: string
          details: string | null
          employer_id: string
          hired_id: string | null
          id: string
          make_available: boolean
          reason: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          worker_name: string
          worker_ref: string | null
        }
        Insert: {
          admin_note?: string | null
          created_at?: string
          details?: string | null
          employer_id: string
          hired_id?: string | null
          id?: string
          make_available?: boolean
          reason: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          worker_name: string
          worker_ref?: string | null
        }
        Update: {
          admin_note?: string | null
          created_at?: string
          details?: string | null
          employer_id?: string
          hired_id?: string | null
          id?: string
          make_available?: boolean
          reason?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          worker_name?: string
          worker_ref?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "termination_requests_hired_id_fkey"
            columns: ["hired_id"]
            isOneToOne: false
            referencedRelation: "hired_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role_type"]
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          created_at: string
          expires_at: string
          granted_by: string | null
          id: string
          note: string | null
          package_id: string
          starts_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          granted_by?: string | null
          id?: string
          note?: string | null
          package_id: string
          starts_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          granted_by?: string | null
          id?: string
          note?: string | null
          package_id?: string
          starts_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "subscription_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_transactions: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          id: string
          is_admin_adjustment: boolean
          reason: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          id?: string
          is_admin_adjustment?: boolean
          reason: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          id?: string
          is_admin_adjustment?: boolean
          reason?: string
          user_id?: string
        }
        Relationships: []
      }
      worker_public_profiles: {
        Row: {
          age: number | null
          area: string | null
          available: boolean
          city: string | null
          created_at: string
          experience: string | null
          full_name: string
          gender: Database["public"]["Enums"]["gender_type"] | null
          global_status: string
          id: string
          language: string | null
          language_other: string | null
          latitude: number | null
          longitude: number | null
          photo_url: string | null
          price: number | null
          sector: Database["public"]["Enums"]["sector_type"] | null
          sector_other: string | null
          sub_city: string | null
          verification_status: Database["public"]["Enums"]["verification_status_type"]
        }
        Insert: {
          age?: number | null
          area?: string | null
          available?: boolean
          city?: string | null
          created_at?: string
          experience?: string | null
          full_name: string
          gender?: Database["public"]["Enums"]["gender_type"] | null
          global_status?: string
          id: string
          language?: string | null
          language_other?: string | null
          latitude?: number | null
          longitude?: number | null
          photo_url?: string | null
          price?: number | null
          sector?: Database["public"]["Enums"]["sector_type"] | null
          sector_other?: string | null
          sub_city?: string | null
          verification_status?: Database["public"]["Enums"]["verification_status_type"]
        }
        Update: {
          age?: number | null
          area?: string | null
          available?: boolean
          city?: string | null
          created_at?: string
          experience?: string | null
          full_name?: string
          gender?: Database["public"]["Enums"]["gender_type"] | null
          global_status?: string
          id?: string
          language?: string | null
          language_other?: string | null
          latitude?: number | null
          longitude?: number | null
          photo_url?: string | null
          price?: number | null
          sector?: Database["public"]["Enums"]["sector_type"] | null
          sector_other?: string | null
          sub_city?: string | null
          verification_status?: Database["public"]["Enums"]["verification_status_type"]
        }
        Relationships: [
          {
            foreignKeyName: "worker_public_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "worker_public_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "workers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      worker_ratings: {
        Row: {
          created_at: string
          employer_id: string
          hired_id: string | null
          id: string
          rating: number
          review: string | null
          updated_at: string
          worker_name: string
          worker_ref: string | null
        }
        Insert: {
          created_at?: string
          employer_id: string
          hired_id?: string | null
          id?: string
          rating: number
          review?: string | null
          updated_at?: string
          worker_name: string
          worker_ref?: string | null
        }
        Update: {
          created_at?: string
          employer_id?: string
          hired_id?: string | null
          id?: string
          rating?: number
          review?: string | null
          updated_at?: string
          worker_name?: string
          worker_ref?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "worker_ratings_hired_id_fkey"
            columns: ["hired_id"]
            isOneToOne: false
            referencedRelation: "hired_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      workers: {
        Row: {
          address: string | null
          age: number | null
          area: string | null
          available: boolean
          city: string | null
          contract_path: string | null
          created_at: string
          education: string | null
          education_document: string | null
          education_graduation_year: number | null
          education_institution: string | null
          education_qualification: string | null
          email: string | null
          experience: string | null
          fayda_back: string | null
          fayda_front: string | null
          fayda_number: string | null
          fayda_verified: boolean
          full_name: string
          gender: Database["public"]["Enums"]["gender_type"] | null
          global_status: string
          guarantor_id_number: string | null
          guarantor_id_photo: string | null
          guarantor_name: string | null
          guarantor_phone: string | null
          guarantor_photo: string | null
          guarantor_relationship: string | null
          guarantor_verified: boolean
          id: string
          is_public: boolean
          kebele: string | null
          language: string | null
          language_other: string | null
          latitude: number | null
          longitude: number | null
          owner_id: string
          phone: string | null
          photo_url: string | null
          price: number | null
          registered_by: string | null
          registered_by_name: string | null
          registration_type: string | null
          sector: Database["public"]["Enums"]["sector_type"] | null
          sector_other: string | null
          sectors: string[]
          skills: string[]
          sub_city: string | null
          updated_at: string
          user_id: string | null
          verification_note: string | null
          verification_status: Database["public"]["Enums"]["verification_status_type"]
          verified_at: string | null
          wereda: string | null
        }
        Insert: {
          address?: string | null
          age?: number | null
          area?: string | null
          available?: boolean
          city?: string | null
          contract_path?: string | null
          created_at?: string
          education?: string | null
          education_document?: string | null
          education_graduation_year?: number | null
          education_institution?: string | null
          education_qualification?: string | null
          email?: string | null
          experience?: string | null
          fayda_back?: string | null
          fayda_front?: string | null
          fayda_number?: string | null
          fayda_verified?: boolean
          full_name: string
          gender?: Database["public"]["Enums"]["gender_type"] | null
          global_status?: string
          guarantor_id_number?: string | null
          guarantor_id_photo?: string | null
          guarantor_name?: string | null
          guarantor_phone?: string | null
          guarantor_photo?: string | null
          guarantor_relationship?: string | null
          guarantor_verified?: boolean
          id?: string
          is_public?: boolean
          kebele?: string | null
          language?: string | null
          language_other?: string | null
          latitude?: number | null
          longitude?: number | null
          owner_id: string
          phone?: string | null
          photo_url?: string | null
          price?: number | null
          registered_by?: string | null
          registered_by_name?: string | null
          registration_type?: string | null
          sector?: Database["public"]["Enums"]["sector_type"] | null
          sector_other?: string | null
          sectors?: string[]
          skills?: string[]
          sub_city?: string | null
          updated_at?: string
          user_id?: string | null
          verification_note?: string | null
          verification_status?: Database["public"]["Enums"]["verification_status_type"]
          verified_at?: string | null
          wereda?: string | null
        }
        Update: {
          address?: string | null
          age?: number | null
          area?: string | null
          available?: boolean
          city?: string | null
          contract_path?: string | null
          created_at?: string
          education?: string | null
          education_document?: string | null
          education_graduation_year?: number | null
          education_institution?: string | null
          education_qualification?: string | null
          email?: string | null
          experience?: string | null
          fayda_back?: string | null
          fayda_front?: string | null
          fayda_number?: string | null
          fayda_verified?: boolean
          full_name?: string
          gender?: Database["public"]["Enums"]["gender_type"] | null
          global_status?: string
          guarantor_id_number?: string | null
          guarantor_id_photo?: string | null
          guarantor_name?: string | null
          guarantor_phone?: string | null
          guarantor_photo?: string | null
          guarantor_relationship?: string | null
          guarantor_verified?: boolean
          id?: string
          is_public?: boolean
          kebele?: string | null
          language?: string | null
          language_other?: string | null
          latitude?: number | null
          longitude?: number | null
          owner_id?: string
          phone?: string | null
          photo_url?: string | null
          price?: number | null
          registered_by?: string | null
          registered_by_name?: string | null
          registration_type?: string | null
          sector?: Database["public"]["Enums"]["sector_type"] | null
          sector_other?: string | null
          sectors?: string[]
          skills?: string[]
          sub_city?: string | null
          updated_at?: string
          user_id?: string | null
          verification_note?: string | null
          verification_status?: Database["public"]["Enums"]["verification_status_type"]
          verified_at?: string | null
          wereda?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      workers_public: {
        Row: {
          age: number | null
          area: string | null
          available: boolean | null
          city: string | null
          created_at: string | null
          experience: string | null
          fayda_verified: boolean | null
          full_name: string | null
          gender: Database["public"]["Enums"]["gender_type"] | null
          guarantor_verified: boolean | null
          id: string | null
          latitude: number | null
          longitude: number | null
          photo_url: string | null
          price: number | null
          sector: Database["public"]["Enums"]["sector_type"] | null
          sector_other: string | null
          sectors: string[] | null
          sub_city: string | null
          user_id: string | null
          verification_status:
            | Database["public"]["Enums"]["verification_status_type"]
            | null
        }
        Insert: {
          age?: number | null
          area?: string | null
          available?: boolean | null
          city?: string | null
          created_at?: string | null
          experience?: string | null
          fayda_verified?: boolean | null
          full_name?: string | null
          gender?: Database["public"]["Enums"]["gender_type"] | null
          guarantor_verified?: boolean | null
          id?: string | null
          latitude?: number | null
          longitude?: number | null
          photo_url?: string | null
          price?: number | null
          sector?: Database["public"]["Enums"]["sector_type"] | null
          sector_other?: string | null
          sectors?: string[] | null
          sub_city?: string | null
          user_id?: string | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status_type"]
            | null
        }
        Update: {
          age?: number | null
          area?: string | null
          available?: boolean | null
          city?: string | null
          created_at?: string | null
          experience?: string | null
          fayda_verified?: boolean | null
          full_name?: string | null
          gender?: Database["public"]["Enums"]["gender_type"] | null
          guarantor_verified?: boolean | null
          id?: string | null
          latitude?: number | null
          longitude?: number | null
          photo_url?: string | null
          price?: number | null
          sector?: Database["public"]["Enums"]["sector_type"] | null
          sector_other?: string | null
          sectors?: string[] | null
          sub_city?: string | null
          user_id?: string | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status_type"]
            | null
        }
        Relationships: []
      }
    }
    Functions: {
      ack_employee_termination: { Args: { _id: string }; Returns: undefined }
      admin_adjust_wallet: {
        Args: { _amount: number; _note: string; _user_id: string }
        Returns: number
      }
      approve_payment: { Args: { _payment_id: string }; Returns: undefined }
      are_linked: { Args: { _a: string; _b: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role_type"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      is_verified_employee: { Args: { _user_id: string }; Returns: boolean }
      my_broker_employer_ids: { Args: { _user_id: string }; Returns: string[] }
      my_employer_ids: { Args: { _user_id: string }; Returns: string[] }
      notify_user: {
        Args: {
          _body?: string
          _link?: string
          _title: string
          _type: string
          _user_id: string
        }
        Returns: undefined
      }
      review_employee_termination: {
        Args: {
          _approve: boolean
          _id: string
          _make_available: boolean
          _note: string
        }
        Returns: undefined
      }
      review_profile_change: {
        Args: { _approve: boolean; _id: string; _note: string }
        Returns: undefined
      }
      review_termination: {
        Args: {
          _approve: boolean
          _id: string
          _make_available: boolean
          _note: string
        }
        Returns: undefined
      }
      set_worker_roster_status: {
        Args: { _status: string; _worker_id: string }
        Returns: undefined
      }
      spend_wallet: {
        Args: { _amount: number; _reason: string }
        Returns: number
      }
    }
    Enums: {
      app_role_type: "employee" | "employer" | "broker" | "admin" | "kyc"
      booking_status_type:
        | "pending"
        | "accepted"
        | "declined"
        | "completed"
        | "cancelled"
      gender_type: "male" | "female" | "other"
      sector_type:
        | "house_maid"
        | "baby_sitter"
        | "cleaner"
        | "waiter"
        | "construction_worker"
        | "paint_man"
        | "plumber"
        | "electrician"
        | "barber"
        | "makeup_artist"
        | "driver"
        | "delivery_man"
        | "barista"
        | "beauty_salon_worker_men"
        | "beauty_salon_worker_women"
        | "other"
      verification_status_type: "pending" | "approved" | "declined"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role_type: ["employee", "employer", "broker", "admin", "kyc"],
      booking_status_type: [
        "pending",
        "accepted",
        "declined",
        "completed",
        "cancelled",
      ],
      gender_type: ["male", "female", "other"],
      sector_type: [
        "house_maid",
        "baby_sitter",
        "cleaner",
        "waiter",
        "construction_worker",
        "paint_man",
        "plumber",
        "electrician",
        "barber",
        "makeup_artist",
        "driver",
        "delivery_man",
        "barista",
        "beauty_salon_worker_men",
        "beauty_salon_worker_women",
        "other",
      ],
      verification_status_type: ["pending", "approved", "declined"],
    },
  },
} as const
