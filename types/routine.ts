export interface RoutineStep {
  id: number;
  title: string;
  description: string;
  duration: number; // in minutes
  completed: boolean;
  order: number;
}

export interface MorningRoutine {
  id: number;
  name: string;
  steps: RoutineStep[];
  total_duration: number;
  user_id: string;
  created_at: string;
  updated_at: string;
}