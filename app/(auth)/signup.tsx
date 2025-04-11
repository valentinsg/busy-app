import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Link, router } from 'expo-router';
import { UserPlus } from 'lucide-react-native';
import { AnimatedView } from '../../components/AnimatedView';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { useAuth } from '../../hooks/useAuth';

export default function SignupScreen() {
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignup = async () => {
    if (!email || !password) {
      setError('Completa todos los campos');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await signUp(email, password);
      router.replace('/(tabs)');
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error desconocido');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <AnimatedView animation="slide" style={styles.header}>
        <UserPlus size={32} color="#333" />
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join Busy and boost your productivity</Text>
      </AnimatedView>

      <AnimatedView animation="fade" delay={200} style={styles.form}>
        <Input
          label="Email"
          placeholder="Enter your email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          error={error ? error : undefined}
        />
        <Input
          label="Password"
          placeholder="Choose a password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <Button
          title="Sign Up"
          onPress={handleSignup}
          loading={loading}
          icon={<UserPlus size={20} color="#fff" />}
        />
      </AnimatedView>

      <AnimatedView animation="fade" delay={400} style={styles.footer}>
        <Text style={styles.footerText}>Already have an account? </Text>
        <Link href="/login" style={styles.link}>
          Login
        </Link>
      </AnimatedView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  form: {
    gap: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    color: '#666',
  },
  link: {
    color: '#333',
    fontWeight: 'bold',
  },
});