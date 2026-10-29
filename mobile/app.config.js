// Extends app.json with values that depend on the build environment.
//
// EXPO_PUBLIC_INSIGHT_API_URL turns on the optional AI service (cloud insights, Dream
// Interpretation, Prophetic Word). When it is set, text people choose to submit leaves the
// device (with consent), so the iOS privacy manifest must declare it. Without it, the app
// collects no data at all.
//
// EXPO_PUBLIC_REVENUECAT_IOS_KEY / _ANDROID_KEY turn on the Micaiah Plus subscription, which
// adds purchase history (processed by Apple/Google and RevenueCat) to the declaration.
module.exports = ({ config }) => {
  const cloudEnabled = Boolean(process.env.EXPO_PUBLIC_INSIGHT_API_URL);
  const purchasesEnabled =
    cloudEnabled &&
    Boolean(process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY);

  const collected = (type) => ({
    NSPrivacyCollectedDataType: type,
    NSPrivacyCollectedDataTypeLinked: false,
    NSPrivacyCollectedDataTypeTracking: false,
    NSPrivacyCollectedDataTypePurposes: ['NSPrivacyCollectedDataTypePurposeAppFunctionality'],
  });
  const privacyManifests = {
    ...config.ios.privacyManifests,
    NSPrivacyCollectedDataTypes: [
      ...(cloudEnabled ? [collected('NSPrivacyCollectedDataTypeOtherUserContent')] : []),
      ...(purchasesEnabled ? [collected('NSPrivacyCollectedDataTypePurchaseHistory')] : []),
    ],
  };

  // Over-the-air updates (EAS Update). The project ID is written into app.json by
  // `eas init`, which the GitHub workflows run before building or publishing.
  const projectId = config.extra?.eas?.projectId;

  return {
    ...config,
    ios: { ...config.ios, privacyManifests },
    runtimeVersion: { policy: 'appVersion' },
    updates: projectId ? { ...config.updates, url: `https://u.expo.dev/${projectId}` } : config.updates,
  };
};
