import { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Save, Calendar } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { AnimatedView } from '../../components/AnimatedView';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { useJournal } from '../../hooks/useJournal';

export default function JournalScreen() {
  const { addEntry, getEntriesByDate } = useJournal();
  const [entry, setEntry] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleSave = () => {
    if (entry.trim()) {
      addEntry(entry);
      setEntry('');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <AnimatedView animation="slide" style={styles.header}>
        <Button
          variant="secondary"
          title={selectedDate.toLocaleDateString()}
          icon={<Calendar size={20} color="#333" />}
          onPress={() => setShowDatePicker(true)}
        />
      </AnimatedView>

      <AnimatedView animation="fade" delay={200} style={styles.content}>
        <Input
          label="Today's Entry"
          placeholder="How was your day?"
          value={entry}
          onChangeText={setEntry}
          multiline
          numberOfLines={10}
          textAlignVertical="top"
          style={styles.input}
        />

        <Button
          title="Save Entry"
          onPress={handleSave}
          icon={<Save size={20} color="#fff" />}
        />
      </AnimatedView>

      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          onChange={(event, date) => {
            setShowDatePicker(false);
            if (date) setSelectedDate(date);
          }}
        />
      )}
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
});