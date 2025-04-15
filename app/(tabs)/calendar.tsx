import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { AnimatedView } from '../../components/AnimatedView';
import { useTasks } from '../../hooks/useTasks';
import { useJournal } from '../../hooks/useJournal';
import { Database } from '../../types/schema';
import { CalendarIcon, CircleCheck, Circle, MoreVertical, Clock, Tag, BookOpen } from 'lucide-react-native';
import { Button } from '../../components/Button';

// Formato de fecha manual sin date-fns
const formatDate = (date: Date): string => {
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

  const day = days[date.getDay()];
  const dayNum = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  return `${day} ${dayNum} de ${month} ${year}`;
};

// Formato para fechas en yyyy-MM-dd
const toISODateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

type Task = Database['public']['Tables']['tasks']['Row'];
type JournalEntry = Database['public']['Tables']['journal_entries']['Row'];

// Tipo para los marcadores del calendario
type MarkedDates = {
  [date: string]: {
    dots?: Array<{ key: string, color: string, selectedDotColor: string }>;
    selected?: boolean;
    marked?: boolean;
    selectedColor?: string;
  };
};

const getPriorityColor = (priority: Task['priority']) => {
  const colors = {
    low: '#4ECDC4',
    medium: '#FFD166',
    high: '#FF6B6B',
  };
  return colors[priority];
};

const PriorityIndicator = ({ priority }: { priority: Task['priority'] }) => {
  const dots = {
    low: 1,
    medium: 2,
    high: 3
  };

  const color = {
    low: '#4ECDC4',
    medium: '#FFD166',
    high: '#FF6B6B'
  };

  return (
    <View style={styles.priorityContainer}>
      {[...Array(3)].map((_, i) => (
        <View
          key={i}
          style={[
            styles.priorityDot,
            {
              backgroundColor: i < dots[priority] ? color[priority] : '#eee'
            }
          ]}
        />
      ))}
    </View>
  );
};

