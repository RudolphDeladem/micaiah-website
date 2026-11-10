import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Linking, Platform } from 'react-native';
import Purchases, { PURCHASES_ERROR_CODE, type CustomerInfo, type PurchasesPackage } from 'react-native-purchases';

import { emptyUsage, freeLeft, loadFreeUsage, saveFreeUsage, withUse, type FreeUsage } from './free-allowance';
import { getInstallId } from './install-id';
import { fetchUsage, interpretUsesService, type Usage } from './interpret';
import type { InterpretationKind } from './types';

/**
 * Micaiah Plus: one auto-renewing subscription (sold through the App Store / Google Play via
 * RevenueCat). Without the AI service it unlocks unlimited on-device Dream Interpretation and
 * Prophetic Word (free users get FREE_PER_MONTH of each, counted on the device). With the
 * service, the service re-checks the subscription before every interpretation and applies its
 * own monthly allowances, so the state here only drives the UI.
 */
export const ENTITLEMENT_ID = 'plus';

const API_KEY =
  (Platform.OS === 'ios'
    ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY
    : Platform.OS === 'android'
      ? process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY
      : undefined) ?? '';

/** Subscriptions are offered whenever the store SDK is configured (a RevenueCat public key is set). */
export const purchasesAvailable = API_KEY.length > 0;

/** Free users are limited on the device only when Plus is for sale and interpretations run locally. */
const limitsOnDevice = purchasesAvailable && !interpretUsesService;

type Subscription = {
  /** RevenueCat says the Plus entitlement is active on this device. */
  isPlus: boolean;
  /**
   * On-device interpretations left this month for a free user; null when there is no limit to show
   * (Micaiah Plus, no subscriptions configured, or the AI service applies its own allowance).
   */
  freeRemaining: (kind: InterpretationKind) => number | null;
  /** Counts one on-device interpretation against the free allowance (no-op when unlimited). */
  recordFreeUse: (kind: InterpretationKind) => Promise<void>;
  usage: Usage | null;
  refreshUsage: (options?: { recheckPlan?: boolean }) => Promise<Usage | null>;
  setUsage: (usage: Usage) => void;
  loadPackages: () => Promise<PurchasesPackage[]>;
  /** Resolves true when purchased, false when the person cancelled the store sheet. */
  purchase: (pkg: PurchasesPackage) => Promise<boolean>;
  /** Resolves true when an active Plus subscription was found and restored. */
  restore: () => Promise<boolean>;
  manage: () => Promise<void>;
  /** After "Delete all data": move purchases to the new install ID. */
  resetIdentity: () => Promise<void>;
};

const SubscriptionContext = createContext<Subscription | null>(null);

const hasPlus = (info: CustomerInfo) => info.entitlements.active[ENTITLEMENT_ID]?.isActive === true;

let configured: Promise<void> | null = null;

