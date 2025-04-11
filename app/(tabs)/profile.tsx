import { View, StyleSheet } from 'react-native';
import { Settings, Bell, Moon, LogOut } from 'lucide-react-native';
import { AnimatedView } from '../../components/AnimatedView';
import { Button } from '../../components/Button';
import { useAuth } from '../../hooks/useAuth';
import { router } from 'expo-router';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();

  return (
    <View style={styles.container}>
      <AnimatedView animation="slide" style={styles.header}>
        <Button
          variant="secondary"
          title={user?.email || 'user@example.com'}
          icon={<Settings size={24} color="#333" />}
          onPress={() => { }}
        />
      </AnimatedView>

      <AnimatedView animation="fade" delay={200} style={styles.section}>
        <Button
          variant="secondary"
          title="Settings"
          icon={<Settings size={24} color="#333" />}
          onPress={() => { }}
        />

        <Button
          variant="secondary"
          title="Notifications"
          icon={<Bell size={24} color="#333" />}
          onPress={() => { }}
        />

        <Button
          variant="secondary"
          title="Dark Mode"
          icon={<Moon size={24} color="#333" />}
          onPress={() => { }}
        />
      </AnimatedView>

      <AnimatedView animation="slide" delay={400}>
        <Button
          variant="danger"
          title="Logout"
          icon={<LogOut size={24} color="#fff" />}
          onPress={async () => {
            await signOut();
            router.replace('/(auth)/login'); // o a donde sea tu login
          }}
        />
      </AnimatedView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#f5f5f5',
  },
  section: {
    padding: 20,
    gap: 12,
  },
});