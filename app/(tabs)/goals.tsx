import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Alert } from 'react-native';
import { Plus, CheckSquare, Square, ChevronDown, ChevronUp, Calendar, Edit2, Trash2, XCircle } from 'lucide-react-native';
import { format, isAfter } from 'date-fns';
import { es } from 'date-fns/locale';
import DateTimePicker from '@react-native-community/datetimepicker';
import { AnimatedView } from '../../components/AnimatedView';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { useGoals } from '../../hooks/useGoals';
import { usePillars } from '../../hooks/usePillars';
import { Goal, GoalTask } from '../../types/schema';

const GoalsScreen = () => {
  const { 
    goals, 
    goalTasks: fetchedGoalTasks, 
    loading, 
    error, 
    fetchGoals, 
    fetchGoalTasks, 
    createGoal, 
    updateGoal, 
    deleteGoal,
    addGoalTask,
    updateGoalTask, 
    deleteGoalTask,
    toggleGoalTask,
    getGoalsWithTasks
  } = useGoals();

  const { pillars, fetchPillars } = usePillars();
  
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalDescription, setGoalDescription] = useState('');
  const [goalDueDate, setGoalDueDate] = useState<Date | null>(null);
  const [goalColor, setGoalColor] = useState('#4ECDC4');
  const [selectedPillar, setSelectedPillar] = useState<string | null>(null);
  const [goalTasks, setGoalTasks] = useState<Omit<GoalTask, 'id' | 'created_at' | 'goal_id'>[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [expandedGoals, setExpandedGoals] = useState<Record<string, boolean>>({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const COLORS = ['#4ECDC4', '#FF6B6B', '#FFD166', '#06D6A0', '#118AB2', '#8A84E2'];
  
  useEffect(() => {
    fetchGoals();
    fetchGoalTasks();
    fetchPillars();
  }, [fetchGoals, fetchGoalTasks, fetchPillars]);
  
  const toggleGoalExpand = (goalId: string) => {
    setExpandedGoals(prev => ({
      ...prev,
      [goalId]: !prev[goalId]
    }));
  };
  
  const handleCreateGoal = async () => {
    if (!goalTitle.trim()) {
      Alert.alert('Error', 'El título de la meta es obligatorio');
      return;
    }
    
    try {
      const newGoal = {
        title: goalTitle.trim(),
        description: goalDescription.trim(),
        status: 'pending',
        due_date: goalDueDate ? format(goalDueDate, 'yyyy-MM-dd') : null,
        color: goalColor,
        pillar_id: selectedPillar,
        tasks: goalTasks.length > 0 ? goalTasks : undefined
      };
      
      // Aseguramos que el status sea uno de los valores permitidos
      newGoal.status = newGoal.status as "pending" | "in_progress" | "completed" | "cancelled";
      
      const result = await createGoal(newGoal as unknown as Goal);
      
      if (result) {
        resetForm();
        setIsModalVisible(false);
        Alert.alert('¡Éxito!', 'Meta creada correctamente');
      }
    } catch (err) {
      console.error('Error creating goal:', err);
      Alert.alert('Error', 'No se pudo crear la meta. Intenta nuevamente.');
    }
  };
  
  const handleUpdateGoal = async () => {
    if (!editingGoal || !goalTitle.trim()) {
      Alert.alert('Error', 'El título de la meta es obligatorio');
      return;
    }
    
    try {
      const updates = {
        title: goalTitle.trim(),
        description: goalDescription.trim(),
        due_date: goalDueDate ? format(goalDueDate, 'yyyy-MM-dd') : null,
        color: goalColor,
        pillar_id: selectedPillar
      };
      
      const result = await updateGoal(editingGoal.id, updates as Goal);
      
      if (result) {
        // Ahora procesamos las tareas una por una
        for (const task of goalTasks) {
          // Verificamos si la tarea tiene un ID usando una propiedad opcional
          if ('id' in task === false) {
            // Nueva tarea
            await addGoalTask(editingGoal.id, {
              title: task.title,
              completed: task.completed || false,
              due_date: task.due_date,
              order_index: task.order_index
            });
          }
        }
        
        resetForm();
        setIsModalVisible(false);
        Alert.alert('¡Éxito!', 'Meta actualizada correctamente');
      }
    } catch (err) {
      console.error('Error updating goal:', err);
      Alert.alert('Error', 'No se pudo actualizar la meta. Intenta nuevamente.');
    }
  };
  
  const handleDeleteGoal = async (goalId: string) => {
    try {
      Alert.alert(
        'Confirmar eliminación',
        '¿Estás seguro de que quieres eliminar esta meta? También se eliminarán todas sus tareas.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Eliminar', 
            style: 'destructive',
            onPress: async () => {
              const result = await deleteGoal(goalId);
              if (result) {
                Alert.alert('Éxito', 'Meta eliminada correctamente');
              }
            }
          }
        ]
      );
    } catch (err) {
      console.error('Error deleting goal:', err);
      Alert.alert('Error', 'No se pudo eliminar la meta. Intenta nuevamente.');
    }
  };
  
  const handleToggleTask = async (taskId: string) => {
    try {
      await toggleGoalTask(taskId);
    } catch (err) {
      console.error('Error toggling task:', err);
      Alert.alert('Error', 'No se pudo actualizar la tarea. Intenta nuevamente.');
    }
  };
  
  const handleDeleteTask = async (taskId: string) => {
    try {
      const result = await deleteGoalTask(taskId);
      if (result) {
        // La tarea se eliminó correctamente
      }
    } catch (err) {
      console.error('Error deleting task:', err);
      Alert.alert('Error', 'No se pudo eliminar la tarea. Intenta nuevamente.');
    }
  };
  
  const addTaskToForm = () => {
    if (!newTaskTitle.trim()) {
      Alert.alert('Error', 'El título de la tarea es obligatorio');
      return;
    }
    
    const newTask = {
      title: newTaskTitle.trim(),
      completed: false,
      order_index: goalTasks.length
    };
    
    setGoalTasks(prev => [...prev, newTask as Omit<GoalTask, 'id' | 'created_at' | 'goal_id'>]);
    setNewTaskTitle('');
  };
  
  const removeTaskFromForm = (index: number) => {
    setGoalTasks(prev => prev.filter((_, i) => i !== index));
  };
  
  const editGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setGoalTitle(goal.title);
    setGoalDescription(goal.description || '');
    setGoalDueDate(goal.due_date ? new Date(goal.due_date) : null);
    setGoalColor(goal.color);
    setSelectedPillar(goal.pillar_id);
    
    // Cargar las tareas de esta meta
    const tasks = fetchedGoalTasks.filter(task => task.goal_id === goal.id);
    setGoalTasks(tasks.map(task => ({
      id: task.id,
      title: task.title,
      completed: task.completed,
      due_date: task.due_date,
      order_index: task.order_index
    })));
    
    setIsModalVisible(true);
  };
  
  const resetForm = () => {
    setGoalTitle('');
    setGoalDescription('');
    setGoalDueDate(null);
    setGoalColor('#4ECDC4');
    setSelectedPillar(null);
    setGoalTasks([]);
    setNewTaskTitle('');
    setEditingGoal(null);
  };
  
  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setGoalDueDate(selectedDate);
    }
  };
  
  const renderGoalsList = () => {
    if (loading) {
      return <Text style={styles.message}>Cargando metas...</Text>;
    }
    
    if (error) {
      return <Text style={styles.errorMessage}>{error}</Text>;
    }
    
    if (goals.length === 0) {
      return <Text style={styles.message}>No tienes metas creadas. ¡Crea tu primera meta!</Text>;
    }
    
    const goalsWithTasks = getGoalsWithTasks();
    
    // Organizar metas por estado
    const pendingGoals = goalsWithTasks.filter(g => g.status === 'pending' || g.status === 'in_progress');
    const completedGoals = goalsWithTasks.filter(g => g.status === 'completed');
    
    return (
      <>
        {pendingGoals.length > 0 && (
          <View style={styles.goalSection}>
            <Text style={styles.sectionTitle}>Metas activas</Text>
            {pendingGoals.map(goal => renderGoalItem(goal))}
          </View>
        )}
        
        {completedGoals.length > 0 && (
          <View style={styles.goalSection}>
            <Text style={styles.sectionTitle}>Metas completadas</Text>
            {completedGoals.map(goal => renderGoalItem(goal))}
          </View>
        )}
      </>
    );
  };
  
  const renderGoalItem = (goal: Goal & { tasks?: GoalTask[] }) => {
    const isExpanded = expandedGoals[goal.id] || false;
    const hasTasks = goal.tasks && goal.tasks.length > 0;
    
    const getPillarName = () => {
      if (!goal.pillar_id) return null;
      const pillar = pillars.find(p => p.id === goal.pillar_id);
      return pillar ? pillar.name : null;
    };
    
    const pillarName = getPillarName();
    
    const isDueDatePassed = () => {
      if (!goal.due_date) return false;
      const today = new Date();
      const dueDate = new Date(goal.due_date);
      return isAfter(today, dueDate) && goal.status !== 'completed';
    };
    
    return (
      <AnimatedView key={goal.id} animation="fade" style={styles.goalCard}>
        <TouchableOpacity 
          style={styles.goalHeader} 
          onPress={() => toggleGoalExpand(goal.id)}
        >
          <View style={[styles.goalColorIndicator, { backgroundColor: goal.color }]} />
          <View style={styles.goalInfo}>
            <Text style={styles.goalTitle}>{goal.title}</Text>
            {pillarName && <Text style={styles.pillarTag}>{pillarName}</Text>}
            {goal.description ? <Text style={styles.goalDescription}>{goal.description}</Text> : null}
            
            {goal.due_date && (
              <View style={[styles.dueDate, isDueDatePassed() && styles.dueDatePassed]}>
                <Calendar size={14} color={isDueDatePassed() ? '#FF6B6B' : '#6c757d'} />
                <Text style={[styles.dueDateText, isDueDatePassed() && styles.dueDateTextPassed]}>
                  {format(new Date(goal.due_date), 'dd MMM yyyy')}
                </Text>
              </View>
            )}
          </View>
          {isExpanded ? (
            <ChevronUp size={20} color="#6c757d" />
          ) : (
            <ChevronDown size={20} color="#6c757d" />
          )}
        </TouchableOpacity>
        
        <View style={styles.progressContainer}>
          <View style={styles.progressLabel}>
            <Text style={styles.progressText}>Progreso:</Text>
            <Text style={styles.progressPercentage}>{goal.progress}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${goal.progress}%`, backgroundColor: goal.color }
              ]} 
            />
          </View>
        </View>
        
        {isExpanded && (
          <View style={styles.expandedContent}>
            {hasTasks ? (
              <View style={styles.tasksContainer}>
                {goal.tasks!.map(task => (
                  <View key={task.id} style={styles.taskItem}>
                    <TouchableOpacity
                      onPress={() => handleToggleTask(task.id)}
                      style={styles.taskCheckbox}
                    >
                      {task.completed ? (
                        <CheckSquare size={20} color={goal.color} />
                      ) : (
                        <Square size={20} color="#6c757d" />
                      )}
                    </TouchableOpacity>
                    <Text style={[styles.taskTitle, task.completed && styles.taskCompleted]}>
                      {task.title}
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleDeleteTask(task.id)}
                      style={styles.taskDeleteButton}
                    >
                      <Trash2 size={16} color="#FF6B6B" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.noTasksMessage}>No hay tareas para esta meta</Text>
            )}
            
            <View style={styles.actionButtons}>
              <Button
                variant="secondary"
                title="Editar"
                icon={<Edit2 size={18} color="#333" />}
                onPress={() => editGoal(goal)}
              />
              <Button
                variant="danger"
                title="Eliminar"
                icon={<Trash2 size={18} color="#fff" />}
                onPress={() => handleDeleteGoal(goal.id)}
              />
            </View>
          </View>
        )}
      </AnimatedView>
    );
  };
  
  const renderGoalForm = () => {
    return (
      <View style={styles.formContainer}>
        <View style={styles.formHeader}>
          <Text style={styles.formTitle}>
            {editingGoal ? 'Editar Meta' : 'Nueva Meta'}
          </Text>
          <TouchableOpacity onPress={() => {
            resetForm();
            setIsModalVisible(false);
          }}>
            <XCircle size={24} color="#333" />
          </TouchableOpacity>
        </View>
        
        <Input
          label="Título de la meta"
          value={goalTitle}
          onChangeText={setGoalTitle}
          placeholder="Ej: Aprender un nuevo idioma"
        />
        
        <Input
          label="Descripción (opcional)"
          value={goalDescription}
          onChangeText={setGoalDescription}
          placeholder="Ej: Alcanzar un nivel básico de conversación"
          multiline
        />
        
        <View style={styles.formSection}>
          <Text style={styles.sectionLabel}>Fecha límite (opcional)</Text>
          <TouchableOpacity
            style={styles.datePickerButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Calendar size={20} color="#6c757d" />
            <Text style={styles.datePickerText}>
              {goalDueDate 
                ? format(goalDueDate, 'dd/MM/yyyy') 
                : 'Seleccionar fecha'}
            </Text>
          </TouchableOpacity>
          
          {showDatePicker && (
            <DateTimePicker
              value={goalDueDate || new Date()}
              mode="date"
              display="default"
              onChange={handleDateChange}
              minimumDate={new Date()}
            />
          )}
        </View>
        
        <View style={styles.formSection}>
          <Text style={styles.sectionLabel}>Color</Text>
          <View style={styles.colorPicker}>
            {COLORS.map(color => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorOption,
                  { backgroundColor: color },
                  goalColor === color && styles.colorSelected
                ]}
                onPress={() => setGoalColor(color)}
              />
            ))}
          </View>
        </View>
        
        <View style={styles.formSection}>
          <Text style={styles.sectionLabel}>Pilar de vida (opcional)</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.pillarsScroll}
          >
            {pillars.map(pillar => (
              <TouchableOpacity
                key={pillar.id}
                style={[
                  styles.pillarOption,
                  { backgroundColor: pillar.color },
                  selectedPillar === pillar.id && styles.pillarSelected
                ]}
                onPress={() => setSelectedPillar(selectedPillar === pillar.id ? null : pillar.id)}
              >
                <Text style={styles.pillarText}>{pillar.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        
        <View style={styles.formSection}>
          <Text style={styles.sectionLabel}>Tareas</Text>
          <View style={styles.taskFormContainer}>
            <Input
              value={newTaskTitle}
              onChangeText={setNewTaskTitle}
              placeholder="Título de la tarea"
              style={styles.taskInput}
            />
            <Button
              title="Añadir"
              variant="secondary"
              icon={<Plus size={18} color="#333" />}
              onPress={addTaskToForm}
            />
          </View>
          
          {goalTasks.length > 0 && (
            <View style={styles.formTasksList}>
              {goalTasks.map((task, index) => (
                <View key={index} style={styles.formTaskItem}>
                  <Text style={styles.formTaskTitle}>{task.title}</Text>
                  <TouchableOpacity
                    onPress={() => removeTaskFromForm(index)}
                    style={styles.formTaskDelete}
                  >
                    <Trash2 size={16} color="#FF6B6B" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
        
        <Button
          title={editingGoal ? "Guardar Cambios" : "Crear Meta"}
          onPress={editingGoal ? handleUpdateGoal : handleCreateGoal}
          variant="primary"
        />
      </View>
    );
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Metas</Text>
        <Button
          title="Nueva Meta"
          onPress={() => {
            resetForm();
            setIsModalVisible(true);
          }}
          icon={<Plus size={18} color="#fff" />}
          variant="primary"
        />
      </View>
      
      <ScrollView style={styles.content}>
        {renderGoalsList()}
        
        <View style={styles.bottomSpace} />
      </ScrollView>
      
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => {
          resetForm();
          setIsModalVisible(false);
        }}
      >
        <ScrollView style={styles.modalScroll}>
          {renderGoalForm()}
        </ScrollView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  message: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginTop: 24,
  },
  errorMessage: {
    fontSize: 16,
    color: '#dc3545',
    textAlign: 'center',
    marginTop: 24,
  },
  goalSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#495057',
  },
  goalCard: {
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
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  goalColorIndicator: {
    width: 8,
    height: '100%',
    borderRadius: 4,
    marginRight: 12,
  },
  goalInfo: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  goalDescription: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 4,
  },
  pillarTag: {
    fontSize: 12,
    color: '#6c757d',
    backgroundColor: '#e9ecef',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginVertical: 4,
  },
  dueDate: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  dueDatePassed: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  dueDateText: {
    fontSize: 12,
    color: '#6c757d',
    marginLeft: 4,
  },
  dueDateTextPassed: {
    color: '#FF6B6B',
  },
  progressContainer: {
    marginTop: 16,
    marginBottom: 8,
  },
  progressLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#6c757d',
  },
  progressPercentage: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#495057',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e9ecef',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  expandedContent: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    paddingTop: 16,
  },
  tasksContainer: {
    marginBottom: 16,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  taskCheckbox: {
    marginRight: 12,
  },
  taskTitle: {
    fontSize: 14,
    color: '#495057',
    flex: 1,
  },
  taskCompleted: {
    textDecorationLine: 'line-through',
    color: '#6c757d',
  },
  taskDeleteButton: {
    padding: 4,
  },
  noTasksMessage: {
    fontSize: 14,
    color: '#6c757d',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalScroll: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  formContainer: {
    flex: 1,
    padding: 16,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  formSection: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#495057',
    marginBottom: 8,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#e9ecef',
    borderRadius: 8,
  },
  datePickerText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#495057',
  },
  colorPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
    marginBottom: 12,
  },
  colorSelected: {
    borderWidth: 3,
    borderColor: '#333',
  },
  pillarsScroll: {
    flexDirection: 'row',
  },
  pillarOption: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 12,
  },
  pillarSelected: {
    borderWidth: 2,
    borderColor: '#333',
  },
  pillarText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: 'bold',
  },
  taskFormContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskInput: {
    flex: 1,
    marginRight: 8,
  },
  formTasksList: {
    marginTop: 16,
  },
  formTaskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e9ecef',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  formTaskTitle: {
    flex: 1,
    fontSize: 14,
    color: '#495057',
  },
  formTaskDelete: {
    padding: 4,
  },
  bottomSpace: {
    height: 80,
  },
});

export default GoalsScreen;