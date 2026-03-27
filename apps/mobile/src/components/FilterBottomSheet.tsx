import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  TextInput,
  ScrollView,
  Animated,
  I18nManager,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, fontSize, borderRadius, fontWeight } from '../theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface FilterValues {
  transmission?: 'AUTOMATIC' | 'MANUAL';
  fuelType?: 'PETROL' | 'DIESEL' | 'ELECTRIC' | 'HYBRID';
  minPrice?: number;
  maxPrice?: number;
}

interface FilterBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: FilterValues) => void;
  initialValues?: FilterValues;
}

type TransmissionOption = 'ANY' | 'AUTOMATIC' | 'MANUAL';
type FuelTypeOption = 'PETROL' | 'DIESEL' | 'ELECTRIC' | 'HYBRID';

const FUEL_TYPES: FuelTypeOption[] = ['PETROL', 'DIESEL', 'ELECTRIC', 'HYBRID'];

const FUEL_TYPE_LABELS: Record<FuelTypeOption, string> = {
  PETROL: 'filter.petrol',
  DIESEL: 'filter.diesel',
  ELECTRIC: 'filter.electric',
  HYBRID: 'filter.hybrid',
};

function countActiveFilters(filters: FilterValues): number {
  let count = 0;
  if (filters.transmission) count++;
  if (filters.fuelType) count++;
  if (filters.minPrice !== undefined && filters.minPrice > 0) count++;
  if (filters.maxPrice !== undefined && filters.maxPrice > 0) count++;
  return count;
}

export { countActiveFilters };

export default function FilterBottomSheet({
  visible,
  onClose,
  onApply,
  initialValues = {},
}: FilterBottomSheetProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const isRTL = I18nManager.isRTL;

  const [transmission, setTransmission] = useState<TransmissionOption>('ANY');
  const [selectedFuelTypes, setSelectedFuelTypes] = useState<Set<FuelTypeOption>>(new Set());
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [slideAnim] = useState(new Animated.Value(SCREEN_HEIGHT));

  useEffect(() => {
    if (visible) {
      // Initialize from props
      setTransmission(initialValues.transmission ?? 'ANY');
      setSelectedFuelTypes(
        initialValues.fuelType ? new Set([initialValues.fuelType]) : new Set(),
      );
      setMinPrice(
        initialValues.minPrice !== undefined && initialValues.minPrice > 0
          ? String(initialValues.minPrice)
          : '',
      );
      setMaxPrice(
        initialValues.maxPrice !== undefined && initialValues.maxPrice > 0
          ? String(initialValues.maxPrice)
          : '',
      );

      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, initialValues, slideAnim]);

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  const handleApply = () => {
    const filters: FilterValues = {};
    if (transmission !== 'ANY') {
      filters.transmission = transmission;
    }
    if (selectedFuelTypes.size === 1) {
      filters.fuelType = [...selectedFuelTypes][0];
    }
    const min = parseFloat(minPrice);
    const max = parseFloat(maxPrice);
    if (!isNaN(min) && min > 0) filters.minPrice = min;
    if (!isNaN(max) && max > 0) filters.maxPrice = max;

    onApply(filters);
    handleClose();
  };

  const handleReset = () => {
    setTransmission('ANY');
    setSelectedFuelTypes(new Set());
    setMinPrice('');
    setMaxPrice('');
  };

  const toggleFuelType = (fuel: FuelTypeOption) => {
    setSelectedFuelTypes((prev) => {
      const next = new Set(prev);
      if (next.has(fuel)) {
        next.delete(fuel);
      } else {
        // Only allow one fuel type for the API filter
        next.clear();
        next.add(fuel);
      }
      return next;
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoid}
        pointerEvents="box-none"
      >
        <Animated.View
          style={[
            styles.sheet,
            { paddingBottom: insets.bottom + spacing.md },
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Handle bar */}
          <View style={styles.handleBar} />

          {/* Header */}
          <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={styles.headerTitle}>{t('filter.title')}</Text>
            <TouchableOpacity onPress={handleReset}>
              <Text style={styles.resetText}>{t('filter.reset')}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* Price Range */}
            <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
              {t('filter.priceRange')}
            </Text>
            <View style={[styles.priceRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <View style={styles.priceInputWrapper}>
                <TextInput
                  style={[styles.priceInput, { textAlign: isRTL ? 'right' : 'left' }]}
                  placeholder={t('filter.minPrice')}
                  placeholderTextColor={colors.gray[400]}
                  keyboardType="numeric"
                  value={minPrice}
                  onChangeText={setMinPrice}
                />
              </View>
              <Text style={styles.priceSeparator}>-</Text>
              <View style={styles.priceInputWrapper}>
                <TextInput
                  style={[styles.priceInput, { textAlign: isRTL ? 'right' : 'left' }]}
                  placeholder={t('filter.maxPrice')}
                  placeholderTextColor={colors.gray[400]}
                  keyboardType="numeric"
                  value={maxPrice}
                  onChangeText={setMaxPrice}
                />
              </View>
            </View>

            {/* Transmission */}
            <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
              {t('filter.transmission')}
            </Text>
            <View style={[styles.chipRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              {(['ANY', 'AUTOMATIC', 'MANUAL'] as TransmissionOption[]).map((option) => {
                const isSelected = transmission === option;
                const label =
                  option === 'ANY'
                    ? t('filter.any')
                    : option === 'AUTOMATIC'
                      ? t('filter.automatic')
                      : t('filter.manual');
                return (
                  <TouchableOpacity
                    key={option}
                    style={[styles.chip, isSelected && styles.chipSelected]}
                    onPress={() => setTransmission(option)}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Fuel Type */}
            <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
              {t('filter.fuelType')}
            </Text>
            <View style={[styles.chipRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              {FUEL_TYPES.map((fuel) => {
                const isSelected = selectedFuelTypes.has(fuel);
                return (
                  <TouchableOpacity
                    key={fuel}
                    style={[styles.chip, isSelected && styles.chipSelected]}
                    onPress={() => toggleFuelType(fuel)}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                      {t(FUEL_TYPE_LABELS[fuel])}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Apply Button */}
          <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
            <Text style={styles.applyButtonText}>{t('filter.apply')}</Text>
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  keyboardAvoid: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.lg,
    maxHeight: SCREEN_HEIGHT * 0.75,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: colors.gray[300],
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  header: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
  },
  resetText: {
    fontSize: fontSize.sm,
    color: colors.primary[600],
    fontWeight: fontWeight.medium,
  },
  content: {
    flexGrow: 0,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.gray[800],
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  priceRow: {
    gap: spacing.sm,
    alignItems: 'center',
  },
  priceInputWrapper: {
    flex: 1,
  },
  priceInput: {
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: fontSize.md,
    color: colors.gray[900],
    backgroundColor: colors.gray[50],
  },
  priceSeparator: {
    fontSize: fontSize.lg,
    color: colors.gray[400],
  },
  chipRow: {
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.gray[200],
    backgroundColor: colors.white,
  },
  chipSelected: {
    borderColor: colors.primary[600],
    backgroundColor: colors.primary[50],
  },
  chipText: {
    fontSize: fontSize.sm,
    color: colors.gray[600],
    fontWeight: fontWeight.medium,
  },
  chipTextSelected: {
    color: colors.primary[600],
  },
  applyButton: {
    backgroundColor: colors.primary[600],
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  applyButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
});
