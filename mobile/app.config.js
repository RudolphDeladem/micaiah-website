// Extends app.json with values that depend on the build environment.
// EXPO_PUBLIC_INSIGHT_API_URL turns on the optional cloud insight service; when it
// is set, reflection text can leave the device (with consent), so the iOS privacy
// manifest must declare it. Without it, the app collects no data at all.
module.exports = ({ config }) => {
  const cloudEnabled = Boolean(process.env.EXPO_PUBLIC_INSIGHT_API_URL);
  const privacyManifests = {
    ...config.ios.privacyManifests,
    NSPrivacyCollectedDataTypes: cloudEnabled
      ? [
          {
            NSPrivacyCollectedDataType: 'NSPrivacyCollectedDataTypeOtherUserContent',
            NSPrivacyCollectedDataTypeLinked: false,
            NSPrivacyCollectedDataTypeTracking: false,
            NSPrivacyCollectedDataTypePurposes: ['NSPrivacyCollectedDataTypePurposeAppFunctionality'],
          },
        ]
      : [],
  };
  return { ...config, ios: { ...config.ios, privacyManifests } };
};
