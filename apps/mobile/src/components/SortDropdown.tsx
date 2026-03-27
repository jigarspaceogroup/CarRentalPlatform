import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  I18nManager,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, spacing, fontSize, borderRadius, fontWeight } from '../theme';

export type SortOption = 'price_asc' | 'price_desc' | 'newest';

interface SortDropdownProps {
  value: SortOption;
  onChange: (option: SortOption) => void;
}

const OPTIONS: { key: SortOption; label: string }[] = [
  { key: 'newest', label: 'sort.newest' },
  { key: 'price_asc', label: 'sort.priceLow' },
  { key: 'price_desc', label: 'sort.priceHigh' },
];

export function sortOptionToParams(option: SortOption): {
  sortBy: 'dailyRate' | 'createdAt';
  sortOrder: 'asc' | 'desc';
} {
  switch (option) {
    case 'price_asc':
      return { sortBy: 'dailyRate', sortOrder: 'asc' };
    case 'price_desc':
      return { sortBy: 'dailyRate', sortOrder: 'desc' };
    case 'newest':
    default:
      return { sortBy: 'createdAt', sortOrder: 'desc' };
  }
}

export default function SortDropdown({ value, onChange }: SortDropdownProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const isRTL = I18nManager.isRTL;

  const selectedLabel = OPTIONS.find((o) => o.key === value)?.label ?? 'sort.newest';

  return (
    <View>
      <TouchableOpacity
        style={[styles.trigger, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
        onPress={() => setOpen(true)}
      >
        <Text style={styles.triggerText}>{t(selectedLabel)}</Text>
        <Text style={styles.chevron}>{'\u25BE'}</Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableWithoutFeedback onPress={() => setOpen(false)}>
          <View style={styles.overlay}>
            <View style={styles.dropdown}>
              {OPTIONS.map((option) => {
                const isSelected = option.key === value;
                return (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.option,
                      isSelected && styles.optionSelected,
                    ]}
                    onPress={() => {
                      onChange(option.key);
                      setOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        isSelected && styles.optionTextSelected,
                        { textAlign: isRTL ? 'right' : 'left' },
                      ]}
                    >
                      {t(option.label)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  trigger: {
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.gray[200],
    backgroundColor: colors.white,
  },
  triggerText: {
    fontSize: fontSize.sm,
    color: colors.gray[700],
    fontWeight: fontWeight.medium,
  },
  chevron: {
    fontSize: 12,
    color: colors.gray[500],
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: spacing.xl,
  },
  dropdown: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.sm,
    width: '100%',
    maxWidth: 300,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  option: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  optionSelected: {
    backgroundColor: colors.primary[50],
  },
  optionText: {
    fontSize: fontSize.md,
    color: colors.gray[700],
  },
  optionTextSelected: {
    color: colors.primary[600],
    fontWeight: fontWeight.semibold,
  },
});
