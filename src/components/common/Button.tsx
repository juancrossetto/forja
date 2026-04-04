import React, { useState } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  Text,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'text';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

const colors = {
  background: '#0e0e0e',
  primary: '#D1FF26',
  secondary: '#00e3fd',
  tertiary: '#ff734a',
  surface: '#1a1a1a',
  text: '#ffffff',
  textSecondary: '#a0a0a0',
};

const typography = {
  display: 'SpaceGrotesk_700Bold',
  body: 'Manrope_400Regular',
  label: 'Lexend_500Medium',
};

const Button = React.forwardRef<View, ButtonProps>(
  (
    {
      title,
      onPress,
      variant = 'primary',
      size = 'medium',
      fullWidth = true,
      loading = false,
      disabled = false,
      style,
    },
    ref
  ) => {
    const [isPressed, setIsPressed] = useState(false);

    const sizeStyles = {
      small: { height: 40, paddingHorizontal: 16 },
      medium: { height: 52, paddingHorizontal: 24 },
      large: { height: 60, paddingHorizontal: 32 },
    };

    const renderContent = () => {
      if (loading) {
        return <ActivityIndicator color={variant === 'secondary' ? colors.secondary : colors.background} />;
      }
      return (
        <Text
          style={[
            styles.buttonText,
            variant === 'secondary' && styles.secondaryText,
            variant === 'text' && styles.textButtonText,
            size === 'small' && styles.smallText,
            size === 'large' && styles.largeText,
          ]}
        >
          {title}
        </Text>
      );
    };

    if (variant === 'secondary') {
      return (
        <TouchableOpacity
          ref={ref}
          onPress={onPress}
          disabled={disabled || loading}
          activeOpacity={0.7}
          onPressIn={() => setIsPressed(true)}
          onPressOut={() => setIsPressed(false)}
          style={[
            styles.button,
            sizeStyles[size],
            fullWidth && styles.fullWidth,
            styles.secondaryButton,
            (disabled || loading) && styles.disabledButton,
            isPressed && styles.secondaryButtonPressed,
            style,
          ]}
        >
          {renderContent()}
        </TouchableOpacity>
      );
    }

    if (variant === 'text') {
      return (
        <TouchableOpacity
          ref={ref}
          onPress={onPress}
          disabled={disabled || loading}
          activeOpacity={0.7}
          style={[
            styles.button,
            sizeStyles[size],
            fullWidth && styles.fullWidth,
            styles.textButton,
            style,
          ]}
        >
          {renderContent()}
        </TouchableOpacity>
      );
    }

    // Primary variant with kinetic gradient
    return (
      <TouchableOpacity
        ref={ref}
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={1}
        onPressIn={() => setIsPressed(true)}
        onPressOut={() => setIsPressed(false)}
        style={[
          styles.button,
          sizeStyles[size],
          fullWidth && styles.fullWidth,
          (disabled || loading) && styles.disabledButton,
          style,
        ]}
      >
        <LinearGradient
          colors={isPressed ? ['#b8d914', '#a8c904'] : ['#D1FF26', '#b8d914']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientButton}
        >
          {renderContent()}
        </LinearGradient>
      </TouchableOpacity>
    );
  }
);

Button.displayName = 'Button';

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  gradientButton: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontFamily: typography.label,
    fontWeight: '600',
    color: colors.background,
  },
  smallText: {
    fontSize: 14,
  },
  largeText: {
    fontSize: 18,
  },
  secondaryButton: {
    borderWidth: 2,
    borderColor: colors.secondary,
    backgroundColor: 'transparent',
  },
  secondaryButtonPressed: {
    backgroundColor: 'rgba(0, 227, 253, 0.1)',
  },
  secondaryText: {
    color: colors.secondary,
  },
  textButton: {
    backgroundColor: 'transparent',
  },
  textButtonText: {
    color: colors.primary,
  },
  disabledButton: {
    opacity: 0.5,
  },
});

export default Button;
