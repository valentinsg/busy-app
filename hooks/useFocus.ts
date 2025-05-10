import { useState, useCallback, useEffect, useRef } from 'react';
import { format, addSeconds, differenceInSeconds } from 'date-fns';
import { supabase } from '../lib/supabase';
import { FocusSession } from '../types/schema';

// Duración predeterminada de cada tipo de sesión en segundos
const DEFAULT_DURATIONS = {
  focus: 25 * 60,       // 25 minutos
  break: 5 * 60,        // 5 minutos
  long_break: 15 * 60   // 15 minutos
};

type SessionState = 'idle' | 'running' | 'paused' | 'completed';
type SessionType = 'focus' | 'break' | 'long_break';

export function useFocus() {
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [currentSession, setCurrentSession] = useState<FocusSession | null>(null);
  const [sessionState, setSessionState] = useState<SessionState>('idle');
  const [timeRemaining, setTimeRemaining] = useState<number>(DEFAULT_DURATIONS.focus);
  const [currentType, setCurrentType] = useState<SessionType>('focus');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focusCount, setFocusCount] = useState(0);
  const [customTaskId, setCustomTaskId] = useState<string | null>(null);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Cargar las sesiones del usuario
  const fetchSessions = useCallback(async (limit = 20) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data, error } = await supabase
        .from('focus_sessions')
        .select('*')
        .eq('user_id', user.user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      setSessions(data || []);
    } catch (err) {
      console.error('Error al cargar sesiones:', err);
      setError('No se pudieron cargar las sesiones');
    } finally {
      setLoading(false);
    }
  }, []);

  // Iniciar una sesión
  const startSession = useCallback(async (type: SessionType = 'focus', taskId?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Detener el temporizador si está corriendo
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      // Si hay una sesión en curso, guardarla primero
      if (currentSession && sessionState === 'running') {
        await pauseSession();
      }
      
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuario no autenticado');

      const startTime = new Date();
      
      const newSession = {
        user_id: user.user.id,
        start_time: startTime.toISOString(),
        type,
        task_id: taskId || null
      };

      const { data, error } = await supabase
        .from('focus_sessions')
        .insert(newSession)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Configurar el temporizador
      setCurrentSession(data);
      setSessionState('running');
      setTimeRemaining(DEFAULT_DURATIONS[type]);
      setCurrentType(type);
      setCustomTaskId(taskId || null);
      
      // Actualizar contador de sesiones focus
      if (type === 'focus') {
        setFocusCount(prev => prev + 1);
      }
      
      // Iniciar el temporizador
      startTimer();
      
      return data;
    } catch (err) {
      console.error('Error al iniciar sesión:', err);
      setError('No se pudo iniciar la sesión');
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentSession, sessionState]);

  // Pausar la sesión actual
  const pauseSession = useCallback(async () => {
    try {
      if (!currentSession || sessionState !== 'running') return null;
      
      // Detener el temporizador
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      setSessionState('paused');
      
      return currentSession;
    } catch (err) {
      console.error('Error al pausar sesión:', err);
      setError('No se pudo pausar la sesión');
      return null;
    }
  }, [currentSession, sessionState]);

  // Reanudar la sesión
  const resumeSession = useCallback(() => {
    if (!currentSession || sessionState !== 'paused') return;
    
    setSessionState('running');
    startTimer();
  }, [currentSession, sessionState]);

  // Completar la sesión actual
  const completeSession = useCallback(async () => {
    try {
      if (!currentSession) return null;
      
      // Detener el temporizador
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      const endTime = new Date();
      const startTime = new Date(currentSession.start_time);
      const durationSeconds = differenceInSeconds(endTime, startTime);
      
      const updates = {
        end_time: endTime.toISOString(),
        duration_seconds: durationSeconds
      };

      const { data, error } = await supabase
        .from('focus_sessions')
        .update(updates)
        .eq('id', currentSession.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Actualizar la lista de sesiones
      setSessions(prev => [data, ...prev.filter(s => s.id !== data.id)]);
      
      // Reiniciar el estado
      setSessionState('completed');
      setCurrentSession(null);
      
      // Sugerir iniciar la siguiente sesión adecuada
      if (currentType === 'focus') {
        // Después de 4 sesiones de focus, sugerir un descanso largo
        if (focusCount % 4 === 0) {
          setCurrentType('long_break');
          setTimeRemaining(DEFAULT_DURATIONS.long_break);
        } else {
          setCurrentType('break');
          setTimeRemaining(DEFAULT_DURATIONS.break);
        }
      } else {
        // Después de un descanso, volver a focus
        setCurrentType('focus');
        setTimeRemaining(DEFAULT_DURATIONS.focus);
      }
      
      return data;
    } catch (err) {
      console.error('Error al completar sesión:', err);
      setError('No se pudo completar la sesión');
      return null;
    }
  }, [currentSession, currentType, focusCount]);

  // Cancelar la sesión actual
  const cancelSession = useCallback(async () => {
    try {
      if (!currentSession) return false;
      
      // Detener el temporizador
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      // Eliminar la sesión de la base de datos
      const { error } = await supabase
        .from('focus_sessions')
        .delete()
        .eq('id', currentSession.id);

      if (error) {
        throw error;
      }

      // Actualizar la lista de sesiones
      setSessions(prev => prev.filter(s => s.id !== currentSession.id));
      
      // Reiniciar el estado
      setSessionState('idle');
      setCurrentSession(null);
      setTimeRemaining(DEFAULT_DURATIONS[currentType]);
      
      // Si era una sesión focus, restar del contador
      if (currentType === 'focus') {
        setFocusCount(prev => Math.max(0, prev - 1));
      }
      
      return true;
    } catch (err) {
      console.error('Error al cancelar sesión:', err);
      setError('No se pudo cancelar la sesión');
      return false;
    }
  }, [currentSession, currentType]);

  // Añadir una nota a la sesión actual
  const addSessionNote = useCallback(async (note: string) => {
    try {
      if (!currentSession) return null;
      
      const { data, error } = await supabase
        .from('focus_sessions')
        .update({ notes: note })
        .eq('id', currentSession.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setCurrentSession(data);
      return data;
    } catch (err) {
      console.error('Error al añadir nota:', err);
      setError('No se pudo añadir la nota');
      return null;
    }
  }, [currentSession]);

  // Obtener estadísticas de sesiones por período
  const getSessionStats = useCallback(async (days = 7) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return null;

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const { data, error } = await supabase
        .from('focus_sessions')
        .select('*')
        .eq('user_id', user.user.id)
        .eq('type', 'focus')
        .gte('start_time', startDate.toISOString())
        .not('duration_seconds', 'is', null);

      if (error) {
        throw error;
      }

      // Calcular tiempo total
      const totalSeconds = data.reduce((sum, session) => {
        return sum + (session.duration_seconds || 0);
      }, 0);
      
      // Calcular sesiones completadas
      const completedSessions = data.length;
      
      // Calcular promedio por día
      const avgSecondsPerDay = totalSeconds / days;
      
      return {
        totalSeconds,
        totalMinutes: Math.floor(totalSeconds / 60),
        totalHours: Math.floor(totalSeconds / 3600),
        completedSessions,
        avgSecondsPerDay,
        avgMinutesPerDay: Math.floor(avgSecondsPerDay / 60),
        sessionsData: data
      };
    } catch (err) {
      console.error('Error al obtener estadísticas:', err);
      setError('No se pudieron obtener las estadísticas');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Iniciar el temporizador
  const startTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        // Si llegamos a cero, completar la sesión
        if (prev <= 1) {
          completeSession();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [completeSession]);

  // Cambiar la duración de la sesión actual
  const setSessionDuration = useCallback((seconds: number) => {
    if (sessionState === 'idle' || sessionState === 'paused') {
      setTimeRemaining(seconds);
    }
  }, [sessionState]);

  // Limpiar el temporizador cuando el componente se desmonte
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);
  
  // Cargar las sesiones al inicio
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Formatear el tiempo restante como minutos:segundos
  const formattedTimeRemaining = useCallback(() => {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [timeRemaining]);

  return {
    sessions,
    currentSession,
    sessionState,
    timeRemaining,
    currentType,
    loading,
    error,
    focusCount,
    customTaskId,
    formattedTimeRemaining,
    fetchSessions,
    startSession,
    pauseSession,
    resumeSession,
    completeSession,
    cancelSession,
    addSessionNote,
    getSessionStats,
    setSessionDuration
  };
} 