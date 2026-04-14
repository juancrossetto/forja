import React from 'react';
import { StyleSheet, View, Text, ViewStyle } from 'react-native';
import { radius } from '../../theme/radius';

interface TagProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'tertiary' | 'muted';
  style?: ViewStyle;
}

const colors = {
  primary: '#D1FF26',
  secondary: '#00e3fd',
  tertiary: '#ff734a',
  background: '#0e0e0e',
  text: '#ffffff',
  muted: 'rgba(255, 255, 255, 0.2)',
};

const typography = {
  label: 'Lexend_500Medium',
};

const tagVariants = {
  primary: {
    backgroundColor: colors.primary,
    textColor: colors.background,
  },
  secondary: {
    backgroundColor: colors.secondary,
    textColor: colors.background,
  },
  tertiary: {
    backgroundColor: colors.tertiary,
    textColor: colors.text,
  },
  muted: {
    backgroundColor: colors.muted,
    textColor: colors.text,
  },
};

const Tag = React.forwardRef<View, TagProps>(
  ({ label, variant = 'primary', style }, ref) => {
    const variantStyle = tagVariants[variant];

    return (
      <View
        ref={ref}
        style={[
          styles.tag,
          {
            backgroundColor: variantStyle.backgroundColor,
          },
          style,
        ]}
      >
        <Text
          style={[
            styles.tagText,
            {
              color: variantStyle.textColor,
            },
          ]}
        >
          {label}
        </Text>
      </View>
    );
  }
);

Tag.displayName = 'Tag';

const styles = StyleSheet.create({
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  tagText: {
    fontSize: 12,
    fontFamily: typography.label,
    fontWeight: '600',
  },
});

export default Tag;
