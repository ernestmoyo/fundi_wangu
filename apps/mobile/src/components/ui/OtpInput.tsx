import React, { useRef, useState } from 'react';
import { View, TextInput, StyleSheet, Keyboard } from 'react-native';
import { colors } from '@fundi-wangu/ui-components';
import ENV from '@/config/env';

interface OtpInputProps {
  length?: number;
  onComplete: (code: string) => void;
}

export function OtpInput({ length = ENV.OTP_LENGTH, onComplete }: OtpInputProps) {
  const [values, setValues] = useState<string[]>(Array(length).fill(''));
  const inputs = useRef<(TextInput | null)[]>([]);

  const handleChange = (text: string, index: number) => {
    const newValues = [...values];

    if (text.length > 1) {
      // Handle paste
      const chars = text.slice(0, length).split('');
      chars.forEach((c, i) => {
        if (index + i < length) newValues[index + i] = c;
      });
      setValues(newValues);
      const nextIdx = Math.min(index + chars.length, length - 1);
      inputs.current[nextIdx]?.focus();
      if (newValues.every((v) => v !== '')) {
        Keyboard.dismiss();
        onComplete(newValues.join(''));
      }
      return;
    }

    newValues[index] = text;
    setValues(newValues);

    if (text && index < length - 1) {
      inputs.current[index + 1]?.focus();
    }

    if (newValues.every((v) => v !== '')) {
      Keyboard.dismiss();
      onComplete(newValues.join(''));
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !values[index] && index > 0) {
      const newValues = [...values];
      newValues[index - 1] = '';
      setValues(newValues);
      inputs.current[index - 1]?.focus();
    }
  };

  return (
    <View style={styles.container}>
      {values.map((value, i) => (
        <TextInput
          key={i}
          ref={(ref) => {
            inputs.current[i] = ref;
          }}
          style={[styles.cell, value ? styles.cellFilled : null]}
          value={value}
          onChangeText={(text) => handleChange(text, i)}
          onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
          keyboardType="number-pad"
          maxLength={i === 0 ? length : 1}
          textContentType="oneTimeCode"
          autoComplete={i === 0 ? 'sms-otp' : 'off'}
          selectTextOnFocus
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  cell: {
    width: 48,
    height: 56,
    borderWidth: 1.5,
    borderColor: colors.neutral[300],
    borderRadius: 12,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    color: colors.neutral[900],
    backgroundColor: '#FFFFFF',
  },
  cellFilled: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[50],
  },
});

export default OtpInput;
