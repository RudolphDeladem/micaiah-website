import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Linking, Pressable, Share, StyleSheet, Switch, TextInput, View } from 'react-native';

import { Card, Divider, Row, Screen, T } from '@/components/ui';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { cloudInsightAvailable } from '@/lib/cloud-insight';
import { SUPPORT_EMAIL } from '@/lib/legal';
import { cancelReminders, requestReminderPermission, scheduleDailyReminder } from '@/lib/reminders';
import { TRANSLATION } from '@/lib/scripture';
import { useStore } from '@/lib/store';

const REMINDER_TIMES: [number, number][] = [
  [6, 30],
  [7, 30],
  [12, 0],
  [18, 0],
  [21, 0],
];

function formatTime(hour: number, minute: number): string {
  return new Date(2000, 0, 1, hour, minute).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export default function SettingsScreen() {
  const { settings, entries, updateSettings, deleteAllData } = useStore();
  const [name, setName] = useState(settings.name);

  const toggleReminder = async (enabled: boolean) => {
    if (!enabled) {
      await cancelReminders();
      await updateSettings({ reminderEnabled: false });
      return;
    }
    const granted = await requestReminderPermission();
    if (!granted) {
      Alert.alert(
        'Notifications are off',
        'To receive a daily reminder, allow notifications for Micaiah in your device settings.',
        [
          { text: 'Not now', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ],
      );
      return;
    }
    await scheduleDailyReminder(settings.reminderHour, settings.reminderMinute);
    await updateSettings({ reminderEnabled: true });
  };

  const chooseTime = async (hour: number, minute: number) => {
    await updateSettings({ reminderHour: hour, reminderMinute: minute });
    if (settings.reminderEnabled) await scheduleDailyReminder(hour, minute);
  };

  const toggleCloud = (enabled: boolean) => {
    if (!enabled) {
      updateSettings({ cloudConsent: false });
      return;
    }
    Alert.alert(
      'Turn on cloud insights?',
      'When on, the text of each reflection you submit is sent securely to the Micaiah insight service and processed by Anthropic’s Claude AI to write a personal reflection. Micaiah does not store it, and it is never used to train AI models. Scripture always comes from the built-in KJV library.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Turn on', onPress: () => updateSettings({ cloudConsent: true }) },
      ],
    );
  };

  const exportJournal = () => {
    if (entries.length === 0) {
      Alert.alert('Nothing to export yet', 'Your journal is empty.');
      return;
    }
    const body = entries
      .map((e) => {
        const date = new Date(e.createdAt).toLocaleString();
        const verses = e.insight.verses.map((v) => `  “${v.text}” — ${v.ref} (${TRANSLATION})`).join('\n');
        return `${date} · ${e.insight.themeLabel}\n${e.text}\n\n${e.insight.interpretation}\n${verses}`;
      })
      .join('\n\n— — —\n\n');
    Share.share({ title: 'My Micaiah Journal', message: `My Micaiah Journal\n\n${body}` }).catch(() => {});
  };

  const confirmDeleteAll = () => {
    Alert.alert(
      'Delete all data?',
      'This permanently erases every reflection, your name, and your preferences from this device. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete everything',
          style: 'destructive',
          onPress: async () => {
            await cancelReminders().catch(() => {});
            await deleteAllData();
            router.replace('/onboarding');
          },
        },
      ],
    );
  };

  return (
    <Screen contentStyle={{ gap: Spacing.lg }}>
      <T variant="title">Settings</T>

      <Section title="You">
        <T variant="small">Your first name (optional)</T>
        <TextInput
          value={name}
          onChangeText={setName}
          onEndEditing={() => updateSettings({ name: name.trim().slice(0, 40) })}
          placeholder="Add your name"
          placeholderTextColor={Colors.inkSoft}
          maxLength={40}
          accessibilityLabel="Your first name"
          style={styles.input}
        />
      </Section>

      <Section title="Daily reminder">
        <Row
          icon="notifications-outline"
          label="Remind me to reflect"
          detail={settings.reminderEnabled ? `Every day at ${formatTime(settings.reminderHour, settings.reminderMinute)}` : 'Off'}
          right={
            <Switch
              value={settings.reminderEnabled}
              onValueChange={toggleReminder}
              trackColor={{ true: Colors.indigoMid, false: Colors.indigoPale }}
              accessibilityLabel="Daily reminder"
            />
          }
        />
        <View style={styles.times}>
          {REMINDER_TIMES.map(([h, m]) => {
            const active = settings.reminderHour === h && settings.reminderMinute === m;
            return (
              <Pressable
                key={`${h}:${m}`}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`Remind me at ${formatTime(h, m)}`}
                onPress={() => chooseTime(h, m)}
                style={[styles.time, active && styles.timeActive]}>
                <T variant="small" style={{ color: active ? Colors.white : Colors.inkMid }}>
                  {formatTime(h, m)}
                </T>
              </Pressable>
            );
          })}
        </View>
      </Section>

      {cloudInsightAvailable ? (
        <Section title="Insights">
          <Row
            icon="sparkles-outline"
            label="Cloud insights (AI)"
            detail={
              settings.cloudConsent
                ? 'On — reflections are processed by Claude AI'
                : 'Off — insights are generated on your device'
            }
            right={
              <Switch
                value={settings.cloudConsent === true}
                onValueChange={toggleCloud}
                trackColor={{ true: Colors.indigoMid, false: Colors.indigoPale }}
                accessibilityLabel="Cloud insights"
              />
            }
          />
        </Section>
      ) : null}

      <Section title="Support">
        <Row icon="heart-outline" label="Get help now" detail="Crisis lines and emergency resources" onPress={() => router.push('/crisis')} />
        <Divider />
        <Row icon="download-outline" label="Export journal" detail="Save or send a copy of your reflections" onPress={exportJournal} />
        <Divider />
        <Row
          icon="mail-outline"
          label="Contact us"
          detail={SUPPORT_EMAIL}
          onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Micaiah%20AI%20support`).catch(() => {})}
        />
      </Section>

      <Section title="Legal">
        <Row icon="shield-checkmark-outline" label="Privacy Policy" onPress={() => router.push('/legal/privacy')} />
        <Divider />
        <Row icon="document-text-outline" label="Terms of Use" onPress={() => router.push('/legal/terms')} />
      </Section>

      <Section title="Your data">
        <T variant="small">
          Your journal is stored only on this device. There is no account and nothing is uploaded unless you turn on
          cloud insights.
        </T>
        <Row icon="trash-outline" label="Delete all data" tone="danger" onPress={confirmDeleteAll} />
      </Section>

      <T variant="small" style={{ textAlign: 'center' }}>
        Micaiah AI · Version {Constants.expoConfig?.version ?? '1.0.0'}
        {'\n'}Scripture quotations from the King James Version (public domain).
      </T>
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: Spacing.sm }}>
      <T variant="label">{title}</T>
      <Card style={{ gap: Spacing.sm, paddingVertical: Spacing.md }}>{children}</Card>
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    minHeight: 48,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    fontFamily: Fonts.sans,
    fontSize: 16,
    color: Colors.ink,
  },
  times: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  time: {
    paddingHorizontal: 14,
    minHeight: 36,
    justifyContent: 'center',
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  timeActive: { backgroundColor: Colors.indigo, borderColor: Colors.indigo },
});
