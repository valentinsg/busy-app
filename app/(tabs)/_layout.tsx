import { supabase } from '@/lib/supabase';
import { router, Tabs } from 'expo-router';
import { Chrome as Home, SquareCheck as CheckSquare, BookOpen, User, Calendar } from 'lucide-react-native';
import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';

export default function TabLayout() {
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.replace('/login');
      }
    };

    checkSession();
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarStyle: {
          backgroundColor: '#f0f0f0',
          borderTopColor: '#555454',
          height: 60,
        },
        tabBarActiveTintColor: '#555454',
        tabBarInactiveTintColor: '#999',
        tabBarShowLabel: false,
        headerStyle: {
          backgroundColor: '#f0f0f0',
        },
        headerTintColor: '#555454',
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => (
            <View style={styles.homeIconContainer}>
              <Home size={size} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Tareas',
          tabBarIcon: ({ color, size }) => <CheckSquare size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendario',
          tabBarIcon: ({ color, size }) => <Calendar size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          title: 'Diario',
          tabBarIcon: ({ color, size }) => <BookOpen size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  homeIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#555454',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});