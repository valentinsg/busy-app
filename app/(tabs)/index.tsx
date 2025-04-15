import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTasks } from '../../hooks/useTasks';
import { Database } from '../../types/schema';
import { AnimatedView } from '../../components/AnimatedView';
import { Bell, Calendar, Clock, Tag, MoreVertical } from 'lucide-react-native';

type Task = Database['public']['Tables']['tasks']['Row'];

const PriorityBar = ({ priority }: { priority: Task['priority'] }) => {
  const levels = {
    low: 1,
    medium: 2,
    high: 3
  };

  const colors = {
    low: '#4ECDC4',
    medium: '#FFD166',
    high: '#FF6B6B'
  };

  return (
    <View style={styles.priorityBar}>
      {[...Array(3)].map((_, i) => (
        <View
          key={i}
          style={[
            styles.prioritySegment,
            { backgroundColor: i < levels[priority] ? colors[priority] : '#eee' }
          ]}
        />
      ))}
    </View>
  );
};

const TimeDisplay = ({ date }: { date: string }) => {
  if (!date) return null;
  
  const taskDate = new Date(date);
  const now = new Date();
  const isToday = taskDate.toDateString() === now.toDateString();
  
  return (
    <View style={styles.timeContainer}>
      <Clock size={16} color="#666" />
      <Text style={styles.timeText}>
        {taskDate.toLocaleTimeString([], { 
          hour: '2-digit',
          minute: '2-digit',
          hour12: true 
        })}
      </Text>
      {isToday && <Bell size={16} color="#FF6B6B" />}
    </View>
  );
};

export default function HomeScreen() {
  const { tasks } = useTasks();
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const upcomingTasks = tasks
    .filter(task => !task.completed && task.due_date && new Date(task.due_date) >= today)
    .sort((a, b) => {
      if (!a.due_date || !b.due_date) return 0;
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    })
    .slice(0, 5);

  const getDateLabel = (date: string | null) => {
    if (!date) return 'Sin fecha';
    const taskDate = new Date(date);
    if (taskDate.toDateString() === today.toDateString()) return 'Hoy';
    if (taskDate.toDateString() === tomorrow.toDateString()) return 'Mañana';
    return taskDate.toLocaleDateString('es-ES', { 
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <View style={styles.container}>
      <AnimatedView animation="slide" style={styles.header}>
        <Text style={styles.title}>Inicio</Text>
      </AnimatedView>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Próximas tareas</Text>
          
          {upcomingTasks.map(task => (
            <View key={task.id} style={styles.taskCard}>
              <View style={styles.taskHeader}>
                <Text style={styles.dateLabel}>{getDateLabel(task.due_date)}</Text>
                <TouchableOpacity style={styles.moreButton}>
                  <MoreVertical size={20} color="#666" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.taskContent}>
                <Text style={styles.taskTitle}>{task.title}</Text>
                
                <View style={styles.taskMeta}>
                  <PriorityBar priority={task.priority} />
                  
                  {task.scheduled_time && (
                    <TimeDisplay date={task.scheduled_time} />
                  )}
                </View>
                
                {task.tags && task.tags.length > 0 && (
                  <View style={styles.tagsContainer}>
                    {task.tags.map((tag, index) => (
                      <View key={index} style={styles.tag}>
                        <Tag size={14} color="#666" />
                        <Text style={styles.tagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  taskCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateLabel: {
    fontSize: 14,
    color: '#666',
    textTransform: 'capitalize',
  },
  moreButton: {
    padding: 4,
  },
  taskContent: {
    gap: 12,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priorityBar: {
    flexDirection: 'row',
    gap: 2,
    backgroundColor: '#f5f5f5',
    padding: 4,
    borderRadius: 12,
  },
  prioritySegment: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 6,
  },
  timeText: {
    fontSize: 12,
    color: '#666',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 4,
  },
  tagText: {
    fontSize: 12,
    color: '#666',
  },
});