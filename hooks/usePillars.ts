import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Pillar, Habit, Goal } from '../types/schema';

type NewPillar = Omit<Pillar, 'id' | 'created_at' | 'user_id'>;

export function usePillars() {
  const [pillars, setPillars] = useState<Pillar[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Cargar los pilares del usuario
  const fetchPillars = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data, error } = await supabase
        .from('pillars')
        .select('*')
        .eq('user_id', user.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setPillars(data || []);
    } catch (err) {
      console.error('Error al cargar pillares:', err);
      setError('No se pudieron cargar los pilares');
    } finally {
      setLoading(false);
    }
  }, []);

  // Crear un nuevo pilar
  const createPillar = useCallback(async (pillarData: NewPillar) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuario no autenticado');

      const newPillar = {
        ...pillarData,
        user_id: user.user.id
      };

      const { data, error } = await supabase
        .from('pillars')
        .insert(newPillar)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setPillars(prev => [data, ...prev]);
      return data;
    } catch (err) {
      console.error('Error al crear pilar:', err);
      setError('No se pudo crear el pilar');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Actualizar un pilar existente
  const updatePillar = useCallback(async (id: string, updates: Partial<Pillar>) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('pillars')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setPillars(prev => prev.map(pillar => pillar.id === id ? data : pillar));
      return data;
    } catch (err) {
      console.error('Error al actualizar pilar:', err);
      setError('No se pudo actualizar el pilar');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Eliminar un pilar
  const deletePillar = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      // Primero desasociar este pilar de hábitos y metas
      await supabase
        .from('habits')
        .update({ pillar_id: null })
        .eq('pillar_id', id);
        
      await supabase
        .from('goals')
        .update({ pillar_id: null })
        .eq('pillar_id', id);

      // Luego eliminar el pilar
      const { error } = await supabase
        .from('pillars')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      setPillars(prev => prev.filter(pillar => pillar.id !== id));
      return true;
    } catch (err) {
      console.error('Error al eliminar pilar:', err);
      setError('No se pudo eliminar el pilar');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Obtener hábitos asociados a un pilar
  const getPillarHabits = useCallback(async (pillarId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return [];

      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.user.id)
        .eq('pillar_id', pillarId)
        .eq('is_active', true);

      if (error) {
        throw error;
      }

      return data || [];
    } catch (err) {
      console.error('Error al cargar hábitos del pilar:', err);
      setError('No se pudieron cargar los hábitos del pilar');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Obtener metas asociadas a un pilar
  const getPillarGoals = useCallback(async (pillarId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return [];

      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.user.id)
        .eq('pillar_id', pillarId);

      if (error) {
        throw error;
      }

      return data || [];
    } catch (err) {
      console.error('Error al cargar metas del pilar:', err);
      setError('No se pudieron cargar las metas del pilar');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Asignar un hábito a un pilar
  const assignHabitToPillar = useCallback(async (habitId: string, pillarId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('habits')
        .update({ pillar_id: pillarId })
        .eq('id', habitId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (err) {
      console.error('Error al asignar hábito a pilar:', err);
      setError('No se pudo asignar el hábito al pilar');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Asignar una meta a un pilar
  const assignGoalToPillar = useCallback(async (goalId: string, pillarId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('goals')
        .update({ pillar_id: pillarId })
        .eq('id', goalId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (err) {
      console.error('Error al asignar meta a pilar:', err);
      setError('No se pudo asignar la meta al pilar');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Obtener estadísticas de balance entre pilares
  const getPillarStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Obtener todos los pilares
      await fetchPillars();
      
      // Para cada pilar, calcular sus estadísticas
      const statsPromises = pillars.map(async pillar => {
        // Obtener hábitos y metas para este pilar
        const habits = await getPillarHabits(pillar.id);
        const goals = await getPillarGoals(pillar.id);
        
        // Calcular actividad (simplemente contando elementos)
        const activityScore = habits.length + goals.length;
        
        // Calcular progreso de metas
        const goalProgress = goals.length > 0 
          ? goals.reduce((sum, goal) => sum + goal.progress, 0) / goals.length
          : 0;
        
        // Aquí podrías calcular otras métricas como la tasa de éxito de hábitos
        
        return {
          pillar,
          stats: {
            activityScore,
            goalProgress,
            habitsCount: habits.length,
            goalsCount: goals.length
          }
        };
      });
      
      return Promise.all(statsPromises);
    } catch (err) {
      console.error('Error al obtener estadísticas de pilares:', err);
      setError('No se pudieron obtener las estadísticas de pilares');
      return [];
    } finally {
      setLoading(false);
    }
  }, [fetchPillars, getPillarHabits, getPillarGoals, pillars]);

  // Cargar datos iniciales
  useEffect(() => {
    fetchPillars();
  }, [fetchPillars]);

  return {
    pillars,
    loading,
    error,
    fetchPillars,
    createPillar,
    updatePillar,
    deletePillar,
    getPillarHabits,
    getPillarGoals,
    assignHabitToPillar,
    assignGoalToPillar,
    getPillarStats
  };
} 