export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: number;
  title: string;
  description?: string;
  completed: boolean;
  due_date?: string;
  scheduled_time?: string;
  priority: TaskPriority;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export const PRIORITY_COLORS = {
  low: '#4cd964',
  medium: '#ffcc00',
  high: '#ff4444',
};