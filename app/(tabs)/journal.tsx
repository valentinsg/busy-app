import { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, Text, TouchableOpacity, Modal, Alert, Platform } from 'react-native';
import { Save, Calendar, Smile, Tag as TagIcon } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { AnimatedView } from '../../components/AnimatedView';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { useJournal } from '../../hooks/useJournal';

const MOODS = [
  { label: 'Muy Feliz', value: 'very_happy', color: '#4CAF50' },
  { label: 'Feliz', value: 'happy', color: '#8BC34A' },
  { label: 'Neutral', value: 'neutral', color: '#FFC107' },
  { label: 'Triste', value: 'sad', color: '#FF9800' },
  { label: 'Muy Triste', value: 'very_sad', color: '#F44336' },
];

export default function JournalScreen() {
  const { addEntry, fetchEntries, entries } = useJournal();
  const [entry, setEntry] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedMood, setSelectedMood] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [showMoodPicker, setShowMoodPicker] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      await fetchEntries();
    } catch (error) {
      console.error('Error loading entries:', error);
      Alert.alert(
        'Error',
        'No se pudieron cargar las entradas. Por favor, intenta nuevamente.'
      );
    }
  };

  const handleSave = async () => {
    if (!entry.trim()) {
      Alert.alert('Error', 'Por favor, escribe algo en tu entrada');
      return;
    }

    try {
      setLoading(true);
      const result = await addEntry(entry.trim(), selectedMood, tags);
      
      if (result) {
        setEntry('');
        setSelectedMood('');
        setTags([]);
        Alert.alert('¡Éxito!', 'Tu entrada se ha guardado correctamente');
      } else {
        Alert.alert(
          'Error',
          'No se pudo guardar la entrada. Por favor, intenta nuevamente.'
        );
      }
    } catch (error) {
      console.error('Error saving entry:', error);
      if (error instanceof Error && error.message.includes('límite máximo')) {
        Alert.alert(
          'Límite alcanzado',
          'Has alcanzado el límite máximo de 10 entradas por día. Por favor, intenta mañana.'
        );
      } else {
        Alert.alert(
          'Error',
          'Ocurrió un error al guardar la entrada. Por favor, intenta nuevamente.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'web') {
      if (date) {
        setSelectedDate(date);
      }
    } else {
      setShowDatePicker(false);
      if (date) {
        setSelectedDate(date);
      }
    }
  };

  const renderMoodPicker = () => (
    <Modal
      visible={showMoodPicker}
      transparent
      animationType="slide"
      onRequestClose={() => setShowMoodPicker(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>¿Cómo te sientes hoy?</Text>
          <View style={styles.moodGrid}>
            {MOODS.map(mood => (
              <TouchableOpacity
                key={mood.value}
                style={[
                  styles.moodOption,
                  selectedMood === mood.value && { backgroundColor: mood.color }
                ]}
                onPress={() => {
                  setSelectedMood(mood.value);
                  setShowMoodPicker(false);
                }}
              >
                <Smile
                  size={24}
                  color={selectedMood === mood.value ? '#fff' : mood.color}
                />
                <Text
                  style={[
                    styles.moodText,
                    selectedMood === mood.value && { color: '#fff' }
                  ]}
                >
                  {mood.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <ScrollView style={styles.container}>
      <AnimatedView animation="slide" style={styles.header}>
        {Platform.OS === 'web' ? (
          <View style={styles.webDateContainer}>
            <input
              type="date"
              value={selectedDate.toISOString().split('T')[0]}
              onChange={(e) => {
                const date = new Date(e.target.value);
                if (!isNaN(date.getTime())) {
                  setSelectedDate(date);
                }
              }}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                backgroundColor: '#fff',
                fontSize: '16px',
              }}
            />
          </View>
        ) : (
          <Button
            variant="secondary"
            title={selectedDate.toLocaleDateString()}
            icon={<Calendar size={20} color="#333" />}
            onPress={() => setShowDatePicker(true)}
          />
        )}
      </AnimatedView>

      <AnimatedView animation="fade" delay={200} style={styles.content}>
        <View style={styles.moodSection}>
          <Button
            variant="secondary"
            title="Seleccionar estado de ánimo"
            icon={<Smile size={20} color="#333" />}
            onPress={() => setShowMoodPicker(true)}
          />
          {selectedMood && (
            <View style={styles.selectedMood}>
              <Text style={styles.selectedMoodText}>
                {MOODS.find(m => m.value === selectedMood)?.label}
              </Text>
            </View>
          )}
        </View>

        <Input
          label="Entrada de hoy"
          placeholder="¿Cómo fue tu día?"
          value={entry}
          onChangeText={setEntry}
          multiline
          numberOfLines={10}
          textAlignVertical="top"
          style={styles.input}
        />

        <View style={styles.tagsSection}>
          <View style={styles.tagInput}>
            <Input
              placeholder="Agregar etiqueta"
              value={newTag}
              onChangeText={setNewTag}
              onSubmitEditing={handleAddTag}
            />
            <Button
              title="Agregar"
              onPress={handleAddTag}
              icon={<TagIcon size={20} color="#fff" />}
            />
          </View>

          <View style={styles.tagsContainer}>
            {tags.map((tag, index) => (
              <TouchableOpacity
                key={index}
                style={styles.tag}
                onPress={() => removeTag(tag)}
              >
                <TagIcon size={16} color="#666" />
                <Text style={styles.tagText}>{tag}</Text>
                <Text style={styles.removeTag}>×</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Button
          title="Guardar entrada"
          onPress={handleSave}
          loading={loading}
          icon={<Save size={20} color="#fff" />}
        />
      </AnimatedView>

      {Platform.OS !== 'web' && showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          onChange={handleDateChange}
        />
      )}

      {renderMoodPicker()}
    </ScrollView>
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
  content: {
    padding: 20,
    gap: 20,
  },
  input: {
    height: 200,
  },
  moodSection: {
    gap: 10,
  },
  selectedMood: {
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 8,
  },
  selectedMoodText: {
    fontSize: 16,
    color: '#333',
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
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  moodOption: {
    width: '48%',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    gap: 8,
  },
  moodText: {
    fontSize: 14,
    color: '#333',
  },
  tagsSection: {
    gap: 10,
  },
  tagInput: {
    flexDirection: 'row',
    gap: 10,
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
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    gap: 6,
  },
  tagText: {
    fontSize: 14,
    color: '#666',
  },
  removeTag: {
    fontSize: 18,
    color: '#999',
    marginLeft: 4,
  },
  webDateContainer: {
    width: '100%',
  },
});