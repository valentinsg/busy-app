import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { InspirationItem } from '../types/schema';

type NewInspirationItem = Omit<InspirationItem, 'id' | 'created_at' | 'user_id'>;

export function useInspiration() {
  const [inspirationItems, setInspirationItems] = useState<InspirationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar ítems de inspiración
  const fetchInspirationItems = useCallback(async (limit = 50) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data, error } = await supabase
        .from('inspiration_items')
        .select('*')
        .eq('user_id', user.user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      setInspirationItems(data || []);
    } catch (err) {
      console.error('Error al cargar ítems de inspiración:', err);
      setError('No se pudieron cargar los ítems de inspiración');
    } finally {
      setLoading(false);
    }
  }, []);

  // Crear un nuevo ítem de inspiración
  const createInspirationItem = useCallback(async (itemData: NewInspirationItem) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuario no autenticado');

      const newItem = {
        ...itemData,
        user_id: user.user.id
      };

      const { data, error } = await supabase
        .from('inspiration_items')
        .insert(newItem)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setInspirationItems(prev => [data, ...prev]);
      return data;
    } catch (err) {
      console.error('Error al crear ítem de inspiración:', err);
      setError('No se pudo crear el ítem de inspiración');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Actualizar un ítem de inspiración existente
  const updateInspirationItem = useCallback(async (id: string, updates: Partial<InspirationItem>) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('inspiration_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setInspirationItems(prev => prev.map(item => item.id === id ? data : item));
      return data;
    } catch (err) {
      console.error('Error al actualizar ítem de inspiración:', err);
      setError('No se pudo actualizar el ítem de inspiración');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Eliminar un ítem de inspiración
  const deleteInspirationItem = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      // Obtener el ítem para ver si tiene un storage_path
      const item = inspirationItems.find(item => item.id === id);
      
      // Si hay un archivo en storage, eliminarlo primero
      if (item?.storage_path) {
        const { error: storageError } = await supabase.storage
          .from('inspiration')
          .remove([item.storage_path]);
          
        if (storageError) {
          console.error('Error al eliminar archivo:', storageError);
        }
      }

      const { error } = await supabase
        .from('inspiration_items')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      setInspirationItems(prev => prev.filter(item => item.id !== id));
      return true;
    } catch (err) {
      console.error('Error al eliminar ítem de inspiración:', err);
      setError('No se pudo eliminar el ítem de inspiración');
      return false;
    } finally {
      setLoading(false);
    }
  }, [inspirationItems]);

  // Marcar/desmarcar un ítem como favorito
  const toggleFavorite = useCallback(async (id: string) => {
    try {
      const item = inspirationItems.find(i => i.id === id);
      if (!item) throw new Error('Ítem no encontrado');
      
      return await updateInspirationItem(id, { is_favorite: !item.is_favorite });
    } catch (err) {
      console.error('Error al marcar favorito:', err);
      setError('No se pudo marcar como favorito');
      return null;
    }
  }, [inspirationItems, updateInspirationItem]);

  // Añadir una etiqueta a un ítem
  const addTag = useCallback(async (id: string, newTag: string) => {
    try {
      const item = inspirationItems.find(i => i.id === id);
      if (!item) throw new Error('Ítem no encontrado');
      
      const existingTags = item.tags || [];
      
      // Evitar duplicados
      if (!existingTags.includes(newTag)) {
        return await updateInspirationItem(id, { 
          tags: [...existingTags, newTag] 
        });
      }
      
      return item;
    } catch (err) {
      console.error('Error al añadir etiqueta:', err);
      setError('No se pudo añadir la etiqueta');
      return null;
    }
  }, [inspirationItems, updateInspirationItem]);

  // Eliminar una etiqueta de un ítem
  const removeTag = useCallback(async (id: string, tagToRemove: string) => {
    try {
      const item = inspirationItems.find(i => i.id === id);
      if (!item) throw new Error('Ítem no encontrado');
      
      const existingTags = item.tags || [];
      
      return await updateInspirationItem(id, { 
        tags: existingTags.filter(tag => tag !== tagToRemove) 
      });
    } catch (err) {
      console.error('Error al eliminar etiqueta:', err);
      setError('No se pudo eliminar la etiqueta');
      return null;
    }
  }, [inspirationItems, updateInspirationItem]);

  // Subir un archivo (imagen o audio) para un ítem
  const uploadFile = useCallback(async (file: File, type: 'image' | 'audio') => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuario no autenticado');
      
      // Generar un nombre único
      const fileExt = file.name.split('.').pop();
      const fileName = `${type}_${Date.now()}.${fileExt}`;
      const filePath = `${user.user.id}/${fileName}`;
      
      // Subir el archivo
      const { error: uploadError } = await supabase.storage
        .from('inspiration')
        .upload(filePath, file);
        
      if (uploadError) {
        throw uploadError;
      }
      
      // Obtener URL pública
      const { data } = supabase.storage
        .from('inspiration')
        .getPublicUrl(filePath);
      
      return {
        url: data.publicUrl,
        path: filePath
      };
    } catch (err) {
      console.error('Error al subir archivo:', err);
      setError('No se pudo subir el archivo');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Buscar ítems por etiquetas
  const searchByTags = useCallback((tags: string[]) => {
    if (!tags.length) return inspirationItems;
    
    return inspirationItems.filter(item => {
      const itemTags = item.tags || [];
      return tags.some(tag => itemTags.includes(tag));
    });
  }, [inspirationItems]);

  // Obtener todos los ítems favoritos
  const getFavorites = useCallback(() => {
    return inspirationItems.filter(item => item.is_favorite);
  }, [inspirationItems]);

  // Obtener todas las etiquetas únicas
  const getAllTags = useCallback(() => {
    const tagsSet = new Set<string>();
    
    inspirationItems.forEach(item => {
      const itemTags = item.tags || [];
      itemTags.forEach(tag => tagsSet.add(tag));
    });
    
    return Array.from(tagsSet).sort();
  }, [inspirationItems]);

  // Cargar datos iniciales
  useEffect(() => {
    fetchInspirationItems();
  }, [fetchInspirationItems]);

  return {
    inspirationItems,
    loading,
    error,
    fetchInspirationItems,
    createInspirationItem,
    updateInspirationItem,
    deleteInspirationItem,
    toggleFavorite,
    addTag,
    removeTag,
    uploadFile,
    searchByTags,
    getFavorites,
    getAllTags
  };
} 