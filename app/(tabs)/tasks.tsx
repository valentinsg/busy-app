import { useState } from 'react';
import { View, ScrollView, StyleSheet, Modal, Text, Platform, TouchableOpacity, Animated as RNAnimated } from 'react-native';
import { Plus, CircleCheck as CheckCircle2, Circle, Trash2, Edit2, Tag, Filter, Calendar, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react-native';
import Animated, {
  FadeIn,
  FadeOut,
  Layout,
} from 'react-native-reanimated';
import { Swipeable } from 'react-native-gesture-handler';
import { AnimatedView } from '../../components/AnimatedView';
import { Button } from '../../components/Button';
import { TaskForm } from '../../components/TaskForm';
import { useTasks } from '../../hooks/useTasks';
import { Database, SubTask } from '../../types/schema';

// Funciones de fecha manuales
const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const subDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() - days);
  return result;
};

// Formato de fecha manual sin date-fns
const formatDate = (date: Date): string => {
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  
  const day = days[date.getDay()];
  const dayNum = date.getDate();
  const month = months[date.getMonth()];
  
  return `${day} ${dayNum} de ${month}`;
};

type Task = Database['public']['Tables']['tasks']['Row'] & { subtasks?: SubTask[] };
type NewTask = Omit<Task, 'id' | 'user_id' | 'created_at'>;

// Opciones de filtro
const SORT_OPTIONS = [
  { label: 'Fecha de vencimiento', value: 'dueDate' },
  { label: 'Prioridad', value: 'priority' },
  { label: 'Creada recientemente', value: 'createdAt' },
  { label: 'Título', value: 'title' },
];

const PRIORITY_OPTIONS = [
  { label: 'Todas', value: '' },
  { label: 'Alta', value: 'high' },
  { label: 'Media', value: 'medium' },
  { label: 'Baja', value: 'low' },
];

const CATEGORY_OPTIONS = [
  { label: 'Todas', value: '' },
  { label: 'Trabajo', value: 'work' },
  { label: 'Personal', value: 'personal' },
  { label: 'Salud', value: 'health' },
  { label: 'Otra', value: 'other' },
];

