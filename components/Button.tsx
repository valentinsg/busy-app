import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';

interface ButtonProps {
  onPress: () => void;
  title: string;
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
}

export function Button({
  onPress,
  title,
  variant = 'primary',
  loading = false,
  disabled = false,
  icon,
}: ButtonProps) {
  const buttonStyles = [
    styles.button,
    variant === 'secondary' && styles.buttonSecondary,
    variant === 'danger' && styles.buttonDanger,
    disabled && styles.buttonDisabled,
  ];

  const textStyles = [
    styles.text,
    variant === 'secondary' && styles.textSecondary,
    variant === 'danger' && styles.textDanger,
    disabled && styles.textDisabled,
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || loading}>
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' ? '#333' : '#fff'} />
      ) : (
        <>
          {icon}
          <Text style={textStyles}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#333',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  buttonSecondary: {
    backgroundColor: '#f5f5f5',
  },
  buttonDanger: {
    backgroundColor: '#ff4444',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  text: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  textSecondary: {
    color: '#333',
  },
  textDanger: {
    color: '#fff',
  },
  textDisabled: {
    opacity: 0.5,
  },
});