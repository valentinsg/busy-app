import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Alert, ActivityIndicator } from 'react-native';
import { Play, Pause, SkipForward, Edit2,  XCircle, CheckCircle, PieChart } from 'lucide-react-native';
import { format} from 'date-fns';
import { AnimatedView } from '../../components/AnimatedView';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { useFocus } from '../../hooks/useFocus';
import { useTasks } from '../../hooks/useTasks';

const SESSION_TYPES = [
  { type: 'focus', label: 'Enfoque', color: '#FF6B6B', duration: 25 * 60 },
  { type: 'break', label: 'Descanso', color: '#4ECDC4', duration: 5 * 60 },
  { type: 'long_break', label: 'Descanso Largo', color: '#118AB2', duration: 15 * 60 }
];

const FocusScreen = () => {
  const { 
    currentSession,
    sessionState,
    timeRemaining,
    currentType,
    loading,
    error,
    focusCount,
    formattedTimeRemaining,
    startSession,
    pauseSession,
    resumeSession,
    completeSession,
    cancelSession,
    addSessionNote,
    getSessionStats,
    sessions,
    fetchSessions,
    setSessionDuration
  } = useFocus();
  
  const { tasks } = useTasks();
  
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [sessionNote, setSessionNote] = useState('');
  const [showStats, setShowStats] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [customMinutes, setCustomMinutes] = useState('25');
  const [showSettings, setShowSettings] = useState(false);
  
  useEffect(() => {
    fetchSessions();
    loadStats();
  }, [fetchSessions]);
  
  const loadStats = async () => {
    const sessionStats = await getSessionStats(7);
    setStats(sessionStats);
  };
  
  const handleStart = async (type: 'focus' | 'break' | 'long_break' = 'focus') => {
    try {
      await startSession(type, selectedTaskId || undefined);
      setIsModalVisible(false);
    } catch (err) {
      console.error('Error starting session:', err);
      Alert.alert('Error', 'No se pudo iniciar la sesión');
    }
  };
  
  const handlePause = async () => {
    try {
      await pauseSession();
    } catch (err) {
      console.error('Error pausing session:', err);
      Alert.alert('Error', 'No se pudo pausar la sesión');
    }
  };
  
  const handleResume = () => {
    try {
      resumeSession();
    } catch (err) {
      console.error('Error resuming session:', err);
      Alert.alert('Error', 'No se pudo reanudar la sesión');
    }
  };
  
  const handleComplete = async () => {
    try {
      await completeSession();
      loadStats();
    } catch (err) {
      console.error('Error completing session:', err);
      Alert.alert('Error', 'No se pudo completar la sesión');
    }
  };
  
  const handleCancel = async () => {
    try {
      Alert.alert(
        'Cancelar sesión',
        '¿Estás seguro de que quieres cancelar esta sesión? No se guardará ningún registro.',
        [
          { text: 'No', style: 'cancel' },
          { 
            text: 'Sí', 
            style: 'destructive',
            onPress: async () => {
              await cancelSession();
              setSelectedTaskId(null);
            }
          }
        ]
      );
    } catch (err) {
      console.error('Error canceling session:', err);
      Alert.alert('Error', 'No se pudo cancelar la sesión');
    }
  };
  
  const handleSaveNote = async () => {
    try {
      if (!sessionNote.trim()) {
        Alert.alert('Error', 'Por favor escribe una nota para guardar');
        return;
      }
      
      await addSessionNote(sessionNote.trim());
      setSessionNote('');
      Alert.alert('Éxito', 'Nota guardada correctamente');
    } catch (err) {
      console.error('Error saving note:', err);
      Alert.alert('Error', 'No se pudo guardar la nota');
    }
  };
  
  const handleSetCustomDuration = () => {
    const minutes = parseInt(customMinutes);
    if (isNaN(minutes) || minutes <= 0 || minutes > 120) {
      Alert.alert('Error', 'Por favor ingresa un número válido entre 1 y 120');
      return;
    }
    
    setSessionDuration(minutes * 60);
    setShowSettings(false);
  };
  
  const getActiveSessionInfo = () => {
    const sessionTypeInfo = SESSION_TYPES.find(t => t.type === currentType);
    return sessionTypeInfo || SESSION_TYPES[0];
  };
  
  const getActiveTaskName = () => {
    if (!selectedTaskId) return null;
    const task = tasks.find(t => t.id === selectedTaskId);
    return task ? task.title : 'Tarea seleccionada';
  };
  
  const renderSessionsList = () => {
    if (sessions.length === 0) {
      return (
        <Text style={styles.emptyMessage}>
          No hay sesiones registradas. ¡Comienza tu primera sesión de enfoque!
        </Text>
      );
    }
    
    // Agrupar sesiones por día
    const groupedSessions: Record<string, any[]> = {};
    
    sessions.forEach(session => {
      const date = format(new Date(session.start_time), 'yyyy-MM-dd');
      if (!groupedSessions[date]) {
        groupedSessions[date] = [];
      }
      groupedSessions[date].push(session);
    });
    
    return Object.entries(groupedSessions).map(([date, daySessions]) => {
      const totalDuration = daySessions.reduce((total, session) => {
        return total + (session.duration_seconds || 0);
      }, 0);
      
      const dateObj = new Date(date);
      let formattedDate = format(dateObj, 'EEEE, d MMMM yyyy');
      formattedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
      
      return (
        <View key={date} style={styles.daySessionsContainer}>
          <View style={styles.dayHeader}>
            <Text style={styles.dayDate}>{formattedDate}</Text>
            <Text style={styles.dayTotal}>
              Total: {Math.floor(totalDuration / 60)} min
            </Text>
          </View>
          
          {daySessions.map(session => {
            const startTime = format(new Date(session.start_time), 'HH:mm');
            let endTime = '-';
            if (session.end_time) {
              endTime = format(new Date(session.end_time), 'HH:mm');
            }
            
            const durationMinutes = session.duration_seconds 
              ? Math.floor(session.duration_seconds / 60)
              : '-';
              
            let sessionColor = '#FF6B6B'; // Default color for focus
            if (session.type === 'break') sessionColor = '#4ECDC4';
            if (session.type === 'long_break') sessionColor = '#118AB2';
            
            return (
              <View key={session.id} style={styles.sessionItem}>
                <View style={[styles.sessionTypeIndicator, { backgroundColor: sessionColor }]} />
                <View style={styles.sessionInfo}>
                  <Text style={styles.sessionTime}>
                    {startTime} - {endTime}
                  </Text>
                  <Text style={styles.sessionDuration}>
                    {durationMinutes !== '-' ? `${durationMinutes} minutos` : 'En curso'}
                  </Text>
                  {session.notes && (
                    <Text style={styles.sessionNotes}>{session.notes}</Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      );
    });
  };
  
  const renderStatsView = () => {
    if (!stats) {
      return <ActivityIndicator size="large" color="#FF6B6B" />;
    }
    
    return (
      <View style={styles.statsContainer}>
        <View style={styles.statsSummary}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.totalHours}</Text>
            <Text style={styles.statLabel}>Horas</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.totalMinutes % 60}</Text>
            <Text style={styles.statLabel}>Minutos</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.completedSessions}</Text>
            <Text style={styles.statLabel}>Sesiones</Text>
          </View>
        </View>
        
        <View style={styles.statsDetails}>
          <Text style={styles.statsTitle}>Resumen de la semana</Text>
          <Text style={styles.statsSubtitle}>
            Promedio diario: {Math.round(stats.avgMinutesPerDay)} minutos
          </Text>
        </View>
      </View>
    );
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Enfoque</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.statsButton}
            onPress={() => setShowStats(!showStats)}
          >
            <PieChart size={20} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={() => setShowSettings(true)}
          >
            <Edit2 size={20} color="#333" />
          </TouchableOpacity>
        </View>
      </View>
      
      {showStats ? (
        <ScrollView style={styles.content}>
          {renderStatsView()}
          <View style={styles.closeStatsButtonContainer}>
            <Button
              title="Cerrar estadísticas"
              variant="secondary"
              onPress={() => setShowStats(false)}
            />
          </View>
        </ScrollView>
      ) : (
        <>
          <View style={styles.timerContainer}>
            {sessionState === 'idle' ? (
              <AnimatedView animation="fade" style={styles.timerIdle}>
                <View style={styles.sessionTypeButtons}>
                  {SESSION_TYPES.map(sessionType => (
                    <TouchableOpacity
                      key={sessionType.type}
                      style={[
                        styles.sessionTypeButton,
                        { backgroundColor: sessionType.color },
                        currentType === sessionType.type && styles.sessionTypeButtonActive
                      ]}
                      onPress={() => {
                        setIsModalVisible(true);
                        // @ts-ignore
                        setCurrentType(sessionType.type);
                      }}
                    >
                      <Text style={styles.sessionTypeText}>{sessionType.label}</Text>
                      <Text style={styles.sessionTypeDuration}>
                        {Math.floor(sessionType.duration / 60)} min
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </AnimatedView>
            ) : (
              <AnimatedView animation="scale" style={styles.activeTimer}>
                <View 
                  style={[
                    styles.timerCircle, 
                    { borderColor: getActiveSessionInfo().color }
                  ]}
                >
                  <Text style={styles.timerText}>{formattedTimeRemaining()}</Text>
                  <Text style={styles.timerLabel}>{getActiveSessionInfo().label}</Text>
                  {selectedTaskId && (
                    <Text style={styles.timerTask}>{getActiveTaskName()}</Text>
                  )}
                </View>
                
                <View style={styles.timerControls}>
                  {sessionState === 'running' ? (
                    <TouchableOpacity
                      style={[styles.timerButton, styles.pauseButton]}
                      onPress={handlePause}
                    >
                      <Pause size={30} color="#fff" />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[styles.timerButton, styles.resumeButton]}
                      onPress={handleResume}
                    >
                      <Play size={30} color="#fff" />
                    </TouchableOpacity>
                  )}
                  
                  <TouchableOpacity
                    style={[styles.timerButton, styles.skipButton]}
                    onPress={handleComplete}
                  >
                    <SkipForward size={30} color="#fff" />
                  </TouchableOpacity>
                </View>
                
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleCancel}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                
                <View style={styles.noteContainer}>
                  <Input
                    placeholder="Añadir nota a esta sesión..."
                    value={sessionNote}
                    onChangeText={setSessionNote}
                    multiline
                  />
                  <Button
                    title="Guardar nota"
                    variant="secondary"
                    onPress={handleSaveNote}
                  />
                </View>
              </AnimatedView>
            )}
          </View>
          
          <View style={styles.sessionsListContainer}>
            <Text style={styles.sectionTitle}>Registro de sesiones</Text>
            <ScrollView style={styles.sessionsList}>
              {renderSessionsList()}
            </ScrollView>
          </View>
        </>
      )}
      
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Nueva sesión de {getActiveSessionInfo().label.toLowerCase()}
              </Text>
              <TouchableOpacity
                onPress={() => setIsModalVisible(false)}
              >
                <XCircle size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalSubtitle}>
              ¿Quieres vincular esta sesión a una tarea?
            </Text>
            
            <ScrollView style={styles.tasksList}>
              <TouchableOpacity 
                style={[
                  styles.taskOption,
                  !selectedTaskId && styles.taskOptionSelected
                ]}
                onPress={() => setSelectedTaskId(null)}
              >
                <View style={styles.taskCheck}>
                  {!selectedTaskId && <CheckCircle size={20} color="#FF6B6B" />}
                </View>
                <Text style={styles.taskOptionText}>Sin tarea específica</Text>
              </TouchableOpacity>
              
              {tasks.filter(t => !t.completed).map(task => (
                <TouchableOpacity 
                  key={task.id}
                  style={[
                    styles.taskOption,
                    selectedTaskId === task.id && styles.taskOptionSelected
                  ]}
                  onPress={() => setSelectedTaskId(task.id)}
                >
                  <View style={styles.taskCheck}>
                    {selectedTaskId === task.id && <CheckCircle size={20} color="#FF6B6B" />}
                  </View>
                  <Text style={styles.taskOptionText}>{task.title}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <Button
              title={`Iniciar ${getActiveSessionInfo().label.toLowerCase()}`}
              variant="primary"
              onPress={() => handleStart(getActiveSessionInfo().type as any)}
            />
          </View>
        </View>
      </Modal>
      
      <Modal
        visible={showSettings}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSettings(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Configuración</Text>
              <TouchableOpacity
                onPress={() => setShowSettings(false)}
              >
                <XCircle size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.settingsSection}>
              <Text style={styles.settingsSectionTitle}>Duración personalizada</Text>
              <View style={styles.customDurationInput}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <Input
                    label="Minutos (1-120)"
                    value={customMinutes}
                    onChangeText={setCustomMinutes}
                    keyboardType="number-pad"
                  />
                </View>
                <Button
                  title="Aplicar"
                  variant="secondary"
                  onPress={handleSetCustomDuration}
                />
              </View>
            </View>
            
            <View style={styles.settingsSection}>
              <Text style={styles.settingsSectionTitle}>Duración estándar</Text>
              <View style={styles.standardDurations}>
                {SESSION_TYPES.map(type => (
                  <View key={type.type} style={styles.durationItem}>
                    <Text style={styles.durationLabel}>{type.label}:</Text>
                    <Text style={styles.durationValue}>{Math.floor(type.duration / 60)} min</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>
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
  headerButtons: {
    flexDirection: 'row',
  },
  statsButton: {
    padding: 8,
    marginRight: 8,
  },
  settingsButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  timerContainer: {
    padding: 16,
    alignItems: 'center',
  },
  timerIdle: {
    width: '100%',
  },
  sessionTypeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sessionTypeButton: {
    flex: 1,
    margin: 6,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  sessionTypeButtonActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  sessionTypeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  sessionTypeDuration: {
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  activeTimer: {
    alignItems: 'center',
    width: '100%',
  },
  timerCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  timerText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#333',
  },
  timerLabel: {
    fontSize: 18,
    color: '#6c757d',
    marginTop: 4,
  },
  timerTask: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  timerControls: {
    flexDirection: 'row',
    marginTop: 24,
  },
  timerButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  pauseButton: {
    backgroundColor: '#FF6B6B',
  },
  resumeButton: {
    backgroundColor: '#4ECDC4',
  },
  skipButton: {
    backgroundColor: '#6c757d',
  },
  cancelButton: {
    marginTop: 16,
    padding: 8,
  },
  cancelButtonText: {
    color: '#FF6B6B',
  },
  noteContainer: {
    width: '100%',
    marginTop: 16,
  },
  sessionsListContainer: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#495057',
  },
  sessionsList: {
    flex: 1,
  },
  emptyMessage: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginTop: 24,
  },
  daySessionsContainer: {
    marginBottom: 24,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dayDate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#495057',
  },
  dayTotal: {
    fontSize: 14,
    color: '#6c757d',
  },
  sessionItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  sessionTypeIndicator: {
    width: 4,
    borderRadius: 2,
    marginRight: 12,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionTime: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#495057',
  },
  sessionDuration: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 2,
  },
  sessionNotes: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#6c757d',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#6c757d',
    marginBottom: 16,
  },
  tasksList: {
    maxHeight: 200,
    marginBottom: 16,
  },
  taskOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f1f3f5',
  },
  taskOptionSelected: {
    backgroundColor: '#FFE0E0',
  },
  taskCheck: {
    width: 24,
    height: 24,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskOptionText: {
    fontSize: 16,
    color: '#495057',
  },
  statsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statsSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  statLabel: {
    fontSize: 14,
    color: '#6c757d',
  },
  statsDetails: {
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    paddingTop: 16,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#495057',
    marginBottom: 8,
  },
  statsSubtitle: {
    fontSize: 14,
    color: '#6c757d',
  },
  closeStatsButtonContainer: {
    marginBottom: 16,
  },
  settingsSection: {
    marginBottom: 20,
  },
  settingsSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#495057',
  },
  customDurationInput: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  standardDurations: {
    backgroundColor: '#f1f3f5',
    borderRadius: 8,
    padding: 12,
  },
  durationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  durationLabel: {
    fontSize: 14,
    color: '#495057',
  },
  durationValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#495057',
  },
});

export default FocusScreen;