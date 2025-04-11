import { Database } from './schema';

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T];

export interface User {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
}

export interface Task {
  id: number;
  title: string;
  completed: boolean;
  due_date: string | null;
  user_id: string;
  created_at: string;
}

export interface JournalEntry {
  id: number;
  content: string;
  date: string;
  user_id: string;
  created_at: string;
}