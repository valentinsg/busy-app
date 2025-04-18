export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Tipo para subtareas - será almacenado solo en memoria, no en la base de datos
export type SubTask = {
  id: string;
  title: string;
  completed: boolean;
};

export interface Database {
  public: {
    Tables: {
      journal_entries: {
        Row: {
          id: string
          user_id: string
          content: string
          mood: string | null
          tags: string[] | null
          created_at: string
          date: string
        }
        Insert: {
          id?: string
          user_id: string
          content: string
          mood?: string | null
          tags?: string[] | null
          created_at?: string
          date: string
        }
        Update: {
          id?: string
          user_id?: string
          content?: string
          mood?: string | null
          tags?: string[] | null
          created_at?: string
          date?: string
        }
      }
      profiles: {
        Row: {
          id: string
          created_at: string
          name: string | null
          email: string | null
          avatar_url: string | null
        }
        Insert: {
          id: string
          created_at?: string
          name?: string | null
          email?: string | null
          avatar_url?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          name?: string | null
          email?: string | null
          avatar_url?: string | null
        }
      }
      users: {
        Row: {
          id: string
          created_at: string
          email: string | null
          name: string | null
          avatar_url: string | null
        }
        Insert: {
          id: string
          created_at?: string
          email?: string | null
          name?: string | null
          avatar_url?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          email?: string | null
          name?: string | null
          avatar_url?: string | null
        }
      }
      tasks: {
        Row: {
          id: string
          created_at: string
          title: string
          description: string | null
          completed: boolean
          user_id: string
          priority: 'low' | 'medium' | 'high'
          category: 'work' | 'personal' | 'health' | 'other'
          due_date: string | null
          scheduled_time: string | null
          color: string | null
          tags: string[] | null
        }
        Insert: {
          id?: string
          created_at?: string
          title: string
          description?: string | null
          completed?: boolean
          user_id: string
          priority?: 'low' | 'medium' | 'high'
          category?: 'work' | 'personal' | 'health' | 'other'
          due_date?: string | null
          scheduled_time?: string | null
          color?: string | null
          tags?: string[] | null
        }
        Update: {
          id?: string
          created_at?: string
          title?: string
          description?: string | null
          completed?: boolean
          user_id?: string
          priority?: 'low' | 'medium' | 'high'
          category?: 'work' | 'personal' | 'health' | 'other'
          due_date?: string | null
          scheduled_time?: string | null
          color?: string | null
          tags?: string[] | null
        }
      }
      categories: {
        Row: {
          id: string
          created_at: string
          name: string
          user_id: string
        }
        Insert: {
          id: string
          created_at?: string
          name: string
          user_id: string
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          user_id?: string
        }
      }
      task_categories: {
        Row: {
          id: string
          created_at: string
          task_id: string
          category_id: string
        }
        Insert: {
          id: string
          created_at?: string
          task_id: string
          category_id: string
        }
        Update: {
          id?: string
          created_at?: string
          task_id?: string
          category_id?: string
        }
      }
      routines: {
        Row: {
          id: string
          created_at: string
          title: string
          description: string | null
          user_id: string
        }
        Insert: {
          id: string
          created_at?: string
          title: string
          description?: string | null
          user_id: string
        }
        Update: {
          id?: string
          created_at?: string
          title?: string
          description?: string | null
          user_id?: string
        }
      }
      habits: {
        Row: {
          id: string
          created_at: string
          title: string
          description: string | null
          frequency: string
          user_id: string
        }
        Insert: {
          id: string
          created_at?: string
          title: string
          description?: string | null
          frequency: string
          user_id: string
        }
        Update: {
          id?: string
          created_at?: string
          title?: string
          description?: string | null
          frequency?: string
          user_id?: string
        }
      }
      habit_logs: {
        Row: {
          id: string
          created_at: string
          habit_id: string
          completed: boolean
          date: string
        }
        Insert: {
          id: string
          created_at?: string
          habit_id: string
          completed: boolean
          date: string
        }
        Update: {
          id?: string
          created_at?: string
          habit_id?: string
          completed?: boolean
          date?: string
        }
      }
      notes: {
        Row: {
          id: string
          created_at: string
          title: string
          content: string
          user_id: string
        }
        Insert: {
          id: string
          created_at?: string
          title: string
          content: string
          user_id: string
        }
        Update: {
          id?: string
          created_at?: string
          title?: string
          content?: string
          user_id?: string
        }
      }
      tags: {
        Row: {
          id: string
          created_at: string
          name: string
          color: string
          user_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          color?: string
          user_id: string
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          color?: string
          user_id?: string
        }
      }
      task_tags: {
        Row: {
          task_id: string
          tag_id: string
        }
        Insert: {
          task_id: string
          tag_id: string
        }
        Update: {
          task_id?: string
          tag_id?: string
        }
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