export default function CalendarScreen() {
  const { tasks } = useTasks();
  const { entries, fetchEntries } = useJournal();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedDateTasks, setSelectedDateTasks] = useState<Task[]>([]);
  const [selectedDateEntries, setSelectedDateEntries] = useState<JournalEntry[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Task | null>(null);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  // Preparar los datos para el calendario
  const markedDates = {
    ...tasks.reduce((acc: any, task: Task) => {
      if (task.due_date) {
        const dateStr = task.due_date.split('T')[0];

        if (!acc[dateStr]) {
          acc[dateStr] = {
            dots: [],
            marked: true,
            selected: dateStr === toISODateString(selectedDate),
            selectedColor: 'rgba(51, 51, 51, 0.1)'
          };
        }

        acc[dateStr].dots.push({
          key: task.id,
          color: task.color || getPriorityColor(task.priority),
          selectedDotColor: '#fff'
        });
      }
      return acc;
    }, {}),
    ...entries.reduce((acc: any, entry: JournalEntry) => {
      const dateStr = entry.date;

      if (!acc[dateStr]) {
        acc[dateStr] = {
          dots: [],
          marked: true,
          selected: dateStr === toISODateString(selectedDate),
          selectedColor: 'rgba(51, 51, 51, 0.1)'
        };
      }

      acc[dateStr].dots.push({
        key: entry.id,
        color: '#8E44AD', // Color para entradas de diario
        selectedDotColor: '#fff'
      });

      return acc;
    }, {})
  };

  // Actualizar los elementos cuando cambia la fecha seleccionada
  useEffect(() => {
    if (selectedDate) {
      const dateStr = toISODateString(selectedDate);
      const filteredTasks = tasks.filter(
        task => task.due_date && task.due_date.startsWith(dateStr)
      );
      const filteredEntries = entries.filter(
        entry => entry.date === dateStr
      );

      setSelectedDateTasks(filteredTasks);
      setSelectedDateEntries(filteredEntries);
    }
  }, [selectedDate, tasks, entries]);

  const handleDayPress = (day: DateData) => {
    setSelectedDate(new Date(day.timestamp));
  };

  const handleItemPress = (item: Task) => {
    setSelectedItem(item);
    setModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <AnimatedView animation="slide" style={styles.header}>
        <View>
          <Text style={styles.title}>Calendario</Text>
        </View>
      </AnimatedView>

      <View style={styles.calendarContainer}>
        <Calendar
          onDayPress={(day: DateData) => setSelectedDate(new Date(day.timestamp))}
          markingType="multi-dot"
          markedDates={markedDates}
          theme={{
            selectedDayBackgroundColor: '#333',
            todayTextColor: '#333',
            dotColor: '#333',
            arrowColor: '#333',
            monthTextColor: '#333',
            textDayFontSize: 16,
            textMonthFontSize: 20,
            textDayHeaderFontSize: 14,
            'stylesheet.calendar.main': {
              week: {
                marginTop: 2,
                marginBottom: 2,
                flexDirection: 'row',
                justifyContent: 'space-around'
              }
            }
          }}
        />
      </View>

      <View style={styles.selectedDateHeader}>
        <Text style={styles.selectedDateText}>{formatDate(selectedDate)}</Text>
      </View>

      <ScrollView style={styles.itemsList}>
        {selectedDateTasks.length === 0 && selectedDateEntries.length === 0 ? (
          <View style={styles.emptyState}>
            <CalendarIcon size={48} color="#ccc" />
            <Text style={styles.emptyStateText}>No hay elementos para este día</Text>
          </View>
        ) : (
          <View style={styles.itemsContainer}>
            {selectedDateEntries.map((entry) => (
              <View
                key={entry.id}
                style={[styles.itemCard, { borderLeftColor: '#8E44AD' }]}
              >
                <View style={styles.itemHeader}>
                  <View style={styles.itemHeaderLeft}>
                    <BookOpen size={20} color="#8E44AD" />
                    <Text style={styles.itemTitle}>Entrada de diario</Text>
                  </View>
                </View>


                <Text style={styles.journalContent}>{entry.content}</Text>

                {entry.mood && (
                  <View style={styles.moodIndicator}>
                    <Text style={styles.moodText}>Estado: {entry.mood}</Text>
                  </View>
                )}

                {entry.tags && entry.tags.length > 0 && (
                  <View style={styles.tagsContainer}>
                    {entry.tags.map((tag: string, index: number) => (
                      <View key={index} style={styles.tag}>
                        <Tag size={14} color="#666" />
                        <Text style={styles.tagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}

            {selectedDateTasks.map((task) => (
              <TouchableOpacity
                key={task.id}
                style={[
                  styles.itemCard,
                  { borderLeftColor: task.color || getPriorityColor(task.priority) }
                ]}
                onPress={() => {
                  setSelectedItem(task);
                  setModalVisible(true);
                }}
              >
                <View style={styles.itemHeader}>
                  <View style={styles.itemHeaderLeft}>
                    {task.completed ? (
                      <CircleCheck size={20} color="#333" />
                    ) : (
                      <Circle size={20} color="#999" />
                    )}
                    <Text style={styles.itemTitle}>{task.title}</Text>
                  </View>
                </View>

                {task.description && (
                  <Text style={styles.description} numberOfLines={2}>
                    {task.description}
                  </Text>
                )}

                {task.tags && task.tags.length > 0 && (
                  <View style={styles.tagsContainer}>
                    {task.tags.map((tag: string, index: number) => (
                      <View key={index} style={styles.tag}>
                        <Tag size={14} color="#666" />
                        <Text style={styles.tagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          {selectedItem && (
            <View
              style={[
                styles.modalContent,
                { borderTopColor: selectedItem.color || getPriorityColor(selectedItem.priority) }
              ]}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Detalles</Text>
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  style={styles.closeButton}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <Text style={styles.modalItemTitle}>{selectedItem.title}</Text>

                {selectedItem.description && (
                  <Text style={styles.modalItemDescription}>
                    {selectedItem.description}
                  </Text>
                )}

                <View style={styles.modalMeta}>
                  <Text style={styles.modalMetaItem}>
                    Prioridad: <Text style={{ fontWeight: 'bold' }}>{selectedItem.priority}</Text>
                  </Text>
                  <Text style={styles.modalMetaItem}>
                    Categoría: <Text style={{ fontWeight: 'bold' }}>{selectedItem.category || 'Sin categoría'}</Text>
                  </Text>
                </View>

                {selectedItem.tags && selectedItem.tags.length > 0 && (
                  <View style={styles.modalTags}>
                    {selectedItem.tags.map((tag: string, index: number) => (
                      <View key={index} style={styles.tag}>
                        <Text style={styles.tagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              <View style={styles.modalFooter}>
                <Button
                  title="Cerrar"
                  onPress={() => setModalVisible(false)}
                  variant="secondary"
                />
              </View>
            </View>
          )}
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  calendarContainer: {
    backgroundColor: '#fff',
  },
  selectedDateHeader: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedDateText: {
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  itemsList: {
    flex: 1,
    padding: 15,
  },
  itemsContainer: {
    gap: 10,
  },
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  description: {
    marginTop: 8,
    marginLeft: 30,
    fontSize: 14,
    color: '#666',
  },
  journalContent: {
    marginTop: 10,
    marginLeft: 30,
    fontSize: 14,
    color: '#333',
  },
  moodIndicator: {
    marginTop: 8,
    marginLeft: 30,
    backgroundColor: '#f5f5f5',
    padding: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  moodText: {
    fontSize: 12,
    color: '#666',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    marginLeft: 30,
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 4,
  },
  tagText: {
    fontSize: 12,
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateText: {
    marginTop: 10,
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 4,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
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
  modalBody: {
    padding: 20,
  },
  modalItemTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalItemDescription: {
    fontSize: 16,
    color: '#333',
    marginBottom: 15,
  },
  modalMeta: {
    marginBottom: 15,
  },
  modalMetaItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  modalTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  priorityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 4,
    marginRight: 10,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 2,
  },
}); 