import { CormorantGaramond_400Regular_Italic } from '@expo-google-fonts/cormorant-garamond/400Regular_Italic';
import { CormorantGaramond_500Medium } from '@expo-google-fonts/cormorant-garamond/500Medium';
import { CormorantGaramond_600SemiBold } from '@expo-google-fonts/cormorant-garamond/600SemiBold';
import { DMSans_400Regular } from '@expo-google-fonts/dm-sans/400Regular';
import { DMSans_500Medium } from '@expo-google-fonts/dm-sans/500Medium';
import { DMSans_600SemiBold } from '@expo-google-fonts/dm-sans/600SemiBold';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Colors, Fonts } from '@/constants/theme';
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
