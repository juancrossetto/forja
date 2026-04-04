import React, { useEffect } from 'react';
import { StyleSheet, View, ViewStyle, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface ProgressBarProps {
  progress: number;
  height?: number;
  variant?: 'primary' | 'secondary' | 'tertiary' | 'gradient';
  animated?: boolean;
  style?: ViewStyle;
}

const colors = {
  primary: '#D1FF26',
  secondary: '#00e3fd',
  tertiary: '#ff734a',
  background: 'rgba(255, 255, 255, 0.06)',
};

const ProgressBar = React.forwardRef<View, ProgressBarProps>(
  (
    {
      progress,
      height = 6,
      variant = 'primary',
      animated = true,
      style,
    },
    ref
  ) => {
    const animatedWidth = React.useRef(new Animated.Value(0)).current;
    const clampedProgress = Math.min(Math.max(progress, 0), 100);

    useEffect(() => {
      if (animated) {
        Animated.timing(animatedWidth, {
          toValue: clampedProgress,
          duration: 500,
          useNativeDriver: false,
        }).start();
      } else {
        animatedWidth.setValue(clampedProgress);
      }
    }, [clampedProgress, animatedWidth, animated]);

    const variantColor = {
      primary: colors.primary,
      secondary: colors.secondary,
      tertiary: colors.tertiary,
      gradient: colors.primary,
    }[variant];

    const progressWidth = animatedWidth.interpolate({
      inputRange: [0, 100],
      outputRange: ['0%', '100%'],
    });

    const renderProgressFill = () => {
      if (variant === 'gradient') {
        return (
          <Animated.View
            style={[
              {
                width: progressWidth,
                height: height,
                borderRadius: height / 2,
                overflow: 'hidden',
              },
            ]}
          >
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ width: '100%', height: '100%' }}
            />
          </Animated.View>
        );
      }

      return (
        <Animated.View
          style={[
            {
              width: progressWidth,
              height: height,
              backgroundColor: variantColor,
              borderRadius: height / 2,
            },
          ]}
        />
      );
    };

    return (
      <View
        ref={ref}
        style={[
          styles.container,
          {
            height: height,
          },
          style,
        ]}
      >
        <View
          style={[
            styles.background,
            {
              height: height,
              borderRadius: height / 2,
            },
          ]}
        >
          {renderProgressFill()}
        </View>
      </View>
    );
  }
);

ProgressBar.displayName = 'ProgressBar';

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  background: {
    width: '100%',
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
});

export default ProgressBar;
