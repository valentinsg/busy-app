import { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Plus, CircleCheck as CheckCircle2, Circle, Trash2 } from 'lucide-react-native';
import Animated, {
  FadeIn,
  FadeOut,
  SlideOutRight,
} from 'react-native-reanimated';
import { Swipeable } from 'react-native-gesture-handler';
import { AnimatedView } from '../../components/AnimatedView';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { useTasks } from '../../hooks/useTasks';

export default function TasksScreen() {
  const { tasks, addTask, toggleTask, deleteTask } = useTasks();
  const [newTask, setNewTask] = useState('');

  const handleAddTask = () => {
    if (newTask.trim()) {
      addTask(newTask);
      setNewTask('');
    }
  };

  const renderRightActions = (taskId: string) => {
    return (
      <View style={styles.rightAction}>
        <Button
          variant="danger"
          icon={<Trash2 size={20} color="#fff" />}
          title="Delete"
          onPress={() => deleteTask(taskId)}
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <AnimatedView animation="slide" style={styles.header}>
        <Input
          placeholder="Add a new task"
          value={newTask}
          onChangeText={setNewTask}
          onSubmitEditing={handleAddTask}
        />
        <Button
          title="Add Task"
          onPress={handleAddTask}
          icon={<Plus size={20} color="#fff" />}
        />
      </AnimatedView>

      <ScrollView style={styles.taskList}>
        {tasks.map(task => (
          <Animated.View
            key={task.id}
            entering={FadeIn}
            exiting={FadeOut}
            layout={SlideOutRight}>
            <Swipeable
              renderRightActions={() => renderRightActions(task.id)}
              onSwipeableOpen={() => deleteTask(task.id)}
            >
              <Animated.View
                style={styles.task}
                entering={FadeIn}
                exiting={SlideOutRight}>
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
              </Animated.View>
            </Swipeable>
          </Animated.View>
        ))}
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
    gap: 12,
  },
  taskList: {
    flex: 1,
    padding: 20,
  },
  task: {
    marginBottom: 12,
  },
  rightAction: {
    marginLeft: 12,
    marginBottom: 12,
  },
});