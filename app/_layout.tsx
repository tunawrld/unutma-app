import { ClerkLoaded, ClerkProvider, useAuth } from '@clerk/expo';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { tokenCache } from '@/lib/tokenCache';
import { registerForPushNotificationsAsync } from '@/utils/notifications';

const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

function AuthRoutingGuard() {
  const { isSignedIn, isLoaded } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    const inAuthGroup = segments[0] === 'sign-in' || segments[0] === 'sign-up';

    if (!isSignedIn && !inAuthGroup) {
      // Giriş yapmamış ve auth sayfasında değilse → sign-in'e yönlendir
      router.replace('/sign-in');
    } else if (isSignedIn && inAuthGroup) {
      // Giriş yapmış ve hala auth sayfasındaysa → ana sayfaya yönlendir
      router.replace('/');
    }
  }, [isSignedIn, isLoaded, segments]);

  return null;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    registerForPushNotificationsAsync();
  }, []);

  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}>
      <ClerkLoaded>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <AuthRoutingGuard />
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="sign-in" options={{ headerShown: false }} />
            <Stack.Screen name="sign-up" options={{ headerShown: false }} />
            <Stack.Screen
              name="profile"
              options={{
                headerShown: false,
                presentation: 'modal',
                animation: 'slide_from_bottom',
              }}
            />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </ClerkLoaded>
    </ClerkProvider>
  );
}
