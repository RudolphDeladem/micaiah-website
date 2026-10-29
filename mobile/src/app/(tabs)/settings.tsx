import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Linking, Pressable, Share, StyleSheet, Switch, TextInput, View } from 'react-native';

import { Card, Divider, Row, Screen, T } from '@/components/ui';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { cloudInsightAvailable } from '@/lib/cloud-insight';
import { formatRef, versionInfo } from '@/lib/bible';
import { interpretAvailable } from '@/lib/interpret';
import { SUPPORT_EMAIL } from '@/lib/legal';
import { cancelReminders, requestReminderPermission, scheduleDailyReminder } from '@/lib/reminders';
import { TRANSLATION } from '@/lib/scripture';
import { useStore } from '@/lib/store';
import { purchasesAvailable, useSubscription } from '@/lib/subscription';

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
  const { settings, entries, interpretations, updateSettings, deleteAllData } = useStore();
  const { isPlus, usage, manage, restore, resetIdentity } = useSubscription();
  const subscribed = isPlus || usage?.plan === 'plus';
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
    if (entries.length === 0 && interpretations.length === 0) {
      Alert.alert('Nothing to export yet', 'Your journal is empty.');
      return;
    }
    const reflections = entries
      .map((e) => {
        const date = new Date(e.createdAt).toLocaleString();
        const verses = e.insight.verses.map((v) => `  “${v.text}” — ${v.ref} (${TRANSLATION})`).join('\n');
        return `${date} · ${e.insight.themeLabel}\n${e.text}\n\n${e.insight.interpretation}\n${verses}`;
      })
      .join('\n\n— — —\n\n');
    const interpreted = interpretations
      .map((i) => {
        const date = new Date(i.createdAt).toLocaleString();
        const label = i.kind === 'dream' ? 'Dream' : 'Prophetic word';
        const refs = i.refs.map(formatRef).join(' · ');
        return `${date} · ${label} · ${i.title}\n${i.text}\n\n${i.summary}${refs ? `\nScripture: ${refs}` : ''}`;
      })
      .join('\n\n— — —\n\n');
    const body = [reflections, interpreted].filter(Boolean).join('\n\n— — —\n\n');
    Share.share({ title: 'My Micaiah Journal', message: `My Micaiah Journal\n\n${body}` }).catch(() => {});
  };

  const confirmDeleteAll = () => {
    Alert.alert(
      'Delete all data?',
      `This permanently erases every reflection and interpretation, your name, and your preferences from this device. This cannot be undone.${subscribed ? ' Your Micaiah Plus subscription is not cancelled — manage it in your store account, and use Restore purchases to use it again.' : ''}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete everything',
          style: 'destructive',
          onPress: async () => {
            await cancelReminders().catch(() => {});
            await deleteAllData();
            await resetIdentity().catch(() => {});
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

      {purchasesAvailable ? (
        <Section title="Micaiah Plus">
          <Row
            icon="sparkles-outline"
            label={subscribed ? 'Micaiah Plus is active' : 'Micaiah Plus'}
            detail={
              subscribed
                ? usage
                  ? `This month: ${usage.dream.used}/${usage.dream.limit} dreams · ${usage.prophetic.used}/${usage.prophetic.limit} prophetic words`
                  : 'Dream Interpretation and Prophetic Word unlocked'
                : 'Unlock Dream Interpretation and Prophetic Word'
            }
            onPress={() => router.push('/plus')}
          />
          <Divider />
          {subscribed ? (
            <Row icon="card-outline" label="Manage subscription" onPress={manage} />
          ) : (
            <Row
              icon="refresh-outline"
              label="Restore purchases"
              onPress={() =>
                restore()
                  .then((found) =>
                    Alert.alert(
                      found ? 'Purchases restored' : 'No subscription found',
                      found ? 'Your Micaiah Plus subscription is active on this device.' : 'No active Micaiah Plus subscription was found.',
                    ),
                  )
                  .catch(() => Alert.alert('Could not restore', 'Please check your connection and try again.'))
              }
            />
          )}
        </Section>
      ) : null}

      <Section title="Bible">
        <Row
          icon="book-outline"
          label="Translation"
          detail={versionInfo(settings.bibleVersion).name}
          onPress={() => router.push('/bible-version')}
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
        <Section title="AI insights">
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
          {interpretAvailable && settings.interpretConsent ? (
            <>
              <Divider />
              <Row
                icon="moon-outline"
                label="Dream & prophetic interpretation"
                detail="Allowed — what you submit there is processed by Claude AI"
                right={
                  <Switch
                    value
                    onValueChange={() => updateSettings({ interpretConsent: false })}
                    trackColor={{ true: Colors.indigoMid, false: Colors.indigoPale }}
                    accessibilityLabel="Allow dream and prophetic interpretation"
                  />
                }
              />
            </>
          ) : null}
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
          Your journal and interpretations are stored only on this device. There is no account, and nothing is uploaded
          unless you use cloud insights or Dream / Prophetic interpretation.
        </T>
        <Row icon="trash-outline" label="Delete all data" tone="danger" onPress={confirmDeleteAll} />
      </Section>

      <T variant="small" style={{ textAlign: 'center' }}>
        Micaiah AI · Version {Constants.expoConfig?.version ?? '1.0.0'}
        {'\n'}Bible text: KJV, WEB, ASV and BBE (public domain).
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