function ensureConfigured(): Promise<void> {
  configured ??= getInstallId().then((appUserID) => {
    Purchases.configure({ apiKey: API_KEY, appUserID });
  });
  return configured;
}

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [isPlus, setIsPlus] = useState(false);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [freeUsage, setFreeUsage] = useState<FreeUsage>(() => emptyUsage());

  useEffect(() => {
    if (limitsOnDevice) loadFreeUsage().then(setFreeUsage);
  }, []);

  const freeRemaining = useCallback(
    (kind: InterpretationKind) => (limitsOnDevice && !isPlus ? freeLeft(freeUsage, kind) : null),
    [freeUsage, isPlus],
  );

  const recordFreeUse = useCallback(
    async (kind: InterpretationKind) => {
      if (!limitsOnDevice || isPlus) return;
      const next = withUse(await loadFreeUsage(), kind);
      setFreeUsage(next);
      await saveFreeUsage(next).catch(() => {});
    },
    [isPlus],
  );

  const refreshUsage = useCallback(async (options: { recheckPlan?: boolean } = {}) => {
    if (!interpretUsesService) return null;
    try {
      const next = await fetchUsage(options.recheckPlan);
      setUsage(next);
      return next;
    } catch {
      return null;
    }
  }, []);

  // Usage is fetched by the screens that show it, and only after the person has agreed to use
  // interpretations — nothing is sent to the AI service just for opening the app.
  useEffect(() => {
    if (!purchasesAvailable) return;
    const onUpdate = (info: CustomerInfo) => setIsPlus(hasPlus(info));
    ensureConfigured()
      .then(() => {
        Purchases.addCustomerInfoUpdateListener(onUpdate);
        return Purchases.getCustomerInfo();
      })
      .then(onUpdate)
      .catch(() => {});
    return () => {
      Purchases.removeCustomerInfoUpdateListener(onUpdate);
    };
  }, []);

  const loadPackages = useCallback(async () => {
    await ensureConfigured();
    const offerings = await Purchases.getOfferings();
    return offerings.current?.availablePackages ?? [];
  }, []);

  const purchase = useCallback(
    async (pkg: PurchasesPackage) => {
      await ensureConfigured();
      try {
        const { customerInfo } = await Purchases.purchasePackage(pkg);
        setIsPlus(hasPlus(customerInfo));
        await refreshUsage({ recheckPlan: true });
        return true;
      } catch (error) {
        if ((error as { code?: string }).code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) return false;
        throw error;
      }
    },
    [refreshUsage],
  );

  const restore = useCallback(async () => {
    await ensureConfigured();
    const info = await Purchases.restorePurchases();
    const active = hasPlus(info);
    setIsPlus(active);
    await refreshUsage({ recheckPlan: true });
    return active;
  }, [refreshUsage]);

  const manage = useCallback(async () => {
    await ensureConfigured();
    const info = await Purchases.getCustomerInfo().catch(() => null);
    const fallback =
      Platform.OS === 'ios'
        ? 'https://apps.apple.com/account/subscriptions'
        : 'https://play.google.com/store/account/subscriptions';
    await Linking.openURL(info?.managementURL ?? fallback).catch(() => {});
  }, []);

  const resetIdentity = useCallback(async () => {
    setIsPlus(false);
    setUsage(null);
    if (purchasesAvailable) {
      await ensureConfigured();
      const { customerInfo } = await Purchases.logIn(await getInstallId());
      setIsPlus(hasPlus(customerInfo));
    }
    await refreshUsage();
  }, [refreshUsage]);

  const value = useMemo(
    () => ({
      isPlus,
      freeRemaining,
      recordFreeUse,
      usage,
      refreshUsage,
      setUsage,
      loadPackages,
      purchase,
      restore,
      manage,
      resetIdentity,
    }),
    [isPlus, freeRemaining, recordFreeUse, usage, refreshUsage, loadPackages, purchase, restore, manage, resetIdentity],
  );

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
}

export function useSubscription(): Subscription {
  const subscription = useContext(SubscriptionContext);
  if (!subscription) throw new Error('useSubscription must be used inside <SubscriptionProvider>');
  return subscription;
}

/** "$4.99 / month", "$39.99 / year" … from the store's own price and period. */
export function priceLabel(pkg: PurchasesPackage): string {
  const period = pkg.product.subscriptionPeriod;
  const unit =
    period === 'P1M' ? 'month' : period === 'P1Y' ? 'year' : period === 'P1W' ? 'week' : period === 'P3M' ? '3 months' : period === 'P6M' ? '6 months' : null;
  return unit ? `${pkg.product.priceString} / ${unit}` : pkg.product.priceString;
}

/** "1-week free trial" when the product has a free introductory offer. */
export function trialLabel(pkg: PurchasesPackage): string | null {
  const intro = pkg.product.introPrice;
  if (!intro || intro.price !== 0) return null;
  const unit = intro.periodUnit.toLowerCase();
  return `${intro.periodNumberOfUnits}-${unit} free trial`;
}
