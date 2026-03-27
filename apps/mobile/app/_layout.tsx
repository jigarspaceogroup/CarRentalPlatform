import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../src/stores/auth';
import '../src/i18n';

function useProtectedRoute() {
  const router = useRouter();
  const segments = useSegments() as string[];
  const { isAuthenticated, isInitialized } = useAuthStore();

  useEffect(() => {
    if (!isInitialized) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      // Not authenticated and not in auth group -> redirect to welcome
      router.replace('/(auth)/welcome');
    } else if (isAuthenticated && inAuthGroup) {
      // Authenticated but still in auth group -> redirect to tabs
      // Exception: profile-completion screen is accessible even when authenticated
      const currentScreen = segments[1];
      if (currentScreen !== 'profile-completion') {
        router.replace('/(tabs)');
      }
    }
  }, [isAuthenticated, isInitialized, segments, router]);
}

export default function RootLayout() {
  const { initialize, isInitialized } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useProtectedRoute();

  if (!isInitialized) {
    // The splash screen in (auth)/splash.tsx handles the loading UI.
    // While the store initializes, we render the stack normally and
    // let the initial route (index) be shown briefly.
    return null;
  }

  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}
