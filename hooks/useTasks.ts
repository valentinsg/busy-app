import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Database } from '../types/schema';

type Task = Database['public']['Tables']['tasks']['Row'];
type NewTask = Database['public']['Tables']['tasks']['Insert'];

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Traer usuario actual
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUserId(data.user.id);
        fetchTasks(data.user.id);
      }
    };

    fetchUser();
  }, []);

  const fetchTasks = async (user_id: string) => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: true });

    if (error) console.error('Error cargando tareas:', error.message);
    else setTasks(data || []);
  };

  const addTask = async (title: string) => {
    if (!userId) return;

    const { data, error } = await supabase
      .from('tasks')
      .insert<NewTask>({
        id: crypto.randomUUID(),
        title,
        completed: false,
        user_id: userId,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creando tarea:', error.message);
    } else if (data) {
      setTasks(prev => [...prev, data]);
    }
  };

  const toggleTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const { data, error } = await supabase
      .from('tasks')
      .update({ completed: !task.completed })
      .eq('id', taskId)
      .select()
      .single();

    if (error) console.error('Error actualizando tarea:', error.message);
    else {
      setTasks(prev =>
        prev.map(t => (t.id === taskId ? { ...t, completed: !t.completed } : t))
      );
    }
  };

  const deleteTask = async (taskId: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', taskId);
    if (error) {
      console.error('Error eliminando tarea:', error.message);
    } else {
      setTasks(prev => prev.filter(t => t.id !== taskId));
    }
  };

  return {
    tasks,
    addTask,
    toggleTask,
    deleteTask,
  };
};
