import { useState } from 'react';
import { View, ScrollView, StyleSheet, Modal, Text, Platform } from 'react-native';
import { Plus, CircleCheck as CheckCircle2, Circle, Trash2, Edit2, Tag } from 'lucide-react-native';
import Animated, {
  FadeIn,
  FadeOut,
  SlideOutRight,
  Layout,
} from 'react-native-reanimated';
import { Swipeable } from 'react-native-gesture-handler';
import { AnimatedView } from '../../components/AnimatedView';
import { Button } from '../../components/Button';
import { TaskForm } from '../../components/TaskForm';
import { useTasks } from '../../hooks/useTasks';
import { Database } from '../../types/schema';

type Task = Database['public']['Tables']['tasks']['Row'];
type NewTask = Omit<Task, 'id' | 'user_id' | 'created_at'>;

export default function TasksScreen() {
  const { tasks, addTask, updateTask, deleteTask, toggleTask } = useTasks();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const handleAddTask = (taskData: NewTask) => {
    addTask({
      ...taskData,
      priority: taskData.priority || 'medium',
      category: taskData.category || 'other',
      tags: taskData.tags || [],
    });
    setIsModalVisible(false);
  };

  const handleEditTask = (taskData: Partial<Task>) => {
    if (editingTask) {
      updateTask(editingTask.id, taskData);
      setEditingTask(null);
      setIsModalVisible(false);
    }
  };

  const renderRightActions = (task: Task) => {
    return (
      <View style={styles.rightActions}>
        <Button
          variant="secondary"
          icon={<Edit2 size={20} color="#333" />}
          title="Editar"
          onPress={() => {
            setEditingTask(task);
            setIsModalVisible(true);
          }}
        />
        <Button
          variant="danger"
          icon={<Trash2 size={20} color="#fff" />}
          title="Eliminar"
          onPress={() => deleteTask(task.id)}
        />
      </View>
    );
  };

  const getPriorityColor = (priority: Task['priority']) => {
    const colors = {
      low: '#4ECDC4',
      medium: '#FFD166',
      high: '#FF6B6B',
    };
    return colors[priority];
  };

  return (
    <View style={styles.container}>
      <AnimatedView animation="slide" style={styles.header}>
        <Button
          title="Nueva Tarea"
          onPress={() => {
            setEditingTask(null);
            setIsModalVisible(true);
          }}
          icon={<Plus size={20} color="#fff" />}
        />
      </AnimatedView>

      <ScrollView style={styles.taskList}>
        {tasks.map(task => (
          <Animated.View
            key={task.id}
            entering={FadeIn}
            exiting={FadeOut}
            layout={Layout}>
            {Platform.OS === 'web' ? (
              <View style={[
                styles.task,
                { borderLeftColor: task.color || getPriorityColor(task.priority) },
              ]}>
                <Button
                  variant="secondary"
                  icon={
                    task.completed ? (
                      <CheckCircle2 size={24} color="#333" />
                    ) : (
                      <Circle size={24} color="#999" />
                    )
                  }
                  title={task.title}
                  onPress={() => toggleTask(task.id)}
                />
                {task.description && (
                  <View style={styles.descriptionContainer}>
                    <Text style={styles.description}>{task.description}</Text>
                  </View>
                )}
                {task.tags && task.tags.length > 0 && (
                  <View style={styles.tagsContainer}>
                    {task.tags.map((tag, index) => (
                      <View key={index} style={styles.tag}>
                        <Tag size={16} color="#666" />
                        <Text style={styles.tagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                )}
                {task.due_date && (
                  <Text style={styles.dueDate}>
                    Vence: {new Date(task.due_date).toLocaleDateString()}
                  </Text>
                )}
                <View style={styles.rightActions}>
                  <Button
                    variant="secondary"
                    icon={<Edit2 size={20} color="#333" />}
                    title="Editar"
                    onPress={() => {
                      setEditingTask(task);
                      setIsModalVisible(true);
                    }}
                  />
                  <Button
                    variant="danger"
                    icon={<Trash2 size={20} color="#fff" />}
                    title="Eliminar"
                    onPress={() => deleteTask(task.id)}
                  />
                </View>
              </View>
            ) : (
              <Swipeable renderRightActions={() => renderRightActions(task)}>
                <Animated.View
                  style={[
                    styles.task,
                    { borderLeftColor: task.color || getPriorityColor(task.priority) },
                  ]}>
                  <Button
                    variant="secondary"
                    icon={
                      task.completed ? (
                        <CheckCircle2 size={24} color="#333" />
                      ) : (
                        <Circle size={24} color="#999" />
                      )
                    }
                    title={task.title}
                    onPress={() => toggleTask(task.id)}
                  />
                  {task.description && (
                    <View style={styles.descriptionContainer}>
                      <Text style={styles.description}>{task.description}</Text>
                    </View>
                  )}
                  {task.tags && task.tags.length > 0 && (
                    <View style={styles.tagsContainer}>
                      {task.tags.map((tag, index) => (
                        <View key={index} style={styles.tag}>
                          <Tag size={16} color="#666" />
                          <Text style={styles.tagText}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                  {task.due_date && (
                    <Text style={styles.dueDate}>
                      Vence: {new Date(task.due_date).toLocaleDateString()}
                    </Text>
                  )}
                </Animated.View>
              </Swipeable>
            )}
          </Animated.View>
        ))}
      </ScrollView>

      <Modal
        visible={isModalVisible}
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}>
        <TaskForm
          initialData={editingTask || undefined}
          onSubmit={editingTask ? handleEditTask : handleAddTask}
          onCancel={() => setIsModalVisible(false)}
        />
      </Modal>
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
  taskList: {
    flex: 1,
    padding: 20,
  },
  task: {
    marginBottom: 12,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  rightActions: {
    flexDirection: 'row',
    marginLeft: 12,
    marginBottom: 12,
    gap: 8,
  },
  descriptionContainer: {
    marginTop: 8,
    paddingLeft: 32,
  },
  description: {
    color: '#666',
    fontSize: 14,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    paddingLeft: 32,
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
  },
  tagText: {
    color: '#666',
    fontSize: 12,
  },
  dueDate: {
    marginTop: 8,
    paddingLeft: 32,
    color: '#666',
    fontSize: 12,
  },
});