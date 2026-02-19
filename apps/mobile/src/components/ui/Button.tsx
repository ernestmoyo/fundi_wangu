import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { colors } from '@fundi-wangu/ui-components';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

const VARIANT_STYLES: Record<Variant, { bg: string; text: string; border?: string }> = {
  primary: { bg: colors.primary[500], text: '#FFFFFF' },
  secondary: { bg: colors.accent[500], text: '#FFFFFF' },
  outline: { bg: 'transparent', text: colors.primary[500], border: colors.primary[500] },
  ghost: { bg: 'transparent', text: colors.primary[500] },
  danger: { bg: colors.danger[500], text: '#FFFFFF' },
};

const SIZE_STYLES: Record<Size, { height: number; paddingH: number; fontSize: number }> = {
  sm: { height: 36, paddingH: 12, fontSize: 13 },
  md: { height: 48, paddingH: 20, fontSize: 15 },
  lg: { height: 56, paddingH: 24, fontSize: 17 },
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon,
  style,
}: ButtonProps) {
  const v = VARIANT_STYLES[variant];
  const s = SIZE_STYLES[size];
  const isDisabled = disabled || loading;

  const containerStyle: ViewStyle = {
    backgroundColor: v.bg,
    height: s.height,
    paddingHorizontal: s.paddingH,
    borderRadius: 12,
    borderWidth: v.border ? 1.5 : 0,
    borderColor: v.border,
    opacity: isDisabled ? 0.5 : 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: fullWidth ? 'stretch' : 'auto',
  };

  const textStyle: TextStyle = {
    color: v.text,
    fontSize: s.fontSize,
    fontWeight: '600',
    marginLeft: icon ? 8 : 0,
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      style={[containerStyle, style]}
    >
      {loading ? (
        <ActivityIndicator color={v.text} size="small" />
      ) : (
        <>
          {icon}
          <Text style={textStyle}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

export default Button;
