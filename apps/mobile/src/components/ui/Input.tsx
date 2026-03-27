import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  I18nManager,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { colors, spacing, fontSize, borderRadius, fontWeight } from '../../theme';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  leftText?: string;
  secureTextEntry?: boolean;
  containerStyle?: ViewStyle;
}

export default function Input({
  label,
  error,
  leftText,
  secureTextEntry = false,
  containerStyle,
  ...rest
}: InputProps) {
  const [isSecure, setIsSecure] = useState(secureTextEntry);
  const [isFocused, setIsFocused] = useState(false);
  const isRTL = I18nManager.isRTL;

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <Text
          style={[
            styles.label,
            { textAlign: isRTL ? 'right' : 'left' },
          ]}
        >
          {label}
        </Text>
      ) : null}
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputFocused,
          error ? styles.inputError : null,
          { flexDirection: isRTL ? 'row-reverse' : 'row' },
        ]}
      >
        {leftText ? (
          <View style={[styles.leftTextContainer, isRTL ? styles.leftTextRTL : null]}>
            <Text style={styles.leftText}>{leftText}</Text>
          </View>
        ) : null}
        <TextInput
          {...rest}
          secureTextEntry={isSecure}
          onFocus={(e) => {
            setIsFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            rest.onBlur?.(e);
          }}
          style={[
            styles.input,
            { textAlign: isRTL ? 'right' : 'left', writingDirection: isRTL ? 'rtl' : 'ltr' },
          ]}
          placeholderTextColor={colors.gray[400]}
        />
        {secureTextEntry ? (
          <TouchableOpacity
            onPress={() => setIsSecure(!isSecure)}
            style={styles.eyeButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.eyeText}>{isSecure ? 'Show' : 'Hide'}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      {error ? (
        <Text
          style={[
            styles.error,
            { textAlign: isRTL ? 'right' : 'left' },
          ]}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
    width: '100%',
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.gray[700],
    marginBottom: spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.gray[200],
    borderRadius: borderRadius.lg,
    backgroundColor: colors.white,
    minHeight: 50,
  },
  inputFocused: {
    borderColor: colors.primary[600],
    shadowColor: colors.primary[600],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  inputError: {
    borderColor: colors.red[500],
  },
  leftTextContainer: {
    paddingHorizontal: spacing.sm + 4,
    borderRightWidth: 1,
    borderRightColor: colors.gray[200],
    justifyContent: 'center',
    height: '100%',
    minHeight: 50,
  },
  leftTextRTL: {
    borderRightWidth: 0,
    borderLeftWidth: 1,
    borderLeftColor: colors.gray[200],
  },
  leftText: {
    fontSize: fontSize.md,
    color: colors.gray[600],
    fontWeight: fontWeight.medium,
  },
  input: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: fontSize.md,
    color: colors.gray[900],
  },
  eyeButton: {
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  eyeText: {
    fontSize: fontSize.sm,
    color: colors.primary[600],
    fontWeight: fontWeight.medium,
  },
  error: {
    fontSize: fontSize.xs,
    color: colors.red[500],
    marginTop: spacing.xs,
  },
});
