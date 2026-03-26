import { Tabs } from 'expo-router';
import { Text, StyleSheet, I18nManager } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, fontSize, fontWeight } from '../../src/theme';

/**
 * Simple text-based tab icon component.
 * Uses unicode symbols as icon placeholders until @expo/vector-icons is added.
 */
function TabIcon({ symbol, color }: { symbol: string; color: string }) {
  return <Text style={[styles.icon, { color }]}>{symbol}</Text>;
}

export default function TabsLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary[600],
        tabBarInactiveTintColor: colors.gray[400],
        tabBarLabelStyle: {
          fontSize: fontSize.xs,
          fontWeight: fontWeight.medium,
          writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr',
        },
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.gray[100],
          borderTopWidth: 1,
          paddingBottom: 4,
          paddingTop: 4,
          height: 60,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ color }) => <TabIcon symbol={'\u2302'} color={color} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: t('tabs.search'),
          tabBarIcon: ({ color }) => <TabIcon symbol={'\uD83D\uDD0D'} color={color} />,
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: t('tabs.bookings'),
          tabBarIcon: ({ color }) => <TabIcon symbol={'\uD83D\uDCC5'} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ color }) => <TabIcon symbol={'\uD83D\uDC64'} color={color} />,
        }}
      />
      {/* Hide nested dynamic routes from the tab bar */}
      <Tabs.Screen
        name="category/[id]"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="vehicle/[id]"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  icon: {
    fontSize: 22,
  },
});
