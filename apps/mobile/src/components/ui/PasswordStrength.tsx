import React, { useMemo } from 'react';
import { View, Text, StyleSheet, I18nManager } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, spacing, fontSize, borderRadius, fontWeight } from '../../theme';

interface PasswordStrengthProps {
  password: string;
}

interface PasswordCriteria {
  minLength: boolean;
  uppercase: boolean;
  lowercase: boolean;
  number: boolean;
}

export function getPasswordCriteria(password: string): PasswordCriteria {
  return {
    minLength: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
  };
}

export function isPasswordStrong(password: string): boolean {
  const criteria = getPasswordCriteria(password);
  return criteria.minLength && criteria.uppercase && criteria.lowercase && criteria.number;
}

function getStrengthLevel(criteria: PasswordCriteria): {
  level: number;
  label: string;
  color: string;
} {
  const met = Object.values(criteria).filter(Boolean).length;
  if (met === 0) return { level: 0, label: 'weak', color: colors.gray[300] };
  if (met === 1) return { level: 1, label: 'weak', color: colors.red[500] };
  if (met === 2) return { level: 2, label: 'fair', color: colors.orange[500] };
  if (met === 3) return { level: 3, label: 'good', color: colors.yellow[500] };
  return { level: 4, label: 'strong', color: colors.green[500] };
}

export default function PasswordStrength({ password }: PasswordStrengthProps) {
  const { t } = useTranslation();
  const isRTL = I18nManager.isRTL;

  const criteria = useMemo(() => getPasswordCriteria(password), [password]);
  const strength = useMemo(() => getStrengthLevel(criteria), [criteria]);

  if (!password) return null;

  const bars = [1, 2, 3, 4];

  const criteriaItems: Array<{ key: keyof PasswordCriteria; label: string }> = [
    { key: 'minLength', label: t('register.passwordStrength.minLength') },
    { key: 'uppercase', label: t('register.passwordStrength.uppercase') },
    { key: 'lowercase', label: t('register.passwordStrength.lowercase') },
    { key: 'number', label: t('register.passwordStrength.number') },
  ];

  return (
    <View style={styles.container}>
      <View style={[styles.barRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        {bars.map((bar) => (
          <View
            key={bar}
            style={[
              styles.bar,
              { backgroundColor: bar <= strength.level ? strength.color : colors.gray[200] },
            ]}
          />
        ))}
        <Text
          style={[
            styles.strengthLabel,
            { color: strength.color, writingDirection: isRTL ? 'rtl' : 'ltr' },
          ]}
        >
          {t(`register.passwordStrength.${strength.label}`)}
        </Text>
      </View>
      <View style={styles.criteriaList}>
        {criteriaItems.map((item) => (
          <View
            key={item.key}
            style={[styles.criteriaRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
          >
            <Text
              style={[
                styles.criteriaIcon,
                { color: criteria[item.key] ? colors.green[500] : colors.gray[400] },
              ]}
            >
              {criteria[item.key] ? '\u2713' : '\u2022'}
            </Text>
            <Text
              style={[
                styles.criteriaText,
                criteria[item.key] && styles.criteriaMet,
                { writingDirection: isRTL ? 'rtl' : 'ltr' },
              ]}
            >
              {item.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  barRow: {
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  bar: {
    flex: 1,
    height: 4,
    borderRadius: borderRadius.full,
  },
  strengthLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    marginLeft: spacing.sm,
    marginRight: spacing.sm,
    minWidth: 50,
  },
  criteriaList: {
    gap: spacing.xs,
  },
  criteriaRow: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  criteriaIcon: {
    fontSize: fontSize.sm,
    width: 16,
    textAlign: 'center',
  },
  criteriaText: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
  },
  criteriaMet: {
    color: colors.green[600],
  },
});
