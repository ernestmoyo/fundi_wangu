import React, { useState } from 'react';
import {
  View,
  TextInput as RNTextInput,
  Text,
  StyleSheet,
  type TextInputProps as RNTextInputProps,
} from 'react-native';
import { colors } from '@fundi-wangu/ui-components';

interface TextInputProps extends Omit<RNTextInputProps, 'style'> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function TextInput({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  ...rest
}: TextInputProps) {
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? colors.danger[500]
    : focused
      ? colors.primary[500]
      : colors.neutral[300];

  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.container, { borderColor }]}>
        {leftIcon && <View style={styles.icon}>{leftIcon}</View>}
        <RNTextInput
          style={styles.input}
          placeholderTextColor={colors.neutral[400]}
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
          {...rest}
        />
        {rightIcon && <View style={styles.icon}>{rightIcon}</View>}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
      {hint && !error && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 16 },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.neutral[700],
    marginBottom: 6,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    height: 50,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.neutral[900],
    paddingVertical: 0,
  },
  icon: { marginRight: 10 },
  error: { fontSize: 12, color: colors.danger[500], marginTop: 4 },
  hint: { fontSize: 12, color: colors.neutral[500], marginTop: 4 },
});

export default TextInput;
