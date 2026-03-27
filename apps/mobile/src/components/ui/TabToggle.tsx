import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, I18nManager } from 'react-native';
import { colors, spacing, fontSize, borderRadius, fontWeight } from '../../theme';

interface TabToggleProps {
  tabs: Array<{ key: string; label: string }>;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function TabToggle({ tabs, activeTab, onTabChange }: TabToggleProps) {
  const isRTL = I18nManager.isRTL;

  return (
    <View style={[styles.container, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
      {tabs.map((tab) => {
        const isActive = tab.key === activeTab;
        return (
          <TouchableOpacity
            key={tab.key}
            onPress={() => onTabChange(tab.key)}
            activeOpacity={0.7}
            style={[styles.tab, isActive && styles.activeTab]}
          >
            <Text
              style={[
                styles.tabText,
                isActive && styles.activeTabText,
                { writingDirection: isRTL ? 'rtl' : 'ltr' },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.lg,
    padding: spacing.xs,
    marginBottom: spacing.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
  },
  activeTab: {
    backgroundColor: colors.white,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  tabText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.gray[500],
  },
  activeTabText: {
    color: colors.primary[600],
    fontWeight: fontWeight.semibold,
  },
});
