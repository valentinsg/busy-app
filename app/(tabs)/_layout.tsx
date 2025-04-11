import { supabase } from '@/lib/supabase';
import { router, Tabs } from 'expo-router';
import { Chrome as Home, SquareCheck as CheckSquare, BookOpen, User } from 'lucide-react-native';
import { useEffect } from 'react';

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
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#f5f5f5',
        },
        tabBarActiveTintColor: '#333',
        tabBarInactiveTintColor: '#999',
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Tasks',
          tabBarIcon: ({ color, size }) => <CheckSquare size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          title: 'Journal',
          tabBarIcon: ({ color, size }) => <BookOpen size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}