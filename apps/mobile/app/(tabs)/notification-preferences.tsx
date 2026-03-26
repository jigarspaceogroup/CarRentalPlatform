import { View, Text, Switch, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNotificationPreferences } from '@/hooks/useNotifications';

export default function NotificationPreferencesScreen() {
  const { t } = useTranslation();
  const { preferences, isLoading, updatePreferences } = useNotificationPreferences();

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>{t('notifications.preferences')}</Text>

      <View style={styles.card}>
        {/* Booking Updates - always on */}
        <View style={styles.row}>
          <View style={styles.labelContainer}>
            <Text style={styles.label}>{t('notifications.bookingUpdates')}</Text>
            <Text style={styles.description}>{t('notifications.bookingUpdatesDesc')}</Text>
            <Text style={styles.alwaysOn}>{t('notifications.alwaysOn')}</Text>
          </View>
          <Switch
            value={true}
            disabled={true}
            trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
            thumbColor="#2563eb"
          />
        </View>

        <View style={styles.divider} />

        {/* Promotional */}
        <View style={styles.row}>
          <View style={styles.labelContainer}>
            <Text style={styles.label}>{t('notifications.promotional')}</Text>
            <Text style={styles.description}>{t('notifications.promotionalDesc')}</Text>
          </View>
          <Switch
            value={preferences.promotional}
            onValueChange={(val) => updatePreferences({ promotional: val })}
            trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
            thumbColor={preferences.promotional ? '#2563eb' : '#f4f3f4'}
          />
        </View>

        <View style={styles.divider} />

        {/* Reminders */}
        <View style={styles.row}>
          <View style={styles.labelContainer}>
            <Text style={styles.label}>{t('notifications.reminders')}</Text>
            <Text style={styles.description}>{t('notifications.remindersDesc')}</Text>
          </View>
          <Switch
            value={preferences.reminders}
            onValueChange={(val) => updatePreferences({ reminders: val })}
            trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
            thumbColor={preferences.reminders ? '#2563eb' : '#f4f3f4'}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', padding: 20 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '700', color: '#111827', marginBottom: 20 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 4, borderWidth: 1, borderColor: '#e5e7eb' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 16 },
  labelContainer: { flex: 1, marginRight: 16 },
  label: { fontSize: 16, fontWeight: '600', color: '#111827' },
  description: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  alwaysOn: { fontSize: 11, color: '#2563eb', fontWeight: '600', marginTop: 4 },
  divider: { height: 1, backgroundColor: '#f3f4f6', marginHorizontal: 16 },
});
