import React from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Input } from './Input';

interface DatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  mode?: 'date' | 'time';
  minimumDate?: Date;
  label?: string;
}

export const DatePicker = ({ value, onChange, mode = 'date', minimumDate, label }: DatePickerProps) => {
  if (Platform.OS === 'web') {
    return (
      <Input
        label={label}
        value={mode === 'date' ? value.toISOString().split('T')[0] : value.toTimeString().split(' ')[0]}
        onChangeText={(text) => {
          const newDate = new Date(text);
          if (!isNaN(newDate.getTime())) {
            onChange(newDate);
          }
        }}
      />
    );
  }

  return (
    <DateTimePicker
      value={value}
      mode={mode}
      onChange={(_, date) => date && onChange(date)}
      minimumDate={minimumDate}
    />
  );
}; 