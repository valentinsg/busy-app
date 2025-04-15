import { View, StyleSheet, Text, Switch } from 'react-native';
import { ArrowLeft, Bell, Moon, Lock, Globe, Info } from 'lucide-react-native';
import { AnimatedView } from '../components/AnimatedView';
import { Button } from '../components/Button';
import { router } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import { useState } from 'react';

export default function SettingsScreen() {
  const { isDark, toggleTheme } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [language, setLanguage] = useState('es');

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
      <AnimatedView animation="slide" style={styles.header}>
        <Button
          variant="secondary"
          title="Atrás"
          icon={<ArrowLeft size={24} color={isDark ? '#fff' : '#333'} />}
          onPress={() => router.back()}
        />
        <Text style={[styles.title, { color: isDark ? '#fff' : '#333' }]}>Configuración</Text>
      </AnimatedView>

      <AnimatedView animation="fade" delay={200} style={styles.section}>
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Moon size={24} color={isDark ? '#fff' : '#333'} />
            <Text style={[styles.settingText, { color: isDark ? '#fff' : '#333' }]}>Modo Oscuro</Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={isDark ? '#f5dd4b' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Bell size={24} color={isDark ? '#fff' : '#333'} />
            <Text style={[styles.settingText, { color: isDark ? '#fff' : '#333' }]}>Notificaciones</Text>
          </View>
          <Switch
            value={notifications}
            onValueChange={setNotifications}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={notifications ? '#f5dd4b' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Globe size={24} color={isDark ? '#fff' : '#333'} />
            <Text style={[styles.settingText, { color: isDark ? '#fff' : '#333' }]}>Idioma</Text>
          </View>
          <Text style={[styles.settingValue, { color: isDark ? '#999' : '#666' }]}>
            {language === 'es' ? 'Español' : 'English'}
          </Text>
        </View>

        <Button
          variant="secondary"
          title="Privacidad y Seguridad"
          icon={<Lock size={24} color={isDark ? '#fff' : '#333'} />}
          onPress={() => {}}
        />

        <Button
          variant="secondary"
          title="Acerca de"
          icon={<Info size={24} color={isDark ? '#fff' : '#333'} />}
          onPress={() => {}}
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  section: {
    padding: 20,
    gap: 20,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  settingText: {
    fontSize: 16,
  },
  settingValue: {
    fontSize: 16,
  },
}); 