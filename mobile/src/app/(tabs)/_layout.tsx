import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import type { ComponentProps } from 'react';
import type { ColorValue } from 'react-native';

import { Colors, Fonts } from '@/constants/theme';
import { interpretAvailable } from '@/lib/interpret';
import { useStore } from '@/lib/store';

type IconName = ComponentProps<typeof Ionicons>['name'];

function tabIcon(name: IconName, focusedName: IconName) {
  return function TabIcon({ color, focused, size }: { color: ColorValue; focused: boolean; size: number }) {
    return <Ionicons name={focused ? focusedName : name} color={color as string} size={size} />;
  };
}

export default function TabLayout() {
  const { settings } = useStore();
  if (!settings.onboarded) return <Redirect href="/onboarding" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.indigo,
        tabBarInactiveTintColor: Colors.inkSoft,
        tabBarLabelStyle: { fontFamily: Fonts.sansMedium, fontSize: 11 },
        tabBarStyle: { backgroundColor: Colors.white, borderTopColor: Colors.border },
        sceneStyle: { backgroundColor: Colors.cream },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Today', tabBarIcon: tabIcon('sunny-outline', 'sunny') }} />
      <Tabs.Screen name="bible" options={{ title: 'Bible', tabBarIcon: tabIcon('book-outline', 'book') }} />
      <Tabs.Screen
        name="interpret"
        options={{
          title: 'Interpret',
          tabBarIcon: tabIcon('moon-outline', 'moon'),
          // Needs the AI service; hidden entirely in builds without it.
          href: interpretAvailable ? undefined : null,
        }}
      />
      <Tabs.Screen name="journal" options={{ title: 'Journal', tabBarIcon: tabIcon('journal-outline', 'journal') }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarIcon: tabIcon('settings-outline', 'settings') }} />
    </Tabs>
  );
}
