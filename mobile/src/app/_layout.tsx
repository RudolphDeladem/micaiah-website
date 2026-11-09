import { CormorantGaramond_400Regular_Italic } from '@expo-google-fonts/cormorant-garamond/400Regular_Italic';
import { CormorantGaramond_500Medium } from '@expo-google-fonts/cormorant-garamond/500Medium';
import { CormorantGaramond_600SemiBold } from '@expo-google-fonts/cormorant-garamond/600SemiBold';
import { DMSans_400Regular } from '@expo-google-fonts/dm-sans/400Regular';
import { DMSans_500Medium } from '@expo-google-fonts/dm-sans/500Medium';
import { DMSans_600SemiBold } from '@expo-google-fonts/dm-sans/600SemiBold';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFonts } from 'expo-font';
import { Stack, router, type ErrorBoundaryProps } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton, SecondaryButton, T } from '@/components/ui';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { StoreProvider, useStore } from '@/lib/store';
import { SubscriptionProvider } from '@/lib/subscription';

SplashScreen.preventAutoHideAsync().catch(() => {});

function RootNavigator() {
  const { ready } = useStore();
  const [fontsLoaded, fontError] = useFonts({
    CormorantGaramond_400Regular_Italic,
    CormorantGaramond_500Medium,
    CormorantGaramond_600SemiBold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
  });
  // A font failure should fall back to system fonts, never block launch.
  const loaded = ready && (fontsLoaded || Boolean(fontError));

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync().catch(() => {});
  }, [loaded]);

  if (!loaded) return null;

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShadowVisible: false,
          headerStyle: { backgroundColor: Colors.cream },
          headerTintColor: Colors.indigo,
          headerTitleStyle: { fontFamily: Fonts.sansBold, color: Colors.ink },
          headerBackButtonDisplayMode: 'minimal',
          contentStyle: { backgroundColor: Colors.cream },
        }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="reflect" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
        <Stack.Screen name="listen" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
        <Stack.Screen name="entry/[id]" options={{ title: 'Your insight' }} />
        <Stack.Screen name="theme/[id]" options={{ title: 'Scripture' }} />
        <Stack.Screen name="topics" options={{ title: 'Bible Insight' }} />
        <Stack.Screen name="read/[book]/[chapter]" options={{ title: '' }} />
        <Stack.Screen name="bible-version" options={{ title: 'Bible translation', presentation: 'modal' }} />
        <Stack.Screen name="interpret/[kind]" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
        <Stack.Screen name="interpretation/[id]" options={{ title: '' }} />
        <Stack.Screen name="plus" options={{ title: 'Micaiah Plus', presentation: 'modal' }} />
        <Stack.Screen name="crisis" options={{ title: 'Get help now', presentation: 'modal' }} />
        <Stack.Screen name="legal/[doc]" options={{ title: '' }} />
      </Stack>
    </>
  );
}

/** Shown instead of a blank screen if any screen throws while rendering. Uses no app state. */
export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  // The error may happen before the app hides the splash screen.
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.crash}>
        <View style={styles.crashInner}>
          <Ionicons name="leaf-outline" size={44} color={Colors.indigoMid} />
          <T variant="title" style={{ textAlign: 'center' }}>
            Something went wrong
          </T>
          <T style={{ textAlign: 'center' }}>
            Micaiah hit an unexpected problem. Your journal is safe on this device. Please try again.
          </T>
          <PrimaryButton label="Try again" icon="refresh" onPress={() => retry()} style={{ alignSelf: 'stretch' }} />
          <SecondaryButton
            label="Go to Today"
            icon="home-outline"
            onPress={() => {
              router.replace('/');
              retry();
            }}
            style={{ alignSelf: 'stretch' }}
          />
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  crash: { flex: 1, backgroundColor: Colors.cream },
  crashInner: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.md, padding: Spacing.lg },
});

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StoreProvider>
          <SubscriptionProvider>
            <RootNavigator />
          </SubscriptionProvider>
        </StoreProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