export default function TasksScreen() {
  const { 
    tasks,
    addTask,
    updateTask,
    deleteTask,
    toggleTask,
    toggleSubTask,
    setFilter,
    clearFilters,
    setSorting,
    getFilteredAndSortedTasks,
    selectedDate,
    setDate
  } = useTasks();
  
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [activeSort, setActiveSort] = useState('dueDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});

  // Obtener tareas filtradas
  const filteredTasks = getFilteredAndSortedTasks();
  
  // Para depuración
  console.log('Todas las tareas:', tasks);
  console.log('Tareas filtradas:', filteredTasks);
  console.log('Fecha seleccionada:', selectedDate);

  const handleAddTask = (taskData: NewTask) => {
    addTask({
      ...taskData,
      priority: taskData.priority || 'medium',
      category: taskData.category || 'other',
      tags: taskData.tags || [],
      subtasks: taskData.subtasks || [],
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

  const toggleExpand = (taskId: string) => {
    setExpandedTasks(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };

  const handleNextDay = () => {
    setDate(addDays(selectedDate, 1));
  };

  const handlePreviousDay = () => {
    setDate(subDays(selectedDate, 1));
  };

  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    toggleSubTask(taskId, subtaskId);
  };

  const applyFilters = () => {
    const filterObj: any = {};
    
    if (selectedPriority) {
      filterObj.priority = selectedPriority;
    }
    
    if (selectedCategory) {
      filterObj.category = selectedCategory;
    }
    
    setFilter(filterObj);
    setSorting(activeSort as any, sortDirection);
    setFilterModalVisible(false);
  };

  const clearAllFilters = () => {
    setSelectedPriority('');
    setSelectedCategory('');
    setActiveSort('dueDate');
    setSortDirection('asc');
    clearFilters();
    setFilterModalVisible(false);
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
        <View style={styles.headerTop}>
          <Button
            title="Nueva Tarea"
            onPress={() => {
              setEditingTask(null);
              setIsModalVisible(true);
            }}
            icon={<Plus size={20} color="#fff" />}
          />
          <Button
            variant="secondary"
            icon={<Filter size={20} color="#333" />}
            title="Filtrar"
            onPress={() => setFilterModalVisible(true)}
          />
        </View>
        
        <View style={styles.dateSelector}>
          <TouchableOpacity onPress={handlePreviousDay} style={styles.dateArrow}>
            <ChevronLeft size={24} color="#333" />
          </TouchableOpacity>
          
          <Text style={styles.dateText}>
            {formatDate(selectedDate)}
          </Text>
          
          <TouchableOpacity onPress={handleNextDay} style={styles.dateArrow}>
            <ChevronRight size={24} color="#333" />
          </TouchableOpacity>
        </View>
      </AnimatedView>

      <ScrollView style={styles.taskList}>
        {filteredTasks.length > 0 ? (
          filteredTasks.map(task => (
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
                  <View style={styles.taskHeader}>
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
                    
                    {task.subtasks && task.subtasks.length > 0 && (
                      <TouchableOpacity 
                        onPress={() => toggleExpand(task.id)}
                        style={styles.expandButton}
                      >
                        {expandedTasks[task.id] ? (
                          <ChevronUp size={20} color="#999" />
                        ) : (
                          <ChevronDown size={20} color="#999" />
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                  
                  {task.description && (
                    <View style={styles.descriptionContainer}>
                      <Text style={styles.description}>{task.description}</Text>
                    </View>
                  )}
                  
                  {/* Subtareas */}
                  {task.subtasks && task.subtasks.length > 0 && expandedTasks[task.id] && (
                    <View style={styles.subtasksContainer}>
                      {task.subtasks.map(subtask => (
                        <View key={subtask.id} style={styles.subtaskItem}>
                          <TouchableOpacity 
                            onPress={() => handleToggleSubtask(task.id, subtask.id)}
                            style={styles.subtaskCheckbox}
                          >
                            {subtask.completed ? (
                              <CheckCircle2 size={16} color="#333" />
                            ) : (
                              <Circle size={16} color="#999" />
                            )}
                          </TouchableOpacity>
                          <Text 
                            style={[
                              styles.subtaskText, 
                              subtask.completed && styles.subtaskCompleted
                            ]}
                          >
                            {subtask.title}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                  
                  {task.due_date && (
                    <Text style={styles.dueDate}>
                      Vence: {new Date(task.due_date).toLocaleDateString()}
                    </Text>
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
                    <View style={styles.taskHeader}>
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
                      
                      {task.subtasks && task.subtasks.length > 0 && (
                        <TouchableOpacity 
                          onPress={() => toggleExpand(task.id)}
                          style={styles.expandButton}
                        >
                          {expandedTasks[task.id] ? (
                            <ChevronUp size={20} color="#999" />
                          ) : (
                            <ChevronDown size={20} color="#999" />
                          )}
                        </TouchableOpacity>
                      )}
                    </View>
                    
                    {task.description && (
                      <View style={styles.descriptionContainer}>
                        <Text style={styles.description}>{task.description}</Text>
                      </View>
                    )}
                    
                    {/* Subtareas */}
                    {task.subtasks && task.subtasks.length > 0 && expandedTasks[task.id] && (
                      <View style={styles.subtasksContainer}>
                        {task.subtasks.map(subtask => (
                          <View key={subtask.id} style={styles.subtaskItem}>
                            <TouchableOpacity 
                              onPress={() => handleToggleSubtask(task.id, subtask.id)}
                              style={styles.subtaskCheckbox}
                            >
                              {subtask.completed ? (
                                <CheckCircle2 size={16} color="#333" />
                              ) : (
                                <Circle size={16} color="#999" />
                              )}
                            </TouchableOpacity>
                            <Text 
                              style={[
                                styles.subtaskText, 
                                subtask.completed && styles.subtaskCompleted
                              ]}
                            >
                              {subtask.title}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                    
                    {task.due_date && (
                      <Text style={styles.dueDate}>
                        Vence: {new Date(task.due_date).toLocaleDateString()}
                      </Text>
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
                  </Animated.View>
                </Swipeable>
              )}
            </Animated.View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Calendar size={64} color="#ccc" />
            <Text style={styles.emptyStateText}>
              No hay tareas para este día
            </Text>
            <Button
              title="Crear tarea nueva"
              onPress={() => {
                setEditingTask(null);
                setIsModalVisible(true);
              }}
              variant="secondary"
            />
          </View>
        )}
      </ScrollView>

      {/* Modal de Tarea */}
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

      {/* Modal de Filtros */}
      <Modal
        visible={filterModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setFilterModalVisible(false)}>
        <View style={styles.filterModalContainer}>
          <View style={styles.filterModalContent}>
            <View style={styles.filterModalHeader}>
              <Text style={styles.filterModalTitle}>Filtros y Ordenamiento</Text>
              <TouchableOpacity
                onPress={() => setFilterModalVisible(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.filterModalBody}>
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Ordenar Por</Text>
                {SORT_OPTIONS.map(option => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.filterOption,
                      activeSort === option.value && styles.filterOptionActive
                    ]}
                    onPress={() => {
                      setActiveSort(option.value);
                      if (activeSort === option.value) {
                        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortDirection('asc');
                      }
                    }}
                  >
                    <Text style={styles.filterOptionText}>{option.label}</Text>
                    {activeSort === option.value && (
                      <Text style={styles.filterDirectionText}>
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Prioridad</Text>
                {PRIORITY_OPTIONS.map(option => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.filterOption,
                      selectedPriority === option.value && styles.filterOptionActive
                    ]}
                    onPress={() => setSelectedPriority(option.value)}
                  >
                    <Text style={styles.filterOptionText}>{option.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Categoría</Text>
                {CATEGORY_OPTIONS.map(option => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.filterOption,
                      selectedCategory === option.value && styles.filterOptionActive
                    ]}
                    onPress={() => setSelectedCategory(option.value)}
                  >
                    <Text style={styles.filterOptionText}>{option.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={styles.filterModalFooter}>
              <Button
                title="Limpiar filtros"
                onPress={clearAllFilters}
                variant="secondary"
              />
              <Button
                title="Aplicar"
                onPress={applyFilters}
              />
            </View>
          </View>
        </View>
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
  },
  dateArrow: {
    padding: 5,
  },
  dateText: {
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'capitalize',
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
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expandButton: {
    padding: 5,
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
  subtasksContainer: {
    marginTop: 12,
    paddingLeft: 32,
    gap: 8,
  },
  subtaskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 8,
  },
  subtaskCheckbox: {
    marginRight: 8,
  },
  subtaskText: {
    fontSize: 14,
    color: '#333',
  },
  subtaskCompleted: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 16,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
    marginVertical: 10,
    textAlign: 'center',
  },
  filterModalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  filterModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  filterModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#999',
  },
  filterModalBody: {
    padding: 20,
  },
  filterSection: {
    marginBottom: 20,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  filterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f5f5f5',
  },
  filterOptionActive: {
    backgroundColor: '#e0e0e0',
  },
  filterOptionText: {
    fontSize: 14,
  },
  filterDirectionText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  filterModalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
});