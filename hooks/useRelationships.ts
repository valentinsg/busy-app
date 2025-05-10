import { useState, useCallback, useEffect } from 'react';
import { format, addDays, isAfter } from 'date-fns';
import { supabase } from '../lib/supabase';
import { Relationship } from '../types/schema';

type NewRelationship = Omit<Relationship, 'id' | 'created_at' | 'user_id'>;

export function useRelationships() {
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar relaciones
  const fetchRelationships = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data, error } = await supabase
        .from('relationships')
        .select('*')
        .eq('user_id', user.user.id)
        .order('name', { ascending: true });

      if (error) {
        throw error;
      }

      setRelationships(data || []);
    } catch (err) {
      console.error('Error al cargar relaciones:', err);
      setError('No se pudieron cargar las relaciones');
    } finally {
      setLoading(false);
    }
  }, []);

  // Crear una nueva relación
  const createRelationship = useCallback(async (relationshipData: NewRelationship) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuario no autenticado');

      const newRelationship = {
        ...relationshipData,
        user_id: user.user.id
      };

      const { data, error } = await supabase
        .from('relationships')
        .insert(newRelationship)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setRelationships(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      return data;
    } catch (err) {
      console.error('Error al crear relación:', err);
      setError('No se pudo crear la relación');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Actualizar una relación existente
  const updateRelationship = useCallback(async (id: string, updates: Partial<Relationship>) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('relationships')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setRelationships(prev => prev.map(rel => rel.id === id ? data : rel));
      return data;
    } catch (err) {
      console.error('Error al actualizar relación:', err);
      setError('No se pudo actualizar la relación');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Eliminar una relación
  const deleteRelationship = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('relationships')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      setRelationships(prev => prev.filter(rel => rel.id !== id));
      return true;
    } catch (err) {
      console.error('Error al eliminar relación:', err);
      setError('No se pudo eliminar la relación');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Registrar contacto con una relación
  const logContact = useCallback(async (id: string, notes?: string) => {
    try {
      const today = new Date();
      const formattedDate = format(today, 'yyyy-MM-dd');
      
      const updates: Partial<Relationship> = {
        last_contact: formattedDate
      };
      
      // Si se proporcionaron notas, agregarlas a las notas existentes
      if (notes) {
        const relationship = relationships.find(r => r.id === id);
        if (relationship) {
          const existingNotes = relationship.notes || '';
          const dateHeader = `\n[${format(today, 'dd/MM/yyyy')}] `;
          updates.notes = existingNotes + dateHeader + notes;
        }
      }
      
      return await updateRelationship(id, updates);
    } catch (err) {
      console.error('Error al registrar contacto:', err);
      setError('No se pudo registrar el contacto');
      return null;
    }
  }, [relationships, updateRelationship]);

  // Configurar un recordatorio para contactar a una relación
  const setReminder = useCallback(async (id: string, reminderDate: Date) => {
    try {
      const formattedDate = format(reminderDate, 'yyyy-MM-dd');
      
      const updates: Partial<Relationship> = {
        next_reminder: formattedDate
      };
      
      return await updateRelationship(id, updates);
    } catch (err) {
      console.error('Error al configurar recordatorio:', err);
      setError('No se pudo configurar el recordatorio');
      return null;
    }
  }, [updateRelationship]);

  // Añadir una idea de conexión
  const addConnectionIdea = useCallback(async (id: string, idea: string) => {
    try {
      const relationship = relationships.find(r => r.id === id);
      if (!relationship) throw new Error('Relación no encontrada');
      
      const existingIdeas = relationship.connection_ideas || [];
      
      // Asegurarse de que no haya duplicados
      if (!existingIdeas.includes(idea)) {
        const updates: Partial<Relationship> = {
          connection_ideas: [...existingIdeas, idea]
        };
        
        return await updateRelationship(id, updates);
      }
      
      return relationship;
    } catch (err) {
      console.error('Error al añadir idea de conexión:', err);
      setError('No se pudo añadir la idea de conexión');
      return null;
    }
  }, [relationships, updateRelationship]);

  // Eliminar una idea de conexión
  const removeConnectionIdea = useCallback(async (id: string, ideaToRemove: string) => {
    try {
      const relationship = relationships.find(r => r.id === id);
      if (!relationship) throw new Error('Relación no encontrada');
      
      const existingIdeas = relationship.connection_ideas || [];
      
      const updates: Partial<Relationship> = {
        connection_ideas: existingIdeas.filter(idea => idea !== ideaToRemove)
      };
      
      return await updateRelationship(id, updates);
    } catch (err) {
      console.error('Error al eliminar idea de conexión:', err);
      setError('No se pudo eliminar la idea de conexión');
      return null;
    }
  }, [relationships, updateRelationship]);

  // Obtener relaciones con recordatorios pendientes
  const getPendingReminders = useCallback(() => {
    const today = new Date();
    
    return relationships.filter(relationship => {
      if (!relationship.next_reminder) return false;
      
      const reminderDate = new Date(relationship.next_reminder);
      return isAfter(today, reminderDate) || format(today, 'yyyy-MM-dd') === format(reminderDate, 'yyyy-MM-dd');
    });
  }, [relationships]);

  // Obtener relaciones que no han tenido contacto reciente (más de 30 días)
  const getInactiveRelationships = useCallback((days = 30) => {
    const cutoffDate = addDays(new Date(), -days);
    
    return relationships.filter(relationship => {
      // Si nunca ha habido contacto, considerar inactiva
      if (!relationship.last_contact) return true;
      
      const lastContactDate = new Date(relationship.last_contact);
      return lastContactDate < cutoffDate;
    });
  }, [relationships]);

  // Cargar datos iniciales
  useEffect(() => {
    fetchRelationships();
  }, [fetchRelationships]);

  return {
    relationships,
    loading,
    error,
    fetchRelationships,
    createRelationship,
    updateRelationship,
    deleteRelationship,
    logContact,
    setReminder,
    addConnectionIdea,
    removeConnectionIdea,
    getPendingReminders,
    getInactiveRelationships
  };
} 