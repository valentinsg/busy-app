import { View, StyleSheet, Image, Text } from 'react-native';
import { Settings, Bell, Moon, LogOut, User } from 'lucide-react-native';
import { AnimatedView } from '../../components/AnimatedView';
import { Button } from '../../components/Button';
import { useAuth } from '../../hooks/useAuth';
import { router } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
      <AnimatedView animation="slide" style={styles.header}>
        <View style={styles.avatarContainer}>
          {user?.avatar_url ? (
            <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <User size={40} color="#666" />
            </View>
          )}
          <Text style={[styles.name, { color: isDark ? '#fff' : '#333' }]}>
            {user?.name || 'Usuario'}
          </Text>
          <Text style={[styles.email, { color: isDark ? '#999' : '#666' }]}>
            {user?.email || 'user@example.com'}
          </Text>
        </View>
      </AnimatedView>

      <AnimatedView animation="fade" delay={200} style={styles.section}>
        <Button
          variant="secondary"
          title="Configuración"
          icon={<Settings size={24} color={isDark ? '#fff' : '#333'} />}
          onPress={() => router.push('/settings')}
        />

        <Button
          variant="secondary"
          title="Notificaciones"
          icon={<Bell size={24} color={isDark ? '#fff' : '#333'} />}
          onPress={() => router.push('/notifications')}
        />

        <Button
          variant="secondary"
          title={isDark ? 'Modo Claro' : 'Modo Oscuro'}
          icon={<Moon size={24} color={isDark ? '#fff' : '#333'} />}
          onPress={toggleTheme}
        />
      </AnimatedView>

      <AnimatedView animation="slide" delay={400}>
        <Button
          variant="danger"
          title="Cerrar Sesión"
          icon={<LogOut size={24} color="#fff" />}
          onPress={async () => {
            await signOut();
            router.replace('/(auth)/login');
          }}
        />
      </AnimatedView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    alignItems: 'center',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  avatarPlaceholder: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
  },
  section: {
    padding: 20,
    gap: 12,
  },
});