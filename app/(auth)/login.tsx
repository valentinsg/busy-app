import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Link, router } from 'expo-router';
import { LogIn } from 'lucide-react-native';
import { AnimatedView } from '../../components/AnimatedView';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { useAuth } from '../../hooks/useAuth';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      await signIn(email, password);
      router.replace('/(tabs)');
    } catch (err) {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <AnimatedView animation="slide" style={styles.header}>
        <LogIn size={32} color="#333" />
        <Text style={styles.title}>Welcome to Busy</Text>
        <Text style={styles.subtitle}>Login to start being productive</Text>
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
          placeholder="Enter your password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <Button
          title="Login"
          onPress={handleLogin}
          loading={loading}
          icon={<LogIn size={20} color="#fff" />}
        />
      </AnimatedView>

      <AnimatedView animation="fade" delay={400} style={styles.footer}>
        <Text style={styles.footerText}>Don't have an account? </Text>
        <Link href="/signup" style={styles.link}>
          Sign up
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