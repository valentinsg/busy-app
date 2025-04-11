import { Theme } from '@react-navigation/native';

export interface CustomTheme extends Theme {
  dark: boolean;
  colors: {
    primary: string;
    background: string;
    card: string;
    text: string;
    border: string;
    notification: string;
    error: string;
    success: string;
    warning: string;
    info: string;
  };
}

export const lightTheme: CustomTheme = {
  dark: false,
  colors: {
    primary: '#333',
    background: '#fff',
    card: '#f5f5f5',
    text: '#333',
    border: '#e1e1e1',
    notification: '#ff3b30',
    error: '#ff4444',
    success: '#4cd964',
    warning: '#ffcc00',
    info: '#5856d6',
  },
};

export const darkTheme: CustomTheme = {
  dark: true,
  colors: {
    primary: '#fff',
    background: '#1a1a1a',
    card: '#2a2a2a',
    text: '#fff',
    border: '#404040',
    notification: '#ff453a',
    error: '#ff6b6b',
    success: '#32d74b',
    warning: '#ffd60a',
    info: '#5e5ce6',
  },
};