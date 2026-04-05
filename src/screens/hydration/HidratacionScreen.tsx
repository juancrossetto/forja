import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const COLORS = {
  bg: '#0e0e0e',
  surface: '#1a1a1a',
  surfaceHigh: '#20201f',
  surfaceHighest: '#262626',
  primary: '#D1FF26',
  primaryDim: '#c1ed00',
  secondary: '#00e3fd',
  tertiary: '#ff734a',
  water: '#4dd0e1',
  waterDim: '#26bcd4',
  text: '#ffffff',
  textVariant: '#adaaaa',
  borderLight: 'rgba(255,255,255,0.05)',
};

const GOAL_ML = 3000;

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

// Mock weekly data
const WEEKLY_DATA = [
  { day: 'Lun', ml: 2800 },
  { day: 'Mar', ml: 3200 },
  { day: 'Mié', ml: 2100 },
  { day: 'Jue', ml: 3000 },
  { day: 'Vie', ml: 2500 },
  { day: 'Sáb', ml: 1800 },
  { day: 'Dom', ml: 0 },
];

const HidratacionScreen: React.FC = () => {
  const [currentMl, setCurrentMl] = useState(1500);

  const addWater = useCallback((amount: number) => {
    setCurrentMl((prev) => {
      const next = prev + amount;
      if (next >= GOAL_ML && prev < GOAL_ML) {
        Alert.alert('Meta alcanzada!', 'Completaste tu objetivo de hidratación del día.');
      }
      return next;
    });
  }, []);

  const progress = Math.min(currentMl / GOAL_ML, 1);
  const liters = (currentMl / 1000).toFixed(1);
  const goalLiters = (GOAL_ML / 1000).toFixed(1);
  const avgMl = Math.round(WEEKLY_DATA.filter((d) => d.ml > 0).reduce((a, b) => a + b.ml, 0) / WEEKLY_DATA.filter((d) => d.ml > 0).length);
  const maxBar = Math.max(...WEEKLY_DATA.map((d) => d.ml), GOAL_ML);

  const handleSave = () => {
    Alert.alert('Guardado', 'Tu registro de hidratación fue guardado.');
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>Hidratación</Text>
          <Text style={styles.subtitle}>Control diario de agua</Text>
        </View>

        {/* Main Display */}
        <View style={styles.mainDisplay}>
          <View style={styles.circleContainer}>
            {/* Progress Ring (simplified) */}
            <View style={styles.progressRing}>
              <View style={[styles.progressFill, { height: `${progress * 100}%` }]} />
              <View style={styles.progressContent}>
                <MaterialCommunityIcons name="water" size={28} color={COLORS.water} />
                <Text style={styles.currentValue}>{liters}</Text>
                <View style={styles.goalRow}>
                  <View style={styles.goalDivider} />
                  <Text style={styles.goalValue}>{goalLiters}</Text>
                </View>
                <Text style={styles.unitLabel}>LITROS</Text>
              </View>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
            </View>
            <Text style={styles.progressPercent}>{Math.round(progress * 100)}%</Text>
          </View>
        </View>

        {/* Quick Add Buttons */}
        <View style={styles.quickAddSection}>
          <Text style={styles.sectionLabel}>AÑADIR</Text>
          <View style={styles.quickAddRow}>
            <TouchableOpacity style={styles.quickAddBtn} onPress={() => addWater(250)} activeOpacity={0.7}>
              <MaterialCommunityIcons name="cup-water" size={20} color={COLORS.water} />
              <Text style={styles.quickAddText}>+250</Text>
              <Text style={styles.quickAddUnit}>ML</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.quickAddBtn, styles.quickAddBtnMedium]} onPress={() => addWater(500)} activeOpacity={0.7}>
              <MaterialCommunityIcons name="bottle-soda-classic" size={20} color={COLORS.secondary} />
              <Text style={styles.quickAddText}>+500</Text>
              <Text style={styles.quickAddUnit}>ML</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.quickAddBtn, styles.quickAddBtnLarge]} onPress={() => addWater(1000)} activeOpacity={0.7}>
              <MaterialCommunityIcons name="water" size={20} color={COLORS.primary} />
              <Text style={styles.quickAddText}>+1</Text>
              <Text style={styles.quickAddUnit}>L</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Weekly Chart */}
        <View style={styles.weeklySection}>
          <View style={styles.weeklySectionHeader}>
            <Text style={styles.sectionTitle}>Esta semana</Text>
            <Text style={styles.weeklyAvg}>Prom: {(avgMl / 1000).toFixed(1)}L</Text>
          </View>
          <View style={styles.chartContainer}>
            {WEEKLY_DATA.map((item, index) => {
              const barHeight = item.ml > 0 ? (item.ml / maxBar) * 140 : 4;
              const isGoalMet = item.ml >= GOAL_ML;
              const isToday = index === WEEKLY_DATA.length - 1;
              return (
                <View key={item.day} style={styles.chartBar}>
                  <Text style={styles.chartBarValue}>
                    {item.ml > 0 ? `${(item.ml / 1000).toFixed(1)}` : '-'}
                  </Text>
                  <View style={styles.chartBarTrack}>
                    <View
                      style={[
                        styles.chartBarFill,
                        {
                          height: barHeight,
                          backgroundColor: isGoalMet ? COLORS.primary : COLORS.water,
                        },
                        isToday && { backgroundColor: COLORS.secondary },
                      ]}
                    />
                  </View>
                  <Text style={[styles.chartBarLabel, isToday && { color: COLORS.secondary }]}>
                    {item.day}
                  </Text>
                </View>
              );
            })}
          </View>
          {/* Goal line label */}
          <View style={styles.goalLine}>
            <View style={styles.goalLineDash} />
            <Text style={styles.goalLineText}>Meta: {goalLiters}L</Text>
          </View>
        </View>

        {/* Save */}
        <View style={styles.actionSection}>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>GUARDAR REGISTRO</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  titleSection: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textVariant,
    letterSpacing: 0.5,
    marginTop: 6,
  },
  mainDisplay: {
    paddingHorizontal: 24,
    marginBottom: 32,
    alignItems: 'center',
  },
  circleContainer: {
    marginBottom: 20,
  },
  progressRing: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: COLORS.surface,
    borderWidth: 3,
    borderColor: COLORS.borderLight,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  progressFill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: `${COLORS.water}20`,
    borderTopLeftRadius: 100,
    borderTopRightRadius: 100,
  },
  progressContent: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentValue: {
    fontSize: 48,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 4,
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: -4,
  },
  goalDivider: {
    width: 16,
    height: 2,
    backgroundColor: COLORS.textVariant,
  },
  goalValue: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textVariant,
  },
  unitLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textVariant,
    letterSpacing: 2,
    marginTop: 4,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  progressBarBg: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.surface,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: COLORS.water,
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.water,
    width: 40,
  },
  quickAddSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textVariant,
    letterSpacing: 2,
    marginBottom: 14,
  },
  quickAddRow: {
    flexDirection: 'row',
    gap: 12,
  },
  quickAddBtn: {
    flex: 1,
    paddingVertical: 20,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    alignItems: 'center',
    gap: 8,
  },
  quickAddBtnMedium: {},
  quickAddBtnLarge: {},
  quickAddText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  quickAddUnit: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textVariant,
    letterSpacing: 1,
  },
  weeklySection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  weeklySectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  weeklyAvg: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.water,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 180,
    paddingTop: 20,
  },
  chartBar: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  chartBarValue: {
    fontSize: 9,
    fontWeight: '600',
    color: COLORS.textVariant,
  },
  chartBarTrack: {
    width: 24,
    height: 140,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  chartBarFill: {
    width: '100%',
    borderRadius: 12,
  },
  chartBarLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textVariant,
    letterSpacing: 0.5,
  },
  goalLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  goalLineDash: {
    flex: 1,
    height: 1,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: 'rgba(209,255,38,0.3)',
  },
  goalLineText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.primaryDim,
    letterSpacing: 0.5,
  },
  actionSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 18,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
    letterSpacing: 1.5,
  },
});

export default HidratacionScreen;
