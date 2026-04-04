import React, { useState } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

interface IconButtonProps {
  icon: string;
  onPress: () => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'ghost' | 'glass';
  disabled?: boolean;
  style?: ViewStyle;
  iconLibrary?: 'ionicons' | 'materialicons';
}

const colors = {
  primary: '#D1FF26',
  secondary: '#00e3fd',
  text: '#ffffff',
  textSecondary: '#a0a0a0',
  background: '#0e0e0e',
  surface: '#1a1a1a',
};

const sizeMap = {
  sm: { size: 36, iconSize: 18 },
  md: { size: 44, iconSize: 22 },
  lg: { size: 56, iconSize: 24 },
};

const IconButton = React.forwardRef<View, IconButtonProps>(
  (
    {
      icon,
      onPress,
      size = 'md',
      variant = 'primary',
      disabled = false,
      style,
      iconLibrary = 'ionicons',
    },
    ref
  ) => {
    const [isPressed, setIsPressed] = useState(false);
    const sizeConfig = sizeMap[size];

    const IconComponent = iconLibrary === 'materialicons' ? MaterialIcons : Ionicons;

    const handlePressIn = () => {
      setIsPressed(true);
    };

    const handlePressOut = () => {
      setIsPressed(false);
    };

    const renderButton = () => (
      <TouchableOpacity
        ref={ref}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        activeOpacity={1}
        style={[
          styles.button,
          {
            width: sizeConfig.size,
            height: sizeConfig.size,
            borderRadius: sizeConfig.size / 2,
          },
          variant === 'primary' && [
            styles.primaryButton,
            isPressed && styles.primaryButtonPressed,
          ],
          variant === 'ghost' && [
            styles.ghostButton,
            isPressed && styles.ghostButtonPressed,
          ],
          disabled && styles.disabledButton,
          style,
        ]}
      >
        <IconComponent
          name={icon as any}
          size={sizeConfig.iconSize}
          color={
            variant === 'primary'
              ? colors.background
              : variant === 'ghost'
              ? colors.text
              : colors.text
          }
        />
      </TouchableOpacity>
    );

    if (variant === 'glass') {
      return (
        <BlurView intensity={40} tint="dark" style={[
          {
            width: sizeConfig.size,
            height: sizeConfig.size,
            borderRadius: sizeConfig.size / 2,
          },
          style,
        ]}>
          {renderButton()}
        </BlurView>
      );
    }

    return renderButton();
  }
);

IconButton.displayName = 'IconButton';

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  primaryButtonPressed: {
    backgroundColor: '#b8d914',
  },
  ghostButton: {
    backgroundColor: 'transparent',
  },
  ghostButtonPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  disabledButton: {
    opacity: 0.5,
  },
});

export default IconButton;
