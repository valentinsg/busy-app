import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

interface AuthUser extends User {
  name?: string;
  email?: string;
  avatar_url?: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Cargar sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserWithMetadata(session?.user || null);
      setLoading(false);
    });

    // Escuchar cambios
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserWithMetadata(session?.user || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const setUserWithMetadata = (userData: User | null) => {
    if (userData) {
      const enriched = {
        ...userData,
        name: userData.user_metadata?.name || '',
        email: userData.email || '',
        avatar_url: userData.user_metadata?.avatar_url || ''
      };
      setUser(enriched);
    } else {
      setUser(null);
    }
  };

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      if (error.message.includes('User already registered')) {
        throw new Error('Este email ya está registrado');
      }
      throw error;
    }

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;

    const newUser = userData.user;
    if (newUser) {
      await supabase.from('users').insert({
        id: newUser.id,
        email: newUser.email,
        name: null,
        avatar_url: null,
      });
    }
  };


  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
  };
  return {
    user,
    loading,
    signUp,
    signIn,
    signOut,
  };
};
