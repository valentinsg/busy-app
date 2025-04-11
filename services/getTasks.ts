import { supabase } from '../lib/supabase';
import { Database } from '../types/schema';

type Task = Database['public']['Tables']['tasks']['Row'];

export const getTasks = async (user_id: string): Promise<Task[]> => {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user_id)
    .order('due_date', { ascending: true });

  if (error) {
    console.error('Error al obtener tareas:', error.message);
    return [];
  }

  return data || [];
};
