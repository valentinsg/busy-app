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

export type Database = {
  public: {
    Tables: {
      tasks: {
        Row: {
          id: string;
          created_at: string;
          title: string;
          description: string | null;
          completed: boolean;
          user_id: string;
          priority: 'low' | 'medium' | 'high';
          category: 'work' | 'personal' | 'health' | 'other';
          color: string;
          due_date: string | null;
          scheduled_time: string | null;
          tags: string[] | null;
        };
      };
      journal_entries: {
        Row: {
          id: string;
          created_at: string;
          content: string;
          mood: string | null;
          tags: string[] | null;
          date: string;
          user_id: string;
        };
      };
      habits: {
        Row: {
          id: string;
          created_at: string;
          user_id: string;
          name: string;
          description: string | null;
          frequency: 'daily' | 'weekly';
          color: string;
          is_active: boolean;
          pillar_id: string | null;
          goal_id: string | null;
        };
      };
      habit_completions: {
        Row: {
          id: string;
          created_at: string;
          habit_id: string;
          user_id: string;
          completion_date: string;
          notes: string | null;
        };
      };
      goals: {
        Row: {
          id: string;
          created_at: string;
          user_id: string;
          title: string;
          description: string | null;
          status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
          progress: number;
          due_date: string | null;
          color: string;
          pillar_id: string | null;
        };
      };
      goal_tasks: {
        Row: {
          id: string;
          created_at: string;
          goal_id: string;
          title: string;
          completed: boolean;
          due_date: string | null;
          order_index: number;
        };
      };
      pillars: {
        Row: {
          id: string;
          created_at: string;
          user_id: string;
          name: string;
          description: string | null;
          color: string;
          icon: string | null;
        };
      };
      focus_sessions: {
        Row: {
          id: string;
          created_at: string;
          user_id: string;
          start_time: string;
          end_time: string | null;
          duration_seconds: number | null;
          type: 'focus' | 'break' | 'long_break';
          notes: string | null;
          task_id: string | null;
        };
      };
      relationships: {
        Row: {
          id: string;
          created_at: string;
          user_id: string;
          name: string;
          type: string | null;
          contact_info: Record<string, any> | null;
          notes: string | null;
          important_dates: Record<string, any> | null;
          connection_ideas: string[] | null;
          last_contact: string | null;
          next_reminder: string | null;
        };
      };
      inspiration_items: {
        Row: {
          id: string;
          created_at: string;
          user_id: string;
          type: 'quote' | 'image' | 'audio';
          content: string;
          source: string | null;
          tags: string[] | null;
          is_favorite: boolean;
          storage_path: string | null;
        };
      };
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      habit_frequency: 'daily' | 'weekly';
      goal_status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
      session_type: 'focus' | 'break' | 'long_break';
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Task = Database['public']['Tables']['tasks']['Row'];
export type JournalEntry = Database['public']['Tables']['journal_entries']['Row'];
export type Habit = Database['public']['Tables']['habits']['Row'];
export type HabitCompletion = Database['public']['Tables']['habit_completions']['Row'];
export type Goal = Database['public']['Tables']['goals']['Row'];
export type GoalTask = Database['public']['Tables']['goal_tasks']['Row'];
export type Pillar = Database['public']['Tables']['pillars']['Row'];
export type FocusSession = Database['public']['Tables']['focus_sessions']['Row'];
export type Relationship = Database['public']['Tables']['relationships']['Row'];
export type InspirationItem = Database['public']['Tables']['inspiration_items']['Row'];

export type NewTask = Omit<Task, 'id' | 'created_at' | 'user_id'> & {
  subtasks?: SubTask[];
};
