import React from 'react';
import { View, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';

interface ColorPickerProps {
  color: string;
  onColorChange: (color: string) => void;
  style?: ViewStyle;
}

const COLORS = [
  '#FF6B6B', // Rojo
  '#4ECDC4', // Turquesa
  '#45B7D1', // Azul
  '#96CEB4', // Verde
  '#FFD93D', // Amarillo
  '#FF8B94', // Rosa
  '#6C5B7B', // Morado
  '#355C7D', // Azul oscuro
];

export const ColorPicker = ({ color, onColorChange, style }: ColorPickerProps) => {
  return (
    <View style={[styles.container, style]}>
      {COLORS.map((c) => (
        <TouchableOpacity
          key={c}
          style={[
            styles.colorButton,
            { backgroundColor: c },
            c === color && styles.selected,
          ]}
          onPress={() => onColorChange(c)}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  colorButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  selected: {
    borderWidth: 2,
    borderColor: '#333',
  },
}); 