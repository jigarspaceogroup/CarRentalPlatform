import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  I18nManager,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import api from '../../../src/lib/api';
import Button from '../../../src/components/ui/Button';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../../src/theme';

interface SupportContact {
  emergencyPhone: string | null;
  supportPhone: string | null;
  supportEmail: string | null;
}

export default function EmergencySupportScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const isRTL = I18nManager.isRTL;

  const [contact, setContact] = useState<SupportContact | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSupportContact();
  }, []);

  const fetchSupportContact = async () => {
    try {
      setIsLoading(true);
      const { data } = await api.get('/support-contact');
      setContact(data.data ?? data);
    } catch (error) {
      Alert.alert(
        t('common.error'),
        error instanceof Error ? error.message : t('support.loadFailed'),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCall = (phone: string) => {
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    Linking.openURL(`tel:${cleanPhone}`).catch(() => {
      Alert.alert(t('common.error'), t('support.callFailed'));
    });
  };

  const handleEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`).catch(() => {
      Alert.alert(t('common.error'), t('support.emailFailed'));
    });
  };

  const handleReportAccident = () => {
    Alert.alert(
      t('support.reportAccident'),
      t('support.reportAccidentMessage'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('support.callNow'),
          onPress: () => {
            if (contact?.emergencyPhone) {
              handleCall(contact.emergencyPhone);
            }
          },
        },
      ],
    );
  };

  const handleRoadsideAssistance = () => {
    Alert.alert(
      t('support.roadsideAssistance'),
      t('support.roadsideAssistanceMessage'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('support.requestHelp'),
          onPress: () => {
            if (contact?.supportPhone) {
              handleCall(contact.supportPhone);
            }
          },
        },
      ],
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.primary[600]} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backButton, isRTL && styles.backButtonRTL]}
        >
          <Text style={styles.backIcon}>{isRTL ? '\u203A' : '\u2039'}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('support.emergency')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {/* Warning Banner */}
        <View style={styles.warningBanner}>
          <Text style={styles.warningIcon}>⚠️</Text>
          <Text style={[styles.warningText, { textAlign: isRTL ? 'right' : 'left' }]}>
            {t('support.emergencyWarning')}
          </Text>
        </View>

        {/* Emergency Contact */}
        {contact?.emergencyPhone && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
              {t('support.emergencyContact')}
            </Text>
            <TouchableOpacity
              style={[styles.contactCard, styles.emergencyCard]}
              onPress={() => handleCall(contact.emergencyPhone!)}
              activeOpacity={0.7}
            >
              <View style={styles.contactIcon}>
                <Text style={styles.contactIconText}>🚨</Text>
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>{t('support.emergency24h')}</Text>
                <Text style={styles.contactValue}>{contact.emergencyPhone}</Text>
              </View>
              <Text style={styles.contactArrow}>📞</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Support Contacts */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
            {t('support.supportContacts')}
          </Text>

          {contact?.supportPhone && (
            <TouchableOpacity
              style={styles.contactCard}
              onPress={() => handleCall(contact.supportPhone!)}
              activeOpacity={0.7}
            >
              <View style={styles.contactIcon}>
                <Text style={styles.contactIconText}>📞</Text>
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>{t('support.phone')}</Text>
                <Text style={styles.contactValue}>{contact.supportPhone}</Text>
              </View>
            </TouchableOpacity>
          )}

          {contact?.supportEmail && (
            <TouchableOpacity
              style={styles.contactCard}
              onPress={() => handleEmail(contact.supportEmail!)}
              activeOpacity={0.7}
            >
              <View style={styles.contactIcon}>
                <Text style={styles.contactIconText}>✉️</Text>
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>{t('support.email')}</Text>
                <Text style={styles.contactValue}>{contact.supportEmail}</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
            {t('support.quickActions')}
          </Text>

          <Button
            title={t('support.reportAccident')}
            onPress={handleReportAccident}
            variant="outline"
            size="lg"
            style={styles.actionButton}
          />

          <Button
            title={t('support.roadsideAssistance')}
            onPress={handleRoadsideAssistance}
            variant="outline"
            size="lg"
            style={styles.actionButton}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  backButtonRTL: {
    alignItems: 'flex-end',
  },
  backIcon: {
    fontSize: 32,
    color: colors.gray[700],
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.gray[900],
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.orange[400] + '20',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.orange[400],
    marginBottom: spacing.lg,
  },
  warningIcon: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  warningText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.orange[500],
    fontWeight: fontWeight.medium,
    lineHeight: 20,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.gray[700],
    marginBottom: spacing.md,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  emergencyCard: {
    backgroundColor: colors.red[50],
    borderColor: colors.red[500],
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  contactIconText: {
    fontSize: 24,
  },
  contactInfo: {
    flex: 1,
  },
  contactLabel: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
    marginBottom: spacing.xs,
  },
  contactValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.gray[900],
  },
  contactArrow: {
    fontSize: 24,
  },
  actionButton: {
    marginBottom: spacing.md,
  },
});
