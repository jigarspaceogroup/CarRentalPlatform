import { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/stores/auth';
import { colors } from '../src/theme';

/**
 * Root index screen - acts as a routing entry point.
 * Redirects to the appropriate group once auth state is known.
 */
export default function IndexScreen() {
  const router = useRouter();
  const { isAuthenticated, isInitialized } = useAuthStore();

  useEffect(() => {
    if (!isInitialized) return;

    if (isAuthenticated) {
      router.replace('/(tabs)');
    } else {
      router.replace('/(auth)/splash');
    }
  }, [isAuthenticated, isInitialized, router]);

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>CR</Text>
      <ActivityIndicator size="large" color={colors.white} style={styles.loader} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary[600],
  },
  logo: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.white,
  },
  loader: {
    marginTop: 24,
  },
});
