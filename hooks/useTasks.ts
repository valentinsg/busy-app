import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Database } from '../types/schema';

type Task = Database['public']['Tables']['tasks']['Row'];
type NewTask = Omit<Task, 'id' | 'user_id' | 'created_at'>;

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Suscribirse a cambios en la autenticación
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUserId(session.user.id);
        fetchTasks(session.user.id);
      } else {
        setUserId(null);
        setTasks([]);
      }
      setLoading(false);
    });

    // Obtener sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserId(session.user.id);
        fetchTasks(session.user.id);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Suscribirse a cambios en las tareas
  useEffect(() => {
    if (!userId) return;

    const tasksSubscription = supabase
      .channel('tasks_channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchTasks(userId);
        }
      )
      .subscribe();

    return () => {
      tasksSubscription.unsubscribe();
    };
  }, [userId]);

  const fetchTasks = async (user_id: string) => {
    try {
      console.log('Fetching tasks for user:', user_id);
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user_id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tasks:', error);
        return;
      }

      console.log('Tasks fetched:', data);
      setTasks(data || []);
    } catch (error) {
      console.error('Unexpected error fetching tasks:', error);
    }
  };

  const addTask = async (taskData: NewTask) => {
    if (!userId) {
      console.error('No user ID available');
      return;
    }

    try {
      console.log('Adding task:', { ...taskData, user_id: userId });
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          ...taskData,
          user_id: userId,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding task:', error);
        return;
      }

      console.log('Task added:', data);
      setTasks(prev => [data, ...prev]);
    } catch (error) {
      console.error('Unexpected error adding task:', error);
    }
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      console.log('Updating task:', taskId, updates);
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId)
        .select()
        .single();

      if (error) {
        console.error('Error updating task:', error);
        return;
      }

      console.log('Task updated:', data);
      setTasks(prev => prev.map(t => (t.id === taskId ? data : t)));
    } catch (error) {
      console.error('Unexpected error updating task:', error);
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      console.log('Deleting task:', taskId);
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) {
        console.error('Error deleting task:', error);
        return;
      }

      console.log('Task deleted:', taskId);
      setTasks(prev => prev.filter(t => t.id !== taskId));
    } catch (error) {
      console.error('Unexpected error deleting task:', error);
    }
  };

  const toggleTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    await updateTask(taskId, { completed: !task.completed });
  };

  const getTasksByCategory = (category: Task['category']) => {
    return tasks.filter(task => task.category === category);
  };

  const getTasksByPriority = (priority: Task['priority']) => {
    return tasks.filter(task => task.priority === priority);
  };

  const getTasksByTag = (tag: string) => {
    return tasks.filter(task => task.tags.includes(tag));
  };

  return {
    tasks,
    loading,
    addTask,
    updateTask,
    deleteTask,
    toggleTask,
    getTasksByCategory,
    getTasksByPriority,
    getTasksByTag,
  };
};
