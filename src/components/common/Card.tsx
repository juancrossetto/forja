import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'glass';
  style?: ViewStyle;
}

const colors = {
  surface: '#1a1a1a',
  surfaceElevated: '#242424',
  background: '#0e0e0e',
};

const Card = React.forwardRef<View, CardProps>(
  ({ children, variant = 'default', style }, ref) => {
    const cardStyle = {
      default: styles.cardDefault,
      elevated: styles.cardElevated,
      glass: styles.cardGlass,
    }[variant];

    if (variant === 'glass') {
      return (
        <BlurView intensity={40} tint="dark" style={[styles.card, cardStyle, style]}>
          {children}
        </BlurView>
      );
    }

    return (
      <View ref={ref} style={[styles.card, cardStyle, style]}>
        {children}
      </View>
    );
  }
);

Card.displayName = 'Card';

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 16,
  },
  cardDefault: {
    backgroundColor: colors.surface,
  },
  cardElevated: {
    backgroundColor: colors.surfaceElevated,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  cardGlass: {
    backgroundColor: 'rgba(26, 26, 26, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
});

export default Card;
