import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  I18nManager,
  Alert,
  Share,
  Linking,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { WebView } from 'react-native-webview';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { colors, spacing, fontSize, fontWeight } from '../../../src/theme';

export default function DocumentViewerScreen() {
  const { url, title } = useLocalSearchParams<{ url: string; title?: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isRTL = I18nManager.isRTL;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleBack = () => {
    router.back();
  };

  const handleDownload = async () => {
    if (!url) return;

    try {
      setIsDownloading(true);

      // Generate filename from title or use default
      const filename = title ? `${title.replace(/\s+/g, '_')}.pdf` : 'document.pdf';
      const fileUri = `${FileSystem.documentDirectory}${filename}`;

      // Download file
      const downloadResult = await FileSystem.downloadAsync(url, fileUri);

      if (downloadResult.status === 200) {
        Alert.alert(
          t('common.success'),
          t('documentViewer.downloadSuccess'),
          [
            {
              text: t('documentViewer.openFile'),
              onPress: () => {
                if (Platform.OS === 'ios') {
                  Sharing.shareAsync(downloadResult.uri);
                } else {
                  Linking.openURL(downloadResult.uri);
                }
              },
            },
            { text: t('common.done'), style: 'cancel' },
          ],
        );
      } else {
        throw new Error('Download failed');
      }
    } catch (err) {
      Alert.alert(t('common.error'), t('documentViewer.downloadFailed'));
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = async () => {
    if (!url) return;

    try {
      await Share.share({
        message: title || 'Document',
        url: url,
      });
    } catch (err) {
      // Share cancelled or failed silently
    }
  };

  if (!url) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>{t('documentViewer.noUrl')}</Text>
        <TouchableOpacity onPress={handleBack} style={styles.backLink}>
          <Text style={styles.backLinkText}>{t('common.back')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Use Google Docs Viewer for PDF rendering
  const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backText}>{isRTL ? '\u2192' : '\u2190'}</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
          {title || t('documentViewer.title')}
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleShare} style={styles.iconButton}>
            <Text style={styles.iconButtonText}>{'\u2197'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleDownload}
            style={styles.iconButton}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <ActivityIndicator size="small" color={colors.gray[800]} />
            ) : (
              <Text style={styles.iconButtonText}>{'\u2B73'}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.webViewContainer}>
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.primary[600]} />
            <Text style={styles.loadingText}>{t('documentViewer.loading')}</Text>
          </View>
        )}

        <WebView
          source={{ uri: viewerUrl }}
          onLoadStart={() => setIsLoading(true)}
          onLoadEnd={() => setIsLoading(false)}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            setError(nativeEvent.description || t('documentViewer.loadError'));
            setIsLoading(false);
          }}
          style={styles.webView}
          scalesPageToFit
          startInLoadingState
        />

        {error && (
          <View style={styles.errorOverlay}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              onPress={() => {
                setError(null);
                setIsLoading(true);
              }}
              style={styles.retryButton}
            >
              <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => Linking.openURL(url)}
              style={styles.openExternalButton}
            >
              <Text style={styles.openExternalText}>{t('documentViewer.openExternal')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    fontSize: 22,
    color: colors.gray[800],
    fontWeight: fontWeight.bold,
  },
  headerTitle: {
    flex: 1,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.gray[900],
    marginHorizontal: spacing.sm,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonText: {
    fontSize: 18,
    color: colors.gray[800],
  },
  webViewContainer: {
    flex: 1,
    position: 'relative',
  },
  webView: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: fontSize.md,
    color: colors.gray[500],
  },
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    zIndex: 10,
  },
  errorText: {
    fontSize: fontSize.md,
    color: colors.red[500],
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  retryButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary[600],
    borderRadius: 8,
    marginBottom: spacing.sm,
  },
  retryButtonText: {
    fontSize: fontSize.sm,
    color: colors.white,
    fontWeight: fontWeight.semibold,
  },
  openExternalButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  openExternalText: {
    fontSize: fontSize.sm,
    color: colors.primary[600],
    fontWeight: fontWeight.medium,
    textDecorationLine: 'underline',
  },
  backLink: {
    marginTop: spacing.md,
  },
  backLinkText: {
    fontSize: fontSize.md,
    color: colors.primary[600],
    fontWeight: fontWeight.medium,
  },
});
