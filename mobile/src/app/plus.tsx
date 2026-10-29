import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, StyleSheet, View } from 'react-native';
import type { PurchasesPackage } from 'react-native-purchases';

import { Card, LogoMark, PrimaryButton, Screen, SecondaryButton, T, type IconName } from '@/components/ui';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { interpretComingSoon } from '@/lib/interpret';
import { priceLabel, purchasesAvailable, trialLabel, useSubscription } from '@/lib/subscription';

export default function Plus() {
  const { isPlus, usage, loadPackages, purchase, restore, manage } = useSubscription();
  const [packages, setPackages] = useState<PurchasesPackage[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const plusLimit = usage?.limits.plus ?? 20;
  const subscribed = isPlus || usage?.plan === 'plus';

  const fetchPackages = () =>
    loadPackages()
      .then((pkgs) => {
        setPackages(pkgs);
        // Pre-select the monthly plan when there is one.
        setSelected((pkgs.find((p) => p.packageType === 'MONTHLY') ?? pkgs[0])?.identifier ?? null);
      })
      .catch(() => setFailed(true));

  const retry = () => {
    setFailed(false);
    setPackages(null);
    fetchPackages();
  };

  useEffect(() => {
    if (purchasesAvailable && !subscribed) fetchPackages();
    // Load once when the screen opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const chosen = packages?.find((p) => p.identifier === selected) ?? null;

  const subscribe = async () => {
    if (!chosen) return;
    setBusy(true);
    try {
      if (await purchase(chosen)) {
        Alert.alert('Welcome to Micaiah Plus', 'Dream Interpretation and Prophetic Word are unlocked. Thank you for your support.', [
          { text: 'Continue', onPress: () => router.back() },
        ]);
      }
    } catch {
      Alert.alert('Purchase not completed', 'The purchase could not be completed. You have not been charged. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const restorePurchases = async () => {
    setBusy(true);
    try {
      const found = await restore();
      Alert.alert(
        found ? 'Purchases restored' : 'No subscription found',
        found
          ? 'Your Micaiah Plus subscription is active on this device.'
          : `We couldn’t find an active Micaiah Plus subscription for this ${Platform.OS === 'ios' ? 'Apple ID' : 'Google account'}.`,
      );
    } catch {
      Alert.alert('Could not restore', 'Please check your connection and try again.');
    } finally {
      setBusy(false);
    }
  };

  const store = Platform.OS === 'ios' ? 'Apple ID' : 'Google Play account';

  return (
    <Screen edges={['bottom']} contentStyle={{ gap: Spacing.lg }}>
      <View style={{ alignItems: 'center', gap: Spacing.sm }}>
        <LogoMark size={64} />
        <T variant="title" style={{ textAlign: 'center' }}>
          Micaiah Plus
        </T>
        <T style={{ textAlign: 'center' }}>Bring your dreams and the words you receive to Scripture.</T>
      </View>

      <Card style={{ gap: Spacing.md }}>
        <Benefit icon="moon-outline" title="Dream Interpretation" body={`Up to ${plusLimit} dreams a month, explained in the light of Scripture.`} />
        <Benefit
          icon="megaphone-outline"
          title="Prophetic Word"
          body={`Up to ${plusLimit} words a month, weighed with Scripture — themes, cautions and next steps.`}
        />
        <Benefit
          icon="heart-outline"
          title="Everything else stays free"
          body="Daily reflections, prayer and gratitude journals, the full Bible, and reminders."
        />
      </Card>

      {subscribed ? (
        <View style={{ gap: Spacing.sm }}>
          <Card tone="gold" style={{ alignItems: 'center', gap: Spacing.xs }}>
            <Ionicons name="checkmark-circle" size={28} color={Colors.gold} />
            <T variant="heading">You’re a Micaiah Plus member</T>
            {usage ? (
              <T variant="small" style={{ textAlign: 'center' }}>
                This month: {usage.dream.used} of {usage.dream.limit} dreams · {usage.prophetic.used} of{' '}
                {usage.prophetic.limit} prophetic words
              </T>
            ) : null}
          </Card>
          <SecondaryButton label="Manage subscription" icon="settings-outline" onPress={manage} />
        </View>
      ) : !purchasesAvailable ? (
        <T style={{ textAlign: 'center' }}>
          {interpretComingSoon
            ? 'Micaiah Plus is coming soon — one monthly plan of $4.99 for both features. Everything else stays free.'
            : 'Subscriptions aren’t available in this version of the app.'}
        </T>
      ) : failed ? (
        <View style={{ gap: Spacing.sm, alignItems: 'center' }}>
          <T style={{ textAlign: 'center' }}>We couldn’t load the plans. Please check your connection.</T>
          <SecondaryButton label="Try again" icon="refresh" onPress={retry} />
        </View>
      ) : !packages ? (
        <ActivityIndicator color={Colors.indigoMid} />
      ) : packages.length === 0 ? (
        <T style={{ textAlign: 'center' }}>No plans are available right now. Please try again later.</T>
      ) : (
        <View style={{ gap: Spacing.sm }}>
          {packages.map((pkg) => {
            const active = pkg.identifier === selected;
            const trial = trialLabel(pkg);
            return (
              <Pressable
                key={pkg.identifier}
                accessibilityRole="radio"
                accessibilityState={{ checked: active }}
                accessibilityLabel={`${pkg.product.title}, ${priceLabel(pkg)}${trial ? `, ${trial}` : ''}`}
                onPress={() => setSelected(pkg.identifier)}
                style={[styles.plan, active && styles.planActive]}>
                <Ionicons name={active ? 'radio-button-on' : 'radio-button-off'} size={22} color={Colors.indigoMid} />
                <View style={{ flex: 1 }}>
                  <T variant="heading" style={{ fontSize: 16 }}>
                    {pkg.packageType === 'ANNUAL' ? 'Yearly' : pkg.packageType === 'MONTHLY' ? 'Monthly' : pkg.product.title}
                  </T>
                  {trial ? (
                    <T variant="small" style={{ color: Colors.gold }}>
                      {trial}
                    </T>
                  ) : null}
                </View>
                <T variant="heading" style={{ fontSize: 15, color: Colors.indigo }}>
                  {priceLabel(pkg)}
                </T>
              </Pressable>
            );
          })}
          <PrimaryButton
            label={chosen && trialLabel(chosen) ? 'Start free trial' : 'Subscribe'}
            icon="sparkles"
            loading={busy}
            disabled={!chosen}
            onPress={subscribe}
          />
          <T variant="small" style={{ textAlign: 'center' }}>
            {chosen && trialLabel(chosen)
              ? `After the free trial, ${priceLabel(chosen)}. `
              : chosen
                ? `${priceLabel(chosen)}. `
                : ''}
            Payment is charged to your {store}. The subscription renews automatically unless cancelled at least 24 hours
            before the end of the current period. Manage or cancel anytime in your {store} settings.
          </T>
        </View>
      )}

      {purchasesAvailable && !subscribed ? (
        <Pressable accessibilityRole="button" disabled={busy} onPress={restorePurchases} style={styles.link}>
          <T variant="heading" style={{ color: Colors.indigoMid, fontSize: 15 }}>
            Restore purchases
          </T>
        </Pressable>
      ) : null}

      <View style={styles.legal}>
        <Pressable accessibilityRole="link" onPress={() => router.push('/legal/terms')} style={styles.link}>
          <T variant="small" style={{ color: Colors.indigoMid }}>
            Terms of Use
          </T>
        </Pressable>
        <T variant="small">·</T>
        <Pressable accessibilityRole="link" onPress={() => router.push('/legal/privacy')} style={styles.link}>
          <T variant="small" style={{ color: Colors.indigoMid }}>
            Privacy Policy
          </T>
        </Pressable>
      </View>
    </Screen>
  );
}

function Benefit({ icon, title, body }: { icon: IconName; title: string; body: string }) {
  return (
    <View style={styles.benefit}>
      <View style={styles.benefitIcon}>
        <Ionicons name={icon} size={20} color={Colors.indigoMid} />
      </View>
      <View style={{ flex: 1 }}>
        <T variant="heading" style={{ fontSize: 15 }}>
          {title}
        </T>
        <T variant="small">{body}</T>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  benefit: { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' },
  benefitIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.indigoGhost,
  },
  plan: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    minHeight: 64,
    borderRadius: Radius.md,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  planActive: { borderColor: Colors.indigoMid, borderWidth: 1.5 },
  link: { minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.sm },
  legal: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
});
