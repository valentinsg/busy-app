import { useState, useCallback } from 'react';
import { JournalEntry } from '../types/supabase';

export function useJournal() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);

  const addEntry = useCallback((content: string, date: string = new Date().toISOString()) => {
    const newEntry: JournalEntry = {
      id: entries.length + 1,
      content,
      date,
      user_id: '1',
      created_at: new Date().toISOString(),
    };
    setEntries(prev => [...prev, newEntry]);
  }, [entries]);

  const getEntriesByDate = useCallback((date: string) => {
    return entries.filter(entry => {
      const entryDate = new Date(entry.date).toDateString();
      const targetDate = new Date(date).toDateString();
      return entryDate === targetDate;
    });
  }, [entries]);

  const updateEntry = useCallback((id: number, content: string) => {
    setEntries(prev =>
      prev.map(entry =>
        entry.id === id ? { ...entry, content } : entry
      )
    );
  }, []);

  const deleteEntry = useCallback((id: number) => {
    setEntries(prev => prev.filter(entry => entry.id !== id));
  }, []);

  return {
    entries,
    addEntry,
    getEntriesByDate,
    updateEntry,
    deleteEntry,
  };
}