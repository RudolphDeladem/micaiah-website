import Ionicons from '@expo/vector-icons/Ionicons';
import { Linking, Pressable, View } from 'react-native';

import { Card, Screen, T } from '@/components/ui';
import { Colors, Spacing } from '@/constants/theme';
import { CRISIS_RESOURCES } from '@/lib/crisis';

export default function Crisis() {
  return (
    <Screen edges={[]} contentStyle={{ gap: Spacing.md }}>
      <T variant="title">You are not alone</T>
      <T>
        If you are thinking about harming yourself, are in danger, or need someone to talk to right now, please reach
        out. These services are free and confidential.
      </T>
      {CRISIS_RESOURCES.map((r) => (
        <Pressable
          key={r.name}
          accessibilityRole={r.url ? 'link' : 'text'}
          accessibilityLabel={`${r.name}. ${r.detail}`}
          disabled={!r.url}
          onPress={() => r.url && Linking.openURL(r.url).catch(() => {})}
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
          <Card style={{ flexDirection: 'row', gap: Spacing.md, alignItems: 'center' }}>
            <View style={{ flex: 1, gap: 4 }}>
              <T variant="label">{r.region}</T>
              <T variant="heading">{r.name}</T>
              <T variant="small">{r.detail}</T>
            </View>
            {r.url ? (
              <Ionicons
                name={r.url.startsWith('tel:') ? 'call' : 'open-outline'}
                size={22}
                color={Colors.indigoMid}
              />
            ) : null}
          </Card>
        </Pressable>
      ))}
      <T variant="small" style={{ textAlign: 'center', marginTop: Spacing.sm }}>
        Micaiah AI is a devotional companion and cannot provide emergency, medical, or counseling services. Reaching out
        to a pastor, a trusted friend, or a licensed professional is a brave and faithful step.
      </T>
    </Screen>
  );
}
