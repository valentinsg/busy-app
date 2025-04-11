import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

// Se eliminó la importación de Database para evitar el error de módulo no encontrado
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Se eliminó el tipo Database para evitar el error de módulo no encontrado
export const supabase = createClient(supabaseUrl, supabaseAnonKey);