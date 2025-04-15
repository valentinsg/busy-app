import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Database } from '../types/schema';

type JournalEntry = Database['public']['Tables']['journal_entries']['Row'];

export function useJournal() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);

  const fetchEntries = useCallback(async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', user.user.id)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching entries:', error);
        return;
      }

      setEntries(data || []);
    } catch (err) {
      console.error('Error in fetchEntries:', err);
    }
  }, []);

  const addEntry = useCallback(async (content: string, mood?: string, tags?: string[]) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      
      if (!user.user) {
        console.error('User not authenticated');
        return null;
      }
      
      // Ajustar la fecha para usar la zona horaria local
      const now = new Date();
      const today = new Date(now.getTime() - (now.getTimezoneOffset() * 60000))
        .toISOString()
        .split('T')[0];
      
      // Verificar el número de entradas para el día actual
      const { data: todayEntries, error: countError } = await supabase
        .from('journal_entries')
        .select('id')
        .eq('user_id', user.user.id)
        .eq('date', today);

      if (countError) {
        console.error('Error checking entries count:', countError);
        return null;
      }

      if (todayEntries && todayEntries.length >= 10) {
        throw new Error('LIMIT_REACHED');
      }
      
      const newEntry = {
        content,
        mood,
        tags,
        user_id: user.user.id,
        date: today,
      };

      const { data, error } = await supabase
        .from('journal_entries')
        .insert(newEntry)
        .select()
        .single();
        
      if (error) {
        console.error('Error adding entry:', error);
        
        if (error.code === '23503' && error.message.includes('foreign key constraint')) {
          console.error('User account not fully set up. Please contact support.');
        }
        
        return null;
      }
      
      // Actualizar el estado local inmediatamente
      setEntries(prevEntries => [data, ...prevEntries]);
      
      // Refrescar las entradas desde el servidor
      await fetchEntries();
      
      return data;
    } catch (err) {
      if (err instanceof Error && err.message === 'LIMIT_REACHED') {
        throw new Error('Has alcanzado el límite máximo de 10 entradas por día');
      }
      console.error('Unexpected error:', err);
      return null;
    }
  }, [fetchEntries]);
  
  const getEntriesByDate = useCallback(async (date: string) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return [];

      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', user.user.id)
        .eq('date', date);

      if (error) {
        console.error('Error fetching entries by date:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Error in getEntriesByDate:', err);
      return [];
    }
  }, []);

  const updateEntry = useCallback(async (id: string, content: string, mood?: string, tags?: string[]) => {
    try {
      const { data, error } = await supabase
        .from('journal_entries')
        .update({ content, mood, tags })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating entry:', error);
        return null;
      }

      // Actualizar el estado local inmediatamente
      setEntries(prevEntries => 
        prevEntries.map(entry => entry.id === id ? data : entry)
      );

      // Refrescar las entradas desde el servidor
      await fetchEntries();
      
      return data;
    } catch (err) {
      console.error('Error in updateEntry:', err);
      return null;
    }
  }, [fetchEntries]);

  const deleteEntry = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('journal_entries')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting entry:', error);
        return false;
      }

      // Actualizar el estado local inmediatamente
      setEntries(prevEntries => prevEntries.filter(entry => entry.id !== id));
      
      // Refrescar las entradas desde el servidor
      await fetchEntries();
      
      return true;
    } catch (err) {
      console.error('Error in deleteEntry:', err);
      return false;
    }
  }, [fetchEntries]);

  return {
    entries,
    fetchEntries,
    addEntry,
    getEntriesByDate,
    updateEntry,
    deleteEntry,
  };
}