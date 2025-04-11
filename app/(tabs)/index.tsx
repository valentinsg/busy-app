import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Play, CircleCheck as CheckCircle2, Sunrise } from 'lucide-react-native';
import { AnimatedView } from '../../components/AnimatedView';
import { useTasks } from '../../hooks/useTasks';

export default function HomeScreen() {
  const { tasks, toggleTask } = useTasks();
  
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <ScrollView style={styles.container}>
      <AnimatedView animation="slide" style={styles.header}>
        <Text style={styles.greeting}>Good morning, User!</Text>
        <Text style={styles.date}>{today}</Text>
      </AnimatedView>

      <AnimatedView animation="scale" delay={200}>
        <TouchableOpacity style={styles.flowButton}>
          <Play size={24} color="#fff" />
          <Text style={styles.flowButtonText}>Start Busy Flow</Text>
        </TouchableOpacity>
      </AnimatedView>

      <AnimatedView animation="fade" delay={400} style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Tasks</Text>
        {tasks.map(task => (
          <TouchableOpacity
            key={task.id}
            style={styles.task}
            onPress={() => toggleTask(task.id)}>
            <CheckCircle2
              size={24}
              color={task.completed ? '#333' : '#999'}
              style={styles.taskIcon}
            />
            <Text style={[styles.taskText, task.completed && styles.taskCompleted]}>
              {task.title}
            </Text>
          </TouchableOpacity>
        ))}
      </AnimatedView>

      <AnimatedView animation="slide" delay={600}>
        <TouchableOpacity style={styles.routineButton}>
          <Sunrise size={24} color="#333" />
          <Text style={styles.routineButtonText}>Morning Routine</Text>
        </TouchableOpacity>
      </AnimatedView>
    </ScrollView>
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
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  date: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  flowButton: {
    backgroundColor: '#333',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  flowButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  task: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  taskIcon: {
    width: 24,
  },
  taskText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  taskCompleted: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  routineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    gap: 8,
  },
  routineButtonText: {
    fontSize: 18,
    color: '#333',
    fontWeight: '500',
  },
});