import { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useNotifications } from '@/hooks/useNotifications';

const ICON_MAP: Record<string, string> = {
  BOOKING_CONFIRMATION: '📋',
  BOOKING_STATUS_CHANGE: '🔄',
  OTP_DELIVERY: '🔑',
  PAYMENT_CONFIRMATION: '💳',
  PROMOTIONAL: '🎉',
  SYSTEM: '⚙️',
};

function timeAgo(dateStr: string, t: (key: string) => string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return t('notifications.justNow');
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export default function NotificationsScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { notifications, isLoading, unreadCount, refetch, markAsRead, markAllAsRead } =
    useNotifications();
  const [refreshing, setRefreshing] = useState(false);

  const isArabic = i18n.language === 'ar';

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handlePress = useCallback(
    async (item: any) => {
      if (!item.isRead) {
        await markAsRead(item.id);
      }
      if (item.deepLink) {
        const match = item.deepLink.match(/booking:\/\/(.+)/);
        if (match) {
          router.push(`/(tabs)/booking-detail/${match[1]}` as any);
        }
      }
    },
    [markAsRead, router]
  );

  const renderItem = useCallback(
    ({ item }: { item: any }) => (
      <TouchableOpacity
        style={[styles.notificationItem, !item.isRead && styles.unreadItem]}
        onPress={() => handlePress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>{ICON_MAP[item.type] || '📌'}</Text>
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.notificationTitle, !item.isRead && styles.unreadTitle]} numberOfLines={1}>
            {isArabic ? item.titleAr : item.titleEn}
          </Text>
          <Text style={styles.notificationBody} numberOfLines={2}>
            {isArabic ? item.bodyAr : item.bodyEn}
          </Text>
          <Text style={styles.timeAgo}>{timeAgo(item.createdAt, t)}</Text>
        </View>
        {!item.isRead && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    ),
    [handlePress, isArabic, t]
  );

  if (isLoading && notifications.length === 0) {
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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t('notifications.title')}</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllAsRead} style={styles.markAllButton}>
            <Text style={styles.markAllText}>{t('notifications.markAllRead')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Unread badge */}
      {unreadCount > 0 && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadBadgeText}>
            {unreadCount} {t('notifications.unread')}
          </Text>
        </View>
      )}

      {/* List */}
      <FlatList
        data={notifications}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563eb" />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyText}>{t('notifications.noNotifications')}</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  title: { fontSize: 24, fontWeight: '700', color: '#111827' },
  markAllButton: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#eff6ff', borderRadius: 8 },
  markAllText: { fontSize: 13, fontWeight: '600', color: '#2563eb' },
  unreadBadge: { marginHorizontal: 20, marginBottom: 8, backgroundColor: '#dbeafe', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start' },
  unreadBadgeText: { fontSize: 12, fontWeight: '600', color: '#1d4ed8' },
  list: { paddingHorizontal: 16, paddingBottom: 32 },
  notificationItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#e5e7eb' },
  unreadItem: { backgroundColor: '#f0f9ff', borderColor: '#bfdbfe' },
  iconContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  icon: { fontSize: 18 },
  textContainer: { flex: 1 },
  notificationTitle: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 2 },
  unreadTitle: { color: '#111827' },
  notificationBody: { fontSize: 13, color: '#6b7280', lineHeight: 18, marginBottom: 4 },
  timeAgo: { fontSize: 11, color: '#9ca3af' },
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#2563eb', marginLeft: 8 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, color: '#6b7280' },
});
