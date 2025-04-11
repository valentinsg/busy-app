import { useState, useCallback } from 'react';
import { Task, TaskPriority } from '../types/task';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: 1,
      title: 'Review project proposal',
      description: 'Go through the latest project proposal and provide feedback',
      completed: true,
      due_date: new Date().toISOString(),
      scheduled_time: '10:00',
      priority: 'high',
      user_id: '1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 2,
      title: 'Team meeting',
      description: 'Weekly sync with the development team',
      completed: false,
      due_date: new Date().toISOString(),
      scheduled_time: '14:00',
      priority: 'medium',
      user_id: '1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]);

  const addTask = useCallback((
    title: string,
    description?: string,
    due_date?: string,
    scheduled_time?: string,
    priority: TaskPriority = 'medium'
  ) => {
    const newTask: Task = {
      id: tasks.length + 1,
      title,
      description,
      completed: false,
      due_date,
      scheduled_time,
      priority,
      user_id: '1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setTasks(prev => [...prev, newTask]);
  }, [tasks]);

  const updateTask = useCallback((
    id: number,
    updates: Partial<Task>
  ) => {
    setTasks(prev =>
      prev.map(task =>
        task.id === id
          ? { ...task, ...updates, updated_at: new Date().toISOString() }
          : task
      )
    );
  }, []);

  const toggleTask = useCallback((id: number) => {
    setTasks(prev =>
      prev.map(task =>
        task.id === id
          ? { ...task, completed: !task.completed, updated_at: new Date().toISOString() }
          : task
      )
    );
  }, []);

  const deleteTask = useCallback((id: number) => {
    setTasks(prev => prev.filter(task => task.id !== id));
  }, []);

  return {
    tasks,
    addTask,
    updateTask,
    toggleTask,
    deleteTask,
  };
}