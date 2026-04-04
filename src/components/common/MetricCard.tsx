import React from 'react';
import { StyleSheet, View, Text, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: {
    direction: 'up' | 'down';
    percentage: number;
  };
  icon?: string;
  style?: ViewStyle;
}

const colors = {
  surface: '#1a1a1a',
  surfaceElevated: '#242424',
  text: '#ffffff',
  textSecondary: '#a0a0a0',
  primary: '#D1FF26',
  positive: '#4ade80',
  negative: '#ff6b6b',
};

const typography = {
  display: 'SpaceGrotesk_700Bold',
  body: 'Manrope_400Regular',
  label: 'Lexend_500Medium',
};

const MetricCard = React.forwardRef<View, MetricCardProps>(
  ({ label, value, unit, trend, icon, style }, ref) => {
    const trendColor = trend?.direction === 'up' ? colors.positive : colors.negative;

    return (
      <View ref={ref} style={[styles.card, style]}>
        <View style={styles.header}>
          <Text style={styles.label}>{label.toUpperCase()}</Text>
          {icon && (
            <Ionicons name={icon as any} size={20} color={colors.primary} />
          )}
        </View>

        <View style={styles.valueContainer}>
          <Text style={styles.value}>{value}</Text>
          {unit && <Text style={styles.unit}>{unit}</Text>}
        </View>

        {trend && (
          <View style={styles.trendContainer}>
            <Ionicons
              name={trend.direction === 'up' ? 'arrow-up' : 'arrow-down'}
              size={16}
              color={trendColor}
            />
            <Text style={[styles.trendText, { color: trendColor }]}>
              {trend.percentage}%
            </Text>
          </View>
        )}
      </View>
    );
  }
);

MetricCard.displayName = 'MetricCard';

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 16,
    padding: 16,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 11,
    fontFamily: typography.label,
    color: colors.textSecondary,
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  value: {
    fontSize: 32,
    fontFamily: typography.display,
    color: colors.text,
    fontWeight: '700',
  },
  unit: {
    fontSize: 14,
    fontFamily: typography.body,
    color: colors.textSecondary,
    marginLeft: 6,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendText: {
    fontSize: 12,
    fontFamily: typography.label,
    fontWeight: '600',
  },
});

export default MetricCard;
