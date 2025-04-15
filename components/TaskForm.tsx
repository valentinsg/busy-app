import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Modal } from 'react-native';
import { useSupabase } from '../context/SupabaseProvider';
import { Database } from '@/types/schema';
import { Tag } from 'lucide-react-native';
import { Input } from './Input';
import { Button } from './Button';
import { Picker } from '@react-native-picker/picker';
import { DatePicker } from './DatePicker';  

type Task = Database['public']['Tables']['tasks']['Row'];
type NewTask = Omit<Task, 'id' | 'user_id' | 'created_at'>;
type TagType = Database['public']['Tables']['tags']['Row'];

interface TaskFormProps {
  initialData?: Partial<Task>;
  onSubmit: (task: NewTask) => void;
  onCancel: () => void;
}

export const TaskForm = ({ initialData, onSubmit, onCancel }: TaskFormProps) => {
  const { supabase, user } = useSupabase();
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [priority, setPriority] = useState<Task['priority']>(initialData?.priority || 'medium');
  const [category, setCategory] = useState<Task['category']>(initialData?.category || 'other');
  const [dueDate, setDueDate] = useState<Date>(
    initialData?.due_date ? new Date(initialData.due_date) : new Date()
  );
  const [scheduledTime, setScheduledTime] = useState<Date>(
    initialData?.scheduled_time ? new Date(initialData.scheduled_time) : new Date()
  );
  const [selectedTags, setSelectedTags] = useState<string[]>(initialData?.tags || []);
  const [availableTags, setAvailableTags] = useState<TagType[]>([]);
  const [isTagsModalVisible, setIsTagsModalVisible] = useState(false);

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .eq('user_id', user?.id)
        .order('name');

      if (error) throw error;
      setAvailableTags(data || []);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const handleSubmit = () => {
    const combinedDate = new Date(dueDate);
    combinedDate.setHours(
      scheduledTime.getHours(),
      scheduledTime.getMinutes(),
      scheduledTime.getSeconds()
    );
    
    const taskData: NewTask = {
      title,
      description: description || null,
      priority,
      category,
      color: initialData?.color || null,
      due_date: combinedDate.toISOString(),
      scheduled_time: scheduledTime.toISOString(),
      tags: selectedTags,
      completed: initialData?.completed || false,
    };
    
    onSubmit(taskData);
  };

  const toggleTag = (tagName: string) => {
    setSelectedTags(prev => 
      prev.includes(tagName)
        ? prev.filter(t => t !== tagName)
        : [...prev, tagName]
    );
  };

  const TagsModal = () => (
    <Modal
      visible={isTagsModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setIsTagsModalVisible(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Seleccionar etiquetas</Text>
            <TouchableOpacity
              onPress={() => setIsTagsModalVisible(false)}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.tagsGrid}>
            {availableTags.map(tag => (
              <TouchableOpacity
                key={tag.id}
                style={[
                  styles.tagOption,
                  selectedTags.includes(tag.name) && styles.tagOptionSelected
                ]}
                onPress={() => toggleTag(tag.name)}
              >
                <Tag size={16} color={tag.color} />
                <Text style={styles.tagOptionText}>{tag.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <ScrollView style={styles.container}>
      <Input
        label="Título"
        value={title}
        onChangeText={setTitle}
        placeholder="Título de la tarea"
      />
      
      <Input
        label="Descripción"
        value={description}
        onChangeText={setDescription}
        placeholder="Descripción de la tarea"
        multiline
      />

      <View style={styles.pickerContainer}>
        <Text style={styles.label}>Prioridad</Text>
        <Picker
          selectedValue={priority}
          onValueChange={(value) => setPriority(value as Task['priority'])}
        >
          <Picker.Item label="Baja" value="low" />
          <Picker.Item label="Media" value="medium" />
          <Picker.Item label="Alta" value="high" />
        </Picker>
      </View>

      <View style={styles.pickerContainer}>
        <Text style={styles.label}>Categoría</Text>
        <Picker
          selectedValue={category}
          onValueChange={(value) => setCategory(value as Task['category'])}
        >
          <Picker.Item label="Trabajo" value="work" />
          <Picker.Item label="Personal" value="personal" />
          <Picker.Item label="Salud" value="health" />
          <Picker.Item label="Otro" value="other" />
        </Picker>
      </View>

      <View style={styles.dateContainer}>
        <DatePicker
          label="Fecha de vencimiento"
          value={dueDate}
          onChange={setDueDate}
          mode="date"
          minimumDate={new Date()}
        />
      </View>

      <View style={styles.dateContainer}>
        <DatePicker
          label="Hora programada"
          value={scheduledTime}
          onChange={setScheduledTime}
          mode="time"
        />
      </View>

      <View style={styles.tagsSection}>
        <Text style={styles.label}>Etiquetas seleccionadas</Text>
        <TouchableOpacity
          style={styles.addTagButton}
          onPress={() => setIsTagsModalVisible(true)}
        >
          <Tag size={20} color="#666" />
          <Text style={styles.addTagButtonText}>Gestionar etiquetas</Text>
        </TouchableOpacity>

        <View style={styles.selectedTagsContainer}>
          {selectedTags.map((tagName, index) => {
            const tag = availableTags.find(t => t.name === tagName);
            return (
              <View key={index} style={styles.selectedTag}>
                <Tag size={16} color={tag?.color || '#666'} />
                <Text style={styles.selectedTagText}>{tagName}</Text>
                <TouchableOpacity
                  onPress={() => toggleTag(tagName)}
                  style={styles.removeTagButton}
                >
                  <Text style={styles.removeTagButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </View>

      <TagsModal />

      <View style={styles.buttonsContainer}>
        <Button title="Cancelar" onPress={onCancel} variant="secondary" />
        <Button title="Guardar" onPress={handleSubmit} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  pickerContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  dateContainer: {
    marginBottom: 16,
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
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
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
  tagsGrid: {
    maxHeight: 300,
  },
  tagOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f5f5f5',
    gap: 8,
  },
  tagOptionSelected: {
    backgroundColor: '#e0e0e0',
  },
  tagOptionText: {
    fontSize: 16,
  },
  tagsSection: {
    marginBottom: 16,
  },
  addTagButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  addTagButtonText: {
    fontSize: 16,
    color: '#666',
  },
  selectedTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6,
  },
  selectedTagText: {
    fontSize: 14,
    color: '#333',
  },
  removeTagButton: {
    padding: 2,
  },
  removeTagButtonText: {
    fontSize: 14,
    color: '#999',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
}); 