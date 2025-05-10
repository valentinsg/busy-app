import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Alert,  } from 'react-native';
import { Check, Plus, XCircle, Calendar, Edit2, Trash2, ArrowLeft, ArrowRight } from 'lucide-react-native';
import { format, addMonths, subMonths, } from 'date-fns';
import { Calendar as RNCalendar,  } from 'react-native-calendars';
import { AnimatedView } from '../../components/AnimatedView';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { useHabits } from '../../hooks/useHabits';
import { usePillars } from '../../hooks/usePillars';
import { Habit } from '../../types/schema';

type HabitFrequency = 'daily' | 'weekly';

const HabitsScreen = () => {
  const { 
    habits, 
    loading, 
    error, 
    fetchHabits, 
    createHabit, 
    updateHabit, 
    deleteHabit, 
    markHabitComplete, 
    unmarkHabitComplete, 
    isHabitCompletedOnDate,
    getCompletedDatesForHabit,
    fetchCompletions,
    getHabitSuccessRate
  } = useHabits();
  
  const { pillars, fetchPillars } = usePillars();
  
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [habitName, setHabitName] = useState('');
  const [habitDescription, setHabitDescription] = useState('');
  const [habitFrequency, setHabitFrequency] = useState<HabitFrequency>('daily');
  const [habitColor, setHabitColor] = useState('#8A84E2');
  const [selectedPillar, setSelectedPillar] = useState<string | null>(null);
  const [showCalendarView, setShowCalendarView] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  
  const COLORS = ['#8A84E2', '#4ECDC4', '#FF6B6B', '#FFD166', '#06D6A0', '#118AB2'];
  
  useEffect(() => {
    fetchHabits();
    fetchPillars();
    
    // Cargar completados para el mes actual
    const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    fetchCompletions(startDate, endDate);
  }, [fetchHabits, fetchPillars, currentMonth, fetchCompletions]);
  
  const handleCreateHabit = async () => {
    if (!habitName.trim()) {
      Alert.alert('Error', 'El nombre del hábito es obligatorio');
      return;
    }
    
    try {
      const newHabit = {
        name: habitName.trim(),
        description: habitDescription.trim(),
        frequency: habitFrequency,
        color: habitColor,
        pillar_id: selectedPillar
      };
      
      const result = await createHabit(newHabit as Habit);
      
      if (result) {
        resetForm();
        setIsModalVisible(false);
        Alert.alert('¡Éxito!', 'Hábito creado correctamente');
      }
    } catch (err) {
      console.error('Error creating habit:', err);
      Alert.alert('Error', 'No se pudo crear el hábito. Intenta nuevamente.');
    }
  };
  
  const handleUpdateHabit = async () => {
    if (!editingHabit || !habitName.trim()) {
      Alert.alert('Error', 'El nombre del hábito es obligatorio');
      return;
    }
    
    try {
      const updates = {
        name: habitName.trim(),
        description: habitDescription.trim(),
        frequency: habitFrequency,
        color: habitColor,
        pillar_id: selectedPillar
      };
      
      const result = await updateHabit(editingHabit.id, updates as Habit);
      
      if (result) {
        resetForm();
        setIsModalVisible(false);
        setEditingHabit(null);
        Alert.alert('¡Éxito!', 'Hábito actualizado correctamente');
      }
    } catch (err) {
      console.error('Error updating habit:', err);
      Alert.alert('Error', 'No se pudo actualizar el hábito. Intenta nuevamente.');
    }
  };
  
  const handleDeleteHabit = async (habitId: string) => {
    try {
      Alert.alert(
        'Confirmar eliminación',
        '¿Estás seguro de que quieres eliminar este hábito? Esta acción no se puede deshacer.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Eliminar', 
            style: 'destructive',
            onPress: async () => {
              const result = await deleteHabit(habitId);
              if (result) {
                Alert.alert('Éxito', 'Hábito eliminado correctamente');
                if (selectedHabit?.id === habitId) {
                  setSelectedHabit(null);
                  setShowCalendarView(false);
                }
              }
            }
          }
        ]
      );
    } catch (err) {
      console.error('Error deleting habit:', err);
      Alert.alert('Error', 'No se pudo eliminar el hábito. Intenta nuevamente.');
    }
  };
  
  const toggleHabitCompletion = async (habit: Habit, date = new Date()) => {
    try {
      const isCompleted = isHabitCompletedOnDate(habit.id, date);
      
      if (isCompleted) {
        await unmarkHabitComplete(habit.id, date);
      } else {
        await markHabitComplete(habit.id, date);
      }
      
      // Recargar completados para mantener la vista actualizada
      const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
      fetchCompletions(startDate, endDate);
    } catch (err) {
      console.error('Error toggling habit completion:', err);
      Alert.alert('Error', 'No se pudo actualizar el estado del hábito. Intenta nuevamente.');
    }
  };
  
  const editHabit = (habit: Habit) => {
    setEditingHabit(habit);
    setHabitName(habit.name);
    setHabitDescription(habit.description || '');
    setHabitFrequency(habit.frequency);
    setHabitColor(habit.color);
    setSelectedPillar(habit.pillar_id);
    setIsModalVisible(true);
  };
  
  const resetForm = () => {
    setHabitName('');
    setHabitDescription('');
    setHabitFrequency('daily');
    setHabitColor('#8A84E2');
    setSelectedPillar(null);
    setEditingHabit(null);
  };
  
  const handleMonthChange = (month: number) => {
    if (month > 0) {
      setCurrentMonth(addMonths(currentMonth, 1));
    } else {
      setCurrentMonth(subMonths(currentMonth, 1));
    }
  };
  
  const renderCalendarView = () => {
    if (!selectedHabit) return null;
    
    const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    
    const completedDates = getCompletedDatesForHabit(selectedHabit.id, startDate, endDate);
    
    const markedDates: any = {};
    
    completedDates.forEach(dateStr => {
      markedDates[dateStr] = {
        selected: true,
        selectedColor: selectedHabit.color,
        marked: true
      };
    });
    
    // Marcar el día de hoy
    const today = format(new Date(), 'yyyy-MM-dd');
    if (!markedDates[today]) {
      markedDates[today] = {
        selected: false,
        marked: true,
        dotColor: '#FF6B6B'
      };
    }
    
    return (
      <View style={styles.calendarContainer}>
        <View style={styles.calendarHeader}>
          <TouchableOpacity onPress={() => handleMonthChange(-1)}>
            <ArrowLeft size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.calendarTitle}>
            {format(currentMonth, 'MMMM yyyy')}
          </Text>
          <TouchableOpacity onPress={() => handleMonthChange(1)}>
            <ArrowRight size={24} color="#333" />
          </TouchableOpacity>
        </View>
        
        <RNCalendar
          markedDates={markedDates}
          onDayPress={(day: {dateString: string}) => {
            const selectedDate = new Date(day.dateString);
            toggleHabitCompletion(selectedHabit, selectedDate);
          }}
          theme={{
            todayTextColor: '#FF6B6B',
            selectedDayBackgroundColor: selectedHabit.color,
            arrowColor: selectedHabit.color,
          }}
        />
        
        <View style={styles.calendarStats}>
          <Text style={styles.calendarStatsTitle}>Estadísticas</Text>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Tasa de éxito (últimos 7 días):</Text>
            <Text style={styles.statValue}>{getHabitSuccessRate(selectedHabit.id).toFixed(0)}%</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Tasa de éxito (últimos 30 días):</Text>
            <Text style={styles.statValue}>{getHabitSuccessRate(selectedHabit.id, 30).toFixed(0)}%</Text>
          </View>
        </View>
      </View>
    );
  };
  
  const renderHabitList = () => {
    if (loading) {
      return <Text style={styles.message}>Cargando hábitos...</Text>;
    }
    
    if (error) {
      return <Text style={styles.errorMessage}>{error}</Text>;
    }
    
    if (habits.length === 0) {
      return <Text style={styles.message}>No tienes hábitos creados. ¡Crea tu primer hábito!</Text>;
    }
    
    // Separar hábitos por frecuencia
    const dailyHabits = habits.filter(h => h.frequency === 'daily');
    const weeklyHabits = habits.filter(h => h.frequency === 'weekly');
    
    return (
      <>
        {dailyHabits.length > 0 && (
          <View style={styles.habitSection}>
            <Text style={styles.sectionTitle}>Hábitos Diarios</Text>
            {dailyHabits.map(habit => renderHabitItem(habit))}
          </View>
        )}
        
        {weeklyHabits.length > 0 && (
          <View style={styles.habitSection}>
            <Text style={styles.sectionTitle}>Hábitos Semanales</Text>
            {weeklyHabits.map(habit => renderHabitItem(habit))}
          </View>
        )}
      </>
    );
  };
  
  const renderHabitItem = (habit: Habit) => {
    const isCompleted = isHabitCompletedOnDate(habit.id);
    const successRate = getHabitSuccessRate(habit.id);
    
    const getPillarName = () => {
      if (!habit.pillar_id) return null;
      const pillar = pillars.find(p => p.id === habit.pillar_id);
      return pillar ? pillar.name : null;
    };
    
    const pillarName = getPillarName();
    
    return (
      <AnimatedView key={habit.id} animation="fade" style={styles.habitCard}>
        <View style={styles.habitHeader}>
          <View style={[styles.habitColorIndicator, { backgroundColor: habit.color }]} />
          <View style={styles.habitInfo}>
            <Text style={styles.habitName}>{habit.name}</Text>
            {pillarName && <Text style={styles.pillarTag}>{pillarName}</Text>}
            {habit.description ? <Text style={styles.habitDescription}>{habit.description}</Text> : null}
          </View>
        </View>
        
        <View style={styles.habitActions}>
          <TouchableOpacity 
            style={[styles.completionButton, isCompleted && styles.completedButton]} 
            onPress={() => toggleHabitCompletion(habit)}
          >
            {isCompleted ? (
              <Check size={20} color="#fff" />
            ) : (
              <View style={styles.emptyCheckCircle} />
            )}
            <Text style={[styles.completionText, isCompleted && styles.completedText]}>
              {isCompleted ? 'Completado' : 'Completar'}
            </Text>
          </TouchableOpacity>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => {
                setSelectedHabit(habit);
                setShowCalendarView(true);
              }}
            >
              <Calendar size={20} color="#333" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => editHabit(habit)}
            >
              <Edit2 size={20} color="#333" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleDeleteHabit(habit.id)}
            >
              <Trash2 size={20} color="#FF6B6B" />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.progressContainer}>
          <View style={styles.progressLabel}>
            <Text style={styles.progressText}>Consistencia:</Text>
            <Text style={styles.progressPercentage}>{successRate.toFixed(0)}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${successRate}%`, backgroundColor: habit.color }
              ]} 
            />
          </View>
        </View>
      </AnimatedView>
    );
  };
  
  const renderHabitForm = () => {
    return (
      <View style={styles.formContainer}>
        <View style={styles.formHeader}>
          <Text style={styles.formTitle}>
            {editingHabit ? 'Editar Hábito' : 'Nuevo Hábito'}
          </Text>
          <TouchableOpacity onPress={() => {
            resetForm();
            setIsModalVisible(false);
          }}>
            <XCircle size={24} color="#333" />
          </TouchableOpacity>
        </View>
        
        <Input
          label="Nombre del hábito"
          value={habitName}
          onChangeText={setHabitName}
          placeholder="Ej: Meditar 10 minutos"
        />
        
        <Input
          label="Descripción (opcional)"
          value={habitDescription}
          onChangeText={setHabitDescription}
          placeholder="Ej: Sentarse y enfocarse en la respiración"
          multiline
        />
        
        <View style={styles.formSection}>
          <Text style={styles.sectionLabel}>Frecuencia</Text>
          <View style={styles.radioGroup}>
            <TouchableOpacity
              style={[
                styles.radioOption,
                habitFrequency === 'daily' && styles.radioSelected
              ]}
              onPress={() => setHabitFrequency('daily')}
            >
              <Text style={styles.radioText}>Diaria</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.radioOption,
                habitFrequency === 'weekly' && styles.radioSelected
              ]}
              onPress={() => setHabitFrequency('weekly')}
            >
              <Text style={styles.radioText}>Semanal</Text>
            </TouchableOpacity>
          </View>
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
                  habitColor === color && styles.colorSelected
                ]}
                onPress={() => setHabitColor(color)}
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
        
        <Button
          title={editingHabit ? "Guardar Cambios" : "Crear Hábito"}
          onPress={editingHabit ? handleUpdateHabit : handleCreateHabit}
          variant="primary"
        />
      </View>
    );
  };
  
  return (
    <View style={styles.container}>
      {showCalendarView && selectedHabit ? (
        <View style={styles.calendarView}>
          <View style={styles.calendarViewHeader}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => {
                setShowCalendarView(false);
                setSelectedHabit(null);
              }}
            >
              <ArrowLeft size={24} color="#333" />
              <Text style={styles.backButtonText}>Volver</Text>
            </TouchableOpacity>
            <Text style={styles.calendarViewTitle}>{selectedHabit.name}</Text>
          </View>
          {renderCalendarView()}
        </View>
      ) : (
        <>
          <View style={styles.header}>
            <Text style={styles.title}>Hábitos</Text>
            <Button
              title="Nuevo Hábito"
              onPress={() => {
                resetForm();
                setIsModalVisible(true);
              }}
              icon={<Plus size={18} color="#fff" />}
              variant="primary"
            />
          </View>
          
          <ScrollView style={styles.content}>
            {renderHabitList()}
            
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
              {renderHabitForm()}
            </ScrollView>
          </Modal>
        </>
      )}
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
  habitSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#495057',
  },
  habitCard: {
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
  habitHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  habitColorIndicator: {
    width: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  habitInfo: {
    flex: 1,
  },
  habitName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  habitDescription: {
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
  habitActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  completionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f1f3f5',
    borderRadius: 20,
  },
  completedButton: {
    backgroundColor: '#4ECDC4',
  },
  emptyCheckCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#6c757d',
  },
  completionText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6c757d',
  },
  completedText: {
    color: '#fff',
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    marginLeft: 12,
    padding: 8,
  },
  progressContainer: {
    marginTop: 4,
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
    height: 6,
    backgroundColor: '#e9ecef',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
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
  radioGroup: {
    flexDirection: 'row',
  },
  radioOption: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#e9ecef',
    marginRight: 12,
  },
  radioSelected: {
    backgroundColor: '#4ECDC4',
  },
  radioText: {
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
  bottomSpace: {
    height: 80,
  },
  calendarView: {
    flex: 1,
    backgroundColor: '#fff',
  },
  calendarViewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    marginLeft: 4,
    color: '#333',
  },
  calendarViewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 16,
    color: '#333',
    flex: 1,
  },
  calendarContainer: {
    padding: 16,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calendarTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textTransform: 'capitalize',
  },
  calendarStats: {
    marginTop: 24,
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
  },
  calendarStatsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#6c757d',
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#495057',
  },
});

export default HabitsScreen;