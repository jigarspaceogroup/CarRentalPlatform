import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { colors, fontSize, fontWeight } from '../../src/theme';

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
          title: t('home.home'),
          tabBarIcon: ({ color }) => (
            // Placeholder icon - text-based until @expo/vector-icons is added
            null
          ),
        }}
      />
    </Tabs>
  );
}
