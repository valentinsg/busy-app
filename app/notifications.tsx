import { View, StyleSheet, Text, Switch } from 'react-native';
import { ArrowLeft, Bell, Calendar, CheckSquare, BookOpen } from 'lucide-react-native';
import { AnimatedView } from '../components/AnimatedView';
import { Button } from '../components/Button';
import { router } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import { useState } from 'react';

export default function NotificationsScreen() {
  const { isDark } = useTheme();
  const [taskNotifications, setTaskNotifications] = useState(true);
  const [calendarNotifications, setCalendarNotifications] = useState(true);
  const [journalNotifications, setJournalNotifications] = useState(false);
  const [dailyReminders, setDailyReminders] = useState(true);

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
      <AnimatedView animation="slide" style={styles.header}>
        <Button
          variant="secondary"
          title="Atrás"
          icon={<ArrowLeft size={24} color={isDark ? '#fff' : '#333'} />}
          onPress={() => router.back()}
        />
        <Text style={[styles.title, { color: isDark ? '#fff' : '#333' }]}>Notificaciones</Text>
      </AnimatedView>

      <AnimatedView animation="fade" delay={200} style={styles.section}>
        <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#333' }]}>
          Tipos de Notificaciones
        </Text>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <CheckSquare size={24} color={isDark ? '#fff' : '#333'} />
            <Text style={[styles.settingText, { color: isDark ? '#fff' : '#333' }]}>
              Tareas Pendientes
            </Text>
          </View>
          <Switch
            value={taskNotifications}
            onValueChange={setTaskNotifications}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={taskNotifications ? '#f5dd4b' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Calendar size={24} color={isDark ? '#fff' : '#333'} />
            <Text style={[styles.settingText, { color: isDark ? '#fff' : '#333' }]}>
              Eventos del Calendario
            </Text>
          </View>
          <Switch
            value={calendarNotifications}
            onValueChange={setCalendarNotifications}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={calendarNotifications ? '#f5dd4b' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <BookOpen size={24} color={isDark ? '#fff' : '#333'} />
            <Text style={[styles.settingText, { color: isDark ? '#fff' : '#333' }]}>
              Recordatorios del Diario
            </Text>
          </View>
          <Switch
            value={journalNotifications}
            onValueChange={setJournalNotifications}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={journalNotifications ? '#f5dd4b' : '#f4f3f4'}
          />
        </View>

        <View style={styles.divider} />

        <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#333' }]}>
          Recordatorios Diarios
        </Text>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Bell size={24} color={isDark ? '#fff' : '#333'} />
            <Text style={[styles.settingText, { color: isDark ? '#fff' : '#333' }]}>
              Resumen Diario
            </Text>
          </View>
          <Switch
            value={dailyReminders}
            onValueChange={setDailyReminders}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={dailyReminders ? '#f5dd4b' : '#f4f3f4'}
          />
        </View>

        <Text style={[styles.description, { color: isDark ? '#999' : '#666' }]}>
          Recibe un resumen diario de tus tareas pendientes y eventos programados
        </Text>
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
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
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 20,
  },
  description: {
    fontSize: 14,
    marginTop: -10,
  },
}); 