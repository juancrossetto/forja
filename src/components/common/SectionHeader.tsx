import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  showViewAll?: boolean;
  onViewAllPress?: () => void;
  style?: ViewStyle;
}

const colors = {
  text: '#ffffff',
  textSecondary: '#a0a0a0',
  primary: '#D1FF26',
};

const typography = {
  body: 'Manrope_600SemiBold',
  subtitle: 'Manrope_400Regular',
};

const SectionHeader = React.forwardRef<View, SectionHeaderProps>(
  (
    {
      title,
      subtitle,
      showViewAll = false,
      onViewAllPress,
      style,
    },
    ref
  ) => {
    return (
      <View ref={ref} style={[styles.container, style]}>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
        {showViewAll && (
          <TouchableOpacity
            onPress={onViewAllPress}
            style={styles.viewAllButton}
            activeOpacity={0.7}
          >
            <Text style={styles.viewAllText}>Ver todo</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>
    );
  }
);

SectionHeader.displayName = 'SectionHeader';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontFamily: typography.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: typography.subtitle,
    color: colors.textSecondary,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingLeft: 12,
  },
  viewAllText: {
    fontSize: 14,
    fontFamily: typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
});

export default SectionHeader;
