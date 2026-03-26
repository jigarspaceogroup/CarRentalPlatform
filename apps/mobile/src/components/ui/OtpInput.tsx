import React, { useRef, useEffect, useCallback } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  I18nManager,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
} from 'react-native';
import { colors, spacing, fontSize, borderRadius, fontWeight } from '../../theme';

interface OtpInputProps {
  length?: number;
  value: string[];
  onChange: (value: string[]) => void;
  onComplete?: (code: string) => void;
  error?: boolean;
}

export default function OtpInput({
  length = 6,
  value,
  onChange,
  onComplete,
  error = false,
}: OtpInputProps) {
  const inputRefs = useRef<Array<TextInput | null>>([]);
  const isRTL = I18nManager.isRTL;

  useEffect(() => {
    // Auto-focus first input on mount
    const timer = setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const handleChange = useCallback(
    (text: string, index: number) => {
      // Only allow digits
      const digit = text.replace(/[^0-9]/g, '');
      if (digit.length > 1) {
        // Handle paste: distribute digits across inputs
        const digits = digit.split('').slice(0, length);
        const newValue = [...value];
        digits.forEach((d, i) => {
          if (index + i < length) {
            newValue[index + i] = d;
          }
        });
        onChange(newValue);

        // Focus last filled or next empty
        const nextIndex = Math.min(index + digits.length, length - 1);
        inputRefs.current[nextIndex]?.focus();

        // Check completion
        if (newValue.filter(Boolean).length === length) {
          onComplete?.(newValue.join(''));
        }
        return;
      }

      const newValue = [...value];
      newValue[index] = digit;
      onChange(newValue);

      if (digit && index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }

      // Check completion
      if (digit && newValue.filter(Boolean).length === length) {
        onComplete?.(newValue.join(''));
      }
    },
    [value, onChange, onComplete, length],
  );

  const handleKeyPress = useCallback(
    (e: NativeSyntheticEvent<TextInputKeyPressEventData>, index: number) => {
      if (e.nativeEvent.key === 'Backspace' && !value[index] && index > 0) {
        const newValue = [...value];
        newValue[index - 1] = '';
        onChange(newValue);
        inputRefs.current[index - 1]?.focus();
      }
    },
    [value, onChange],
  );

  const boxes = Array.from({ length }, (_, i) => i);

  return (
    <View style={[styles.container, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
      {boxes.map((index) => (
        <TextInput
          key={index}
          ref={(ref) => {
            inputRefs.current[index] = ref;
          }}
          value={value[index] || ''}
          onChangeText={(text) => handleChange(text, index)}
          onKeyPress={(e) => handleKeyPress(e, index)}
          keyboardType="number-pad"
          maxLength={index === 0 ? length : 1}
          selectTextOnFocus
          style={[
            styles.box,
            value[index] ? styles.boxFilled : null,
            error ? styles.boxError : null,
          ]}
          textContentType="oneTimeCode"
          autoComplete="one-time-code"
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    gap: spacing.sm,
    marginVertical: spacing.lg,
  },
  box: {
    width: 48,
    height: 56,
    borderWidth: 1.5,
    borderColor: colors.gray[200],
    borderRadius: borderRadius.lg,
    textAlign: 'center',
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    color: colors.gray[900],
    backgroundColor: colors.white,
  },
  boxFilled: {
    borderColor: colors.primary[600],
    backgroundColor: colors.primary[50],
  },
  boxError: {
    borderColor: colors.red[500],
    backgroundColor: colors.red[50],
  },
});
