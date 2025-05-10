import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Goal, GoalTask } from '../types/schema';

type NewGoal = Omit<Goal, 'id' | 'created_at' | 'user_id' | 'progress'> & {
  tasks?: Omit<GoalTask, 'id' | 'created_at' | 'goal_id'>[];
};

export function useGoals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [goalTasks, setGoalTasks] = useState<GoalTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar metas del usuario
  const fetchGoals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setGoals(data || []);
    } catch (err) {
      console.error('Error al cargar metas:', err);
      setError('No se pudieron cargar las metas');
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar tareas de metas
  const fetchGoalTasks = useCallback(async (goalId?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      let query = supabase
        .from('goal_tasks')
        .select('*')
        .order('order_index', { ascending: true });
      
      if (goalId) {
        query = query.eq('goal_id', goalId);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      setGoalTasks(data || []);
    } catch (err) {
      console.error('Error al cargar tareas de metas:', err);
      setError('No se pudieron cargar las tareas de metas');
    } finally {
      setLoading(false);
    }
  }, []);

  // Crear una nueva meta
  const createGoal = useCallback(async (goalData: NewGoal) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuario no autenticado');

      const newGoal = {
        title: goalData.title || '',
        description: goalData.description || '',
        status: goalData.status || 'pending',
        due_date: goalData.due_date || null,
        color: goalData.color || '#4ECDC4',
        pillar_id: goalData.pillar_id || null,
        progress: 0, 
        user_id: user.user.id
      };

      // Insertar la meta
      const { data, error: goalError } = await supabase
        .from('goals')
        .insert(newGoal)
        .select()
        .single();

      if (goalError) {
        throw goalError;
      }

      // Si hay tareas, insertarlas
      if (goalData.tasks && goalData.tasks.length > 0) {
        const tasksToInsert = goalData.tasks.map((task, index: number) => ({
          goal_id: data.id,
          title: task.title,
          completed: task.completed || false,
          due_date: task.due_date,
          order_index: index
        }));

        const { error: tasksError } = await supabase
          .from('goal_tasks')
          .insert(tasksToInsert);

        if (tasksError) {
          console.error('Error al insertar tareas:', tasksError);
        }

        // Cargar las tareas recién creadas
        await fetchGoalTasks(data.id);
      }

      // Actualizar estado local
      setGoals(prev => [data, ...prev]);
      
      return data;
    } catch (err) {
      console.error('Error al crear meta:', err);
      setError('No se pudo crear la meta');
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchGoalTasks]);

  // Actualizar una meta existente
  const updateGoal = useCallback(async (id: string, updates: Partial<Goal>) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('goals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setGoals(prev => prev.map(goal => goal.id === id ? data : goal));
      return data;
    } catch (err) {
      console.error('Error al actualizar meta:', err);
      setError('No se pudo actualizar la meta');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Eliminar una meta
  const deleteGoal = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      // Eliminar primero las tareas asociadas
      const { error: tasksError } = await supabase
        .from('goal_tasks')
        .delete()
        .eq('goal_id', id);

      if (tasksError) {
        console.error('Error al eliminar tareas:', tasksError);
      }

      // Luego eliminar la meta
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      // Actualizar estados locales
      setGoals(prev => prev.filter(goal => goal.id !== id));
      setGoalTasks(prev => prev.filter(task => task.goal_id !== id));
      
      return true;
    } catch (err) {
      console.error('Error al eliminar meta:', err);
      setError('No se pudo eliminar la meta');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Añadir una tarea a una meta
  const addGoalTask = useCallback(async (goalId: string, taskData: Omit<GoalTask, 'id' | 'created_at' | 'goal_id'>) => {
    try {
      setLoading(true);
      setError(null);

      // Obtener el último índice para ordenar correctamente
      const existingTasks = goalTasks.filter(t => t.goal_id === goalId);
      const lastIndex = existingTasks.length > 0 
        ? Math.max(...existingTasks.map(t => t.order_index)) + 1 
        : 0;

      const newTask = {
        goal_id: goalId,
        title: taskData.title,
        completed: taskData.completed || false,
        due_date: taskData.due_date,
        order_index: lastIndex
      };

      const { data, error } = await supabase
        .from('goal_tasks')
        .insert(newTask)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Actualizar estado local
      setGoalTasks(prev => [...prev, data]);
      
      // Recalcular el progreso de la meta
      await updateGoalProgress(goalId);
      
      return data;
    } catch (err) {
      console.error('Error al añadir tarea:', err);
      setError('No se pudo añadir la tarea');
      return null;
    } finally {
      setLoading(false);
    }
  }, [goalTasks]);

  // Actualizar una tarea
  const updateGoalTask = useCallback(async (taskId: string, updates: Partial<GoalTask>) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('goal_tasks')
        .update(updates)
        .eq('id', taskId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Actualizar estado local
      setGoalTasks(prev => prev.map(task => task.id === taskId ? data : task));
      
      // Recalcular el progreso de la meta
      await updateGoalProgress(data.goal_id);
      
      return data;
    } catch (err) {
      console.error('Error al actualizar tarea:', err);
      setError('No se pudo actualizar la tarea');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Eliminar una tarea
  const deleteGoalTask = useCallback(async (taskId: string) => {
    try {
      setLoading(true);
      setError(null);

      // Primero obtener la tarea para saber su meta
      const task = goalTasks.find(t => t.id === taskId);
      if (!task) throw new Error('Tarea no encontrada');

      const goalId = task.goal_id;

      const { error } = await supabase
        .from('goal_tasks')
        .delete()
        .eq('id', taskId);

      if (error) {
        throw error;
      }

      // Actualizar estado local
      setGoalTasks(prev => prev.filter(task => task.id !== taskId));
      
      // Recalcular el progreso de la meta
      await updateGoalProgress(goalId);
      
      return true;
    } catch (err) {
      console.error('Error al eliminar tarea:', err);
      setError('No se pudo eliminar la tarea');
      return false;
    } finally {
      setLoading(false);
    }
  }, [goalTasks]);

  // Marcar/desmarcar una tarea como completada
  const toggleGoalTask = useCallback(async (taskId: string) => {
    try {
      const task = goalTasks.find(t => t.id === taskId);
      if (!task) throw new Error('Tarea no encontrada');

      const updatedTask = await updateGoalTask(taskId, { completed: !task.completed });
      return updatedTask;
    } catch (err) {
      console.error('Error al alternar tarea:', err);
      setError('No se pudo alternar la tarea');
      return null;
    }
  }, [goalTasks, updateGoalTask]);

  // Recalcular el progreso de una meta basado en sus tareas
  const updateGoalProgress = useCallback(async (goalId: string) => {
    try {
      // Obtener todas las tareas para esta meta
      const goalTaskList = goalTasks.filter(t => t.goal_id === goalId);
      
      // Si no hay tareas, el progreso es 0
      if (goalTaskList.length === 0) {
        await updateGoal(goalId, { progress: 0 });
        return;
      }
      
      // Calcular el porcentaje completado
      const completedTasks = goalTaskList.filter(t => t.completed).length;
      const progressPercentage = Math.round((completedTasks / goalTaskList.length) * 100);
      
      // Actualizar el progreso en la base de datos
      await updateGoal(goalId, { progress: progressPercentage });
      
      // Si todas las tareas están completadas, marcar la meta como completada
      if (progressPercentage === 100) {
        await updateGoal(goalId, { status: 'completed' });
      } 
      // Si ninguna tarea está completada, la meta está pendiente
      else if (progressPercentage === 0) {
        await updateGoal(goalId, { status: 'pending' });
      } 
      // Si hay algunas tareas completadas, la meta está en progreso
      else {
        await updateGoal(goalId, { status: 'in_progress' });
      }
    } catch (err) {
      console.error('Error al actualizar progreso:', err);
      setError('No se pudo actualizar el progreso');
    }
  }, [goalTasks, updateGoal]);

  // Obtener metas con sus tareas
  const getGoalsWithTasks = useCallback(() => {
    return goals.map(goal => {
      const tasks = goalTasks.filter(task => task.goal_id === goal.id);
      return {
        ...goal,
        tasks
      };
    });
  }, [goals, goalTasks]);

  // Cargar datos iniciales
  useEffect(() => {
    fetchGoals();
    fetchGoalTasks();
  }, [fetchGoals, fetchGoalTasks]);

  return {
    goals,
    goalTasks,
    loading,
    error,
    fetchGoals,
    fetchGoalTasks,
    createGoal,
    updateGoal,
    deleteGoal,
    addGoalTask,
    updateGoalTask,
    deleteGoalTask,
    toggleGoalTask,
    updateGoalProgress,
    getGoalsWithTasks
  };
} 