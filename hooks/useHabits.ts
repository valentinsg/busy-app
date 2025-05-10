import { useState, useCallback, useEffect } from 'react';
import { addDays, format, isThisWeek, startOfWeek, endOfWeek } from 'date-fns';
import { supabase } from '../lib/supabase';
import { Habit, HabitCompletion } from '../types/schema';

type NewHabit = Omit<Habit, 'id' | 'created_at' | 'user_id' | 'is_active'>;

export function useHabits() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar hábitos del usuario
  const fetchHabits = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setHabits(data || []);
    } catch (err) {
      console.error('Error al cargar hábitos:', err);
      setError('No se pudieron cargar los hábitos');
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar completados de hábitos
  const fetchCompletions = useCallback(async (startDate?: Date, endDate?: Date) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      let query = supabase
        .from('habit_completions')
        .select('*')
        .eq('user_id', user.user.id);
      
      if (startDate && endDate) {
        const formattedStart = format(startDate, 'yyyy-MM-dd');
        const formattedEnd = format(endDate, 'yyyy-MM-dd');
        
        query = query
          .gte('completion_date', formattedStart)
          .lte('completion_date', formattedEnd);
      }

      const { data, error } = await query.order('completion_date', { ascending: false });

      if (error) {
        throw error;
      }

      setCompletions(data || []);
    } catch (err) {
      console.error('Error al cargar completados:', err);
      setError('No se pudieron cargar los completados de hábitos');
    } finally {
      setLoading(false);
    }
  }, []);

  // Obtener completados para el rango de fechas actual (hoy para diarios, esta semana para semanales)
  const fetchCurrentCompletions = useCallback(async () => {
    const now = new Date();
    const weekStart = startOfWeek(now);
    const weekEnd = endOfWeek(now);
    
    await fetchCompletions(weekStart, weekEnd);
  }, [fetchCompletions]);

  // Crear un nuevo hábito
  const createHabit = useCallback(async (habitData: NewHabit) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuario no autenticado');

      const newHabit = {
        ...habitData,
        user_id: user.user.id,
        is_active: true
      };

      const { data, error } = await supabase
        .from('habits')
        .insert(newHabit)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setHabits(prev => [data, ...prev]);
      return data;
    } catch (err) {
      console.error('Error al crear hábito:', err);
      setError('No se pudo crear el hábito');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Actualizar un hábito existente
  const updateHabit = useCallback(async (id: string, updates: Partial<Habit>) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('habits')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setHabits(prev => prev.map(habit => habit.id === id ? data : habit));
      return data;
    } catch (err) {
      console.error('Error al actualizar hábito:', err);
      setError('No se pudo actualizar el hábito');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Eliminar un hábito (marcar como inactivo)
  const deleteHabit = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const updates = { is_active: false };
      
      const { error } = await supabase
        .from('habits')
        .update(updates)
        .eq('id', id);

      if (error) {
        throw error;
      }

      setHabits(prev => prev.filter(habit => habit.id !== id));
      return true;
    } catch (err) {
      console.error('Error al eliminar hábito:', err);
      setError('No se pudo eliminar el hábito');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Marcar un hábito como completado para una fecha específica
  const markHabitComplete = useCallback(async (habitId: string, date = new Date(), notes?: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuario no autenticado');

      const formattedDate = format(date, 'yyyy-MM-dd');

      // Verificar si ya existe un registro para esta fecha
      const { data: existing } = await supabase
        .from('habit_completions')
        .select('*')
        .eq('habit_id', habitId)
        .eq('completion_date', formattedDate)
        .single();

      // Si ya existe, no hacemos nada (o podríamos actualizar las notas)
      if (existing) {
        return existing;
      }

      const newCompletion = {
        habit_id: habitId,
        user_id: user.user.id,
        completion_date: formattedDate,
        notes: notes || null
      };

      const { data, error } = await supabase
        .from('habit_completions')
        .insert(newCompletion)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Actualizar el estado local
      setCompletions(prev => [data, ...prev]);
      
      return data;
    } catch (err) {
      console.error('Error al marcar hábito como completado:', err);
      setError('No se pudo marcar el hábito como completado');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Eliminar el registro de completado de un hábito
  const unmarkHabitComplete = useCallback(async (habitId: string, date = new Date()) => {
    try {
      setLoading(true);
      setError(null);

      const formattedDate = format(date, 'yyyy-MM-dd');

      const { error } = await supabase
        .from('habit_completions')
        .delete()
        .eq('habit_id', habitId)
        .eq('completion_date', formattedDate);

      if (error) {
        throw error;
      }

      // Actualizar el estado local
      setCompletions(prev => prev.filter(
        comp => !(comp.habit_id === habitId && comp.completion_date === formattedDate)
      ));
      
      return true;
    } catch (err) {
      console.error('Error al desmarcar hábito:', err);
      setError('No se pudo desmarcar el hábito');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Verificar si un hábito está completado para una fecha específica
  const isHabitCompletedOnDate = useCallback((habitId: string, date = new Date()) => {
    const formattedDate = format(date, 'yyyy-MM-dd');
    return completions.some(
      comp => comp.habit_id === habitId && comp.completion_date === formattedDate
    );
  }, [completions]);

  // Calcular la tasa de éxito para un período (últimos 7 días, último mes, etc.)
  const getHabitSuccessRate = useCallback((habitId: string, days = 7) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return 0;

    const today = new Date();
    const startDate = addDays(today, -days);
    
    // Filtrar completados para este hábito en el rango de fechas
    const habitCompletions = completions.filter(comp => {
      if (comp.habit_id !== habitId) return false;
      
      const compDate = new Date(comp.completion_date);
      return compDate >= startDate && compDate <= today;
    });

    // Para hábitos diarios, cada día cuenta
    if (habit.frequency === 'daily') {
      return (habitCompletions.length / days) * 100;
    } 
    // Para hábitos semanales, contar semanas
    else if (habit.frequency === 'weekly') {
      // Para simplificar, consideramos "exitoso" si se completó al menos una vez esta semana
      const thisWeekCompleted = habitCompletions.some(comp => {
        const compDate = new Date(comp.completion_date);
        return isThisWeek(compDate);
      });
      
      return thisWeekCompleted ? 100 : 0;
    }
    
    return 0;
  }, [habits, completions]);

  // Obtener hábitos con su estado actual
  const getHabitsWithStatus = useCallback(() => {
    return habits.map(habit => {
      const isCompleted = isHabitCompletedOnDate(habit.id);
      const successRate = getHabitSuccessRate(habit.id);
      
      return {
        ...habit,
        isCompleted,
        successRate
      };
    });
  }, [habits, isHabitCompletedOnDate, getHabitSuccessRate]);

  // Calcular los días en un rango que tienen completados para un hábito
  const getCompletedDatesForHabit = useCallback((habitId: string, startDate: Date, endDate: Date) => {
    const completedDates: string[] = [];
    
    completions.forEach(comp => {
      if (comp.habit_id === habitId) {
        const compDate = new Date(comp.completion_date);
        if (compDate >= startDate && compDate <= endDate) {
          completedDates.push(comp.completion_date);
        }
      }
    });
    
    return completedDates;
  }, [completions]);

  // Cargar datos iniciales
  useEffect(() => {
    fetchHabits();
    fetchCurrentCompletions();
  }, [fetchHabits, fetchCurrentCompletions]);

  return {
    habits,
    completions,
    loading,
    error,
    fetchHabits,
    fetchCompletions,
    fetchCurrentCompletions,
    createHabit,
    updateHabit,
    deleteHabit,
    markHabitComplete,
    unmarkHabitComplete,
    isHabitCompletedOnDate,
    getHabitSuccessRate,
    getHabitsWithStatus,
    getCompletedDatesForHabit
  };
} 