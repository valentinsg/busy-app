import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Database } from '../types/schema';
import { SubTask } from '../types/schema';

// Funciones de fecha manuales
const formatYYYYMMDD = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const startOfDay = (date: Date): Date => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

const endOfDay = (date: Date): Date => {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
};

// Tipo de Task de la base de datos
type DatabaseTask = Database['public']['Tables']['tasks']['Row'];
// Extender Task con subtasks en memoria
type Task = DatabaseTask & { subtasks?: SubTask[] };
type NewTask = Omit<Task, 'id' | 'user_id' | 'created_at'>;

// Tipo para los filtros
type TaskFilter = {
  date?: Date;
  category?: Task['category'];
  priority?: Task['priority'];
  tag?: string;
  completed?: boolean;
};

// Tipo para los criterios de ordenamiento
type SortCriteria = 'dueDate' | 'priority' | 'createdAt' | 'title';

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeFilters, setActiveFilters] = useState<TaskFilter>({});
  const [sortBy, setSortBy] = useState<SortCriteria>('dueDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Suscribirse a cambios en la autenticación
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state change event:', event);
      if (session?.user) {
        console.log('Usuario autenticado:', session.user.id);
        setUserId(session.user.id);
        fetchTasks(session.user.id);
      } else {
        console.log('No hay usuario autenticado');
        setUserId(null);
        setTasks([]);
      }
      setLoading(false);
    });

    // Obtener sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Sesión inicial:', session);
      if (session?.user) {
        console.log('Usuario inicial:', session.user.id);
        setUserId(session.user.id);
        fetchTasks(session.user.id);
      } else {
        console.log('No hay sesión inicial');
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

      console.log('Tasks fetched:', data?.length || 0);
      console.log('Tasks data:', data);
      
      // Inicializar cada tarea con un array de subtasks vacío
      const tasksWithSubtasks = data?.map(task => ({
        ...task,
        subtasks: [] // Inicializar subtasks en memoria
      })) || [];
      
      setTasks(tasksWithSubtasks);
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
      // Asegúrate de que la fecha esté en el formato correcto
      console.log('Datos de tarea antes de guardar:', {
        ...taskData,
        user_id: userId,
        due_date: taskData.due_date ? new Date(taskData.due_date).toISOString() : null,
      });
      
      // Guardar una copia de subtasks antes de eliminarla
      const subtasks = taskData.subtasks || [];
      
      // Crear una copia del objeto sin subtasks para enviar a la base de datos
      const { subtasks: _, ...taskDataWithoutSubtasks } = taskData;
      
      // Extraer solo la parte de tiempo del ISO string para scheduled_time
      let scheduledTimeOnly = null;
      if (taskDataWithoutSubtasks.scheduled_time) {
        const timeDate = new Date(taskDataWithoutSubtasks.scheduled_time);
        scheduledTimeOnly = `${timeDate.getHours().toString().padStart(2, '0')}:${timeDate.getMinutes().toString().padStart(2, '0')}:${timeDate.getSeconds().toString().padStart(2, '0')}`;
      }
      
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          ...taskDataWithoutSubtasks,
          scheduled_time: scheduledTimeOnly, // Usar solo la parte de tiempo
          user_id: userId,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding task:', error);
        return;
      }

      // Agregar subtasks al objeto data para el estado local
      const taskWithSubtasks = {
        ...data,
        subtasks
      };

      console.log('Task added:', taskWithSubtasks);
      setTasks(prev => [taskWithSubtasks, ...prev]);
    } catch (error) {
      console.error('Unexpected error adding task:', error);
    }
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      console.log('Updating task:', taskId, updates);
      
      // Guardar una copia de subtasks antes de eliminarla
      const subtasks = updates.subtasks;
      
      // Crear una copia del objeto sin subtasks para enviar a la base de datos
      const { subtasks: _, ...updatesWithoutSubtasks } = updates;
      
      // Extraer solo la parte de tiempo del ISO string para scheduled_time si existe
      let scheduledTimeOnly = updatesWithoutSubtasks.scheduled_time;
      if (scheduledTimeOnly) {
        const timeDate = new Date(scheduledTimeOnly);
        scheduledTimeOnly = `${timeDate.getHours().toString().padStart(2, '0')}:${timeDate.getMinutes().toString().padStart(2, '0')}:${timeDate.getSeconds().toString().padStart(2, '0')}`;
      }
      
      const { data, error } = await supabase
        .from('tasks')
        .update({
          ...updatesWithoutSubtasks,
          scheduled_time: scheduledTimeOnly, // Usar solo la parte de tiempo
        })
        .eq('id', taskId)
        .select()
        .single();

      if (error) {
        console.error('Error updating task:', error);
        return;
      }

      // Si había subtasks en la actualización, incluirlas en el estado local
      const updatedData = subtasks ? {...data, subtasks} : data;
      
      console.log('Task updated:', updatedData);
      setTasks(prev => prev.map(t => (t.id === taskId ? updatedData : t)));
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

  // Añadir subtarea a una tarea (solo estado local)
  const addSubTask = async (taskId: string, subtaskTitle: string) => {
    setTasks(prevTasks => {
      return prevTasks.map(task => {
        if (task.id !== taskId) return task;
        
        const newSubtask: SubTask = {
          id: Date.now().toString(),
          title: subtaskTitle,
          completed: false
        };
        
        const subtasks = [...(task.subtasks || []), newSubtask];
        return {...task, subtasks};
      });
    });
    
    console.log('Subtask added locally to task:', taskId);
  };

  // Actualizar subtarea (solo estado local)
  const updateSubTask = async (taskId: string, subtaskId: string, updates: Partial<SubTask>) => {
    setTasks(prevTasks => {
      return prevTasks.map(task => {
        if (task.id !== taskId || !task.subtasks) return task;
        
        const updatedSubtasks = task.subtasks.map(subtask => 
          subtask.id === subtaskId ? {...subtask, ...updates} : subtask
        );
        
        return {...task, subtasks: updatedSubtasks};
      });
    });
    
    console.log('Subtask updated locally:', subtaskId);
  };

  // Eliminar subtarea (solo estado local)
  const deleteSubTask = async (taskId: string, subtaskId: string) => {
    setTasks(prevTasks => {
      return prevTasks.map(task => {
        if (task.id !== taskId || !task.subtasks) return task;
        
        const updatedSubtasks = task.subtasks.filter(subtask => 
          subtask.id !== subtaskId
        );
        
        return {...task, subtasks: updatedSubtasks};
      });
    });
    
    console.log('Subtask deleted locally:', subtaskId);
  };

  // Alternar estado completado de subtarea (solo estado local)
  const toggleSubTask = async (taskId: string, subtaskId: string) => {
    setTasks(prevTasks => {
      return prevTasks.map(task => {
        if (task.id !== taskId || !task.subtasks) return task;
        
        const updatedSubtasks = task.subtasks.map(subtask => {
          if (subtask.id === subtaskId) {
            return {...subtask, completed: !subtask.completed};
          }
          return subtask;
        });
        
        return {...task, subtasks: updatedSubtasks};
      });
    });
    
    console.log('Subtask toggled locally:', subtaskId);
  };

  // Funciones de filtrado
  const setFilter = (filter: TaskFilter) => {
    setActiveFilters(filter);
  };

  const clearFilters = () => {
    setActiveFilters({});
  };

  // Funciones de ordenamiento
  const setSorting = (criteria: SortCriteria, direction: 'asc' | 'desc' = 'asc') => {
    setSortBy(criteria);
    setSortDirection(direction);
  };

  // Obtener tareas filtradas y ordenadas
  const getFilteredAndSortedTasks = () => {
    console.log('Ejecutando getFilteredAndSortedTasks');
    console.log('Estado actual de activeFilters:', activeFilters);
    console.log('Total de tareas antes del filtrado:', tasks.length);
    
    // Si no hay tareas, devolver array vacío
    if (tasks.length === 0) {
      console.log('No hay tareas para mostrar');
      return [];
    }
    
    // Inicialmente, mostrar todas las tareas sin filtrar
    let filteredTasks = [...tasks];

    // Usar la función getTasksForDate para filtrar por la fecha seleccionada
    // Esto es más seguro que nuestro filtrado anterior
    filteredTasks = getTasksForDate(selectedDate);
    console.log('Tareas después de filtrar por selectedDate:', filteredTasks.length);

    if (activeFilters.category) {
      filteredTasks = filteredTasks.filter(task => task.category === activeFilters.category);
    }

    if (activeFilters.priority) {
      filteredTasks = filteredTasks.filter(task => task.priority === activeFilters.priority);
    }

    if (activeFilters.tag) {
      filteredTasks = filteredTasks.filter(task => 
        task.tags && task.tags.includes(activeFilters.tag!)
      );
    }

    if (activeFilters.completed !== undefined) {
      filteredTasks = filteredTasks.filter(task => task.completed === activeFilters.completed);
    }

    // Aplicar ordenamiento
    filteredTasks.sort((a, b) => {
      let compareResult = 0;

      switch (sortBy) {
        case 'dueDate':
          if (!a.due_date && !b.due_date) return 0;
          if (!a.due_date) return sortDirection === 'asc' ? 1 : -1;
          if (!b.due_date) return sortDirection === 'asc' ? -1 : 1;
          compareResult = new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
          break;
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          compareResult = 
            (priorityOrder[a.priority] || 0) - (priorityOrder[b.priority] || 0);
          break;
        case 'createdAt':
          compareResult = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'title':
          compareResult = a.title.localeCompare(b.title);
          break;
      }

      return sortDirection === 'asc' ? compareResult : -compareResult;
    });

    console.log('Tareas después de filtrar y ordenar:', filteredTasks.length);
    console.log('Tareas finales:', filteredTasks);
    return filteredTasks;
  };

  // Obtener tareas para una fecha específica
  const getTasksForDate = (date: Date) => {
    const dateStr = formatYYYYMMDD(date);
    console.log('getTasksForDate - buscando tareas para fecha:', dateStr);
    console.log('Total de tareas disponibles:', tasks.length);
    
    // Mostrar las primeras 10 tareas para debug
    if (tasks.length > 0) {
      console.log('Primeras tareas disponibles:');
      tasks.slice(0, Math.min(10, tasks.length)).forEach(task => {
        console.log(`Tarea: ${task.title}, due_date: ${task.due_date}`);
      });
    }
    
    const filteredTasks = tasks.filter(task => {
      if (!task.due_date) return false;
      
      // Extraer solo la parte de la fecha (YYYY-MM-DD)
      const taskDateStr = task.due_date.split('T')[0];
      const matches = taskDateStr === dateStr;
      
      console.log(`Tarea: ${task.title}, fecha: ${taskDateStr}, coincide con ${dateStr}: ${matches}`);
      return matches;
    });
    
    console.log('Tareas filtradas por fecha:', filteredTasks.length);
    return filteredTasks;
  };

  // Funciones para navegación por días
  const setDate = (date: Date) => {
    setSelectedDate(date);
  };

  const getTasksByCategory = (category: Task['category']) => {
    return tasks.filter(task => task.category === category);
  };

  const getTasksByPriority = (priority: Task['priority']) => {
    return tasks.filter(task => task.priority === priority);
  };

  const getTasksByTag = (tag: string) => {
    return tasks.filter(task => task.tags && task.tags.includes(tag));
  };

  return {
    tasks,
    loading,
    addTask,
    updateTask,
    deleteTask,
    toggleTask,
    addSubTask,
    updateSubTask,
    deleteSubTask,
    toggleSubTask,
    setFilter,
    clearFilters,
    setSorting,
    getFilteredAndSortedTasks,
    getTasksForDate,
    selectedDate,
    setDate,
    getTasksByCategory,
    getTasksByPriority,
    getTasksByTag,
  };
};
