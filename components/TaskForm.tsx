import { useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Input } from './Input';
import { Button } from './Button';
import { Picker } from '@react-native-picker/picker';
import { Database } from '../types/schema';
import { ColorPicker } from './ColorPicker';
import { DatePicker } from './DatePicker';

type Task = Database['public']['Tables']['tasks']['Row'];
type NewTask = Omit<Task, 'id' | 'user_id' | 'created_at'>;

interface TaskFormProps {
  initialData?: Partial<Task>;
  onSubmit: (task: NewTask) => void;
  onCancel: () => void;
}

const PRIORITY_COLORS = {
  low: '#4cd964',
  medium: '#ffcc00',
  high: '#ff4444',
};

export const TaskForm = ({ initialData, onSubmit, onCancel }: TaskFormProps) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [priority, setPriority] = useState<Task['priority']>(initialData?.priority || 'medium');
  const [category, setCategory] = useState<Task['category']>(initialData?.category || 'other');
  const [color, setColor] = useState(initialData?.color || PRIORITY_COLORS[priority]);
  const [dueDate, setDueDate] = useState<Date>(
    initialData?.due_date ? new Date(initialData.due_date) : new Date()
  );
  const [scheduledTime, setScheduledTime] = useState<Date>(
    initialData?.scheduled_time ? new Date(initialData.scheduled_time) : new Date()
  );
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [newTag, setNewTag] = useState('');

  const handleSubmit = () => {
    const taskData: NewTask = {
      title,
      description: description || null,
      priority,
      category,
      color,
      due_date: dueDate.toISOString().split('T')[0],
      scheduled_time: scheduledTime.toTimeString().split(' ')[0],
      tags,
      completed: false,
    };
    onSubmit(taskData);
  };

  return (
    <View style={styles.container}>
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
          onValueChange={(value) => {
            setPriority(value as Task['priority']);
            setColor(PRIORITY_COLORS[value as keyof typeof PRIORITY_COLORS]);
          }}
        >
          <Picker.Item label="Baja" value="low" color={PRIORITY_COLORS.low} />
          <Picker.Item label="Media" value="medium" color={PRIORITY_COLORS.medium} />
          <Picker.Item label="Alta" value="high" color={PRIORITY_COLORS.high} />
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

      <View style={styles.colorContainer}>
        <Text style={styles.label}>Color personalizado</Text>
        <ColorPicker
          color={color}
          onColorChange={setColor}
          style={styles.colorPicker}
        />
      </View>

      <View style={styles.tagsContainer}>
        <Input
          label="Etiquetas"
          value={newTag}
          onChangeText={setNewTag}
          placeholder="Agregar etiqueta"
          onSubmitEditing={() => {
            if (newTag.trim()) {
              setTags([...tags, newTag.trim()]);
              setNewTag('');
            }
          }}
        />
        <View style={styles.tagsList}>
          {tags.map((tag, index) => (
            <Button
              key={index}
              title={tag}
              variant="secondary"
              onPress={() => setTags(tags.filter((_, i) => i !== index))}
            />
          ))}
        </View>
      </View>

      <View style={styles.buttonsContainer}>
        <Button title="Cancelar" onPress={onCancel} variant="secondary" />
        <Button title="Guardar" onPress={handleSubmit} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#e1e1e1',
    borderRadius: 8,
    marginBottom: 16,
  },
  dateContainer: {
    gap: 8,
  },
  colorContainer: {
    gap: 8,
  },
  colorPicker: {
    height: 40,
    borderRadius: 8,
  },
  tagsContainer: {
    gap: 8,
  },
  tagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
}); 