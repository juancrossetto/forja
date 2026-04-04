import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const COLORS = {
  bg: '#0e0e0e',
  surface: '#1a1a1a',
  surfaceHigh: '#20201f',
  surfaceHighest: '#262626',
  surfaceLow: '#131313',
  primary: '#D1FF26',
  primaryDim: '#c1ed00',
  secondary: '#00e3fd',
  tertiary: '#ff734a',
  textPrimary: '#FFF',
  textSecondary: 'rgba(255,255,255,0.70)',
  textTertiary: 'rgba(255,255,255,0.45)',
  borderLight: 'rgba(255,255,255,0.05)',
};

const MetasScreen: React.FC = () => {
  const [waterLitres, setWaterLitres] = useState(2.4);
  const maxWater = 3.5;
  const waterPercentage = (waterLitres / maxWater) * 100;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity>
            <MaterialCommunityIcons name="menu" size={24} color={COLORS.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>MÉTODO R3SET</Text>
        </View>
        <TouchableOpacity>
          <Image
            source={{
              uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDiMuoA4JHpZni3edTAqrrT3psr6jWcCtFB4nnxVa199BoIs5Jl_qqpXp1uK7GoslLyz3yZegO4dK_2wmmtHN2CfE7kSll2u-LGkvbMkG91WDYfnqMg_nkTv-Vsu4OhCtpgoe2_fgF4kSMGQXJvT7dH-V-eRqoJ0GRufQMiBWZiKA4D7fnW3IfDW8TsxwOavFq2q682trzZx1H2N2KsJ3bO4sJl9xWfFQh2JsJjNhgiN9skNJe8vDGW4Alm9hSaWGtVNA6qeCVNRZvF',
            }}
            style={styles.avatar}
          />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} scrollIndicatorInsets={{ bottom: 80 }}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>
            TUS{'\n'}
            <Text style={styles.heroMetas}>METAS</Text>
          </Text>
          <Text style={styles.heroSubtitle}>
            Ajusta el motor. Visualiza el cambio. Ejecuta con precisión.
          </Text>
        </View>

        {/* Nutrition Card - Large */}
        <View style={styles.nutritionCard}>
          <View style={styles.nutritionHeader}>
            <View>
              <Text style={styles.nutritionLabel}>NUTRICIÓN DIARIO</Text>
              <Text style={styles.nutritionTitle}>Consumo de Calorías</Text>
            </View>
            <View style={styles.nutritionValue}>
              <Text style={styles.nutritionValueMain}>1,840</Text>
              <Text style={styles.nutritionValueSub}>/ 2,400 kcal</Text>
            </View>
          </View>

          {/* Progress Bar with Gradient */}
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBar,
                {
                  width: '76%',
                  backgroundColor: COLORS.primary,
                },
              ]}
            />
          </View>

          {/* Macros Grid */}
          <View style={styles.macrosGrid}>
            <View style={styles.macroCard}>
              <Text style={styles.macroLabel}>PROTEÍNA</Text>
              <View style={styles.macroValue}>
                <Text style={styles.macroMainValue}>142g</Text>
                <Text style={styles.macroSubValue}>/ 180g</Text>
              </View>
            </View>
            <View style={styles.macroCard}>
              <Text style={styles.macroLabel}>CARBOS</Text>
              <View style={styles.macroValue}>
                <Text style={styles.macroMainValue}>210g</Text>
                <Text style={styles.macroSubValue}>/ 250g</Text>
              </View>
            </View>
            <View style={styles.macroCard}>
              <Text style={styles.macroLabel}>GRASAS</Text>
              <View style={styles.macroValue}>
                <Text style={styles.macroMainValue}>58g</Text>
                <Text style={styles.macroSubValue}>/ 70g</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Training Sessions Card */}
        <View style={styles.trainingCard}>
          <Text style={styles.trainingLabel}>ENTRENAMIENTO</Text>
          <Text style={styles.trainingTitle}>Sesiones Semanales</Text>

          <View style={styles.trainingProgress}>
            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>COMPLETADO</Text>
              <Text style={styles.progressCount}>4 / 5</Text>
            </View>
            <View style={styles.progressBars}>
              <View style={[styles.sessionBar, { backgroundColor: COLORS.primary }]} />
              <View style={[styles.sessionBar, { backgroundColor: COLORS.primary }]} />
              <View style={[styles.sessionBar, { backgroundColor: COLORS.primary }]} />
              <View style={[styles.sessionBar, { backgroundColor: COLORS.primary }]} />
              <View style={[styles.sessionBar, { backgroundColor: COLORS.surfaceHighest }]} />
            </View>
          </View>

          <View style={styles.milestoneSeparator} />

          <View style={styles.milestoneSection}>
            <Text style={styles.milestoneLabel}>PRÓXIMO HITO</Text>
            <Text style={styles.milestoneMilestone}>Superávit progresivo: +2.5kg en Sentadilla</Text>
          </View>
        </View>

        {/* Water Intake Card */}
        <View style={styles.waterCard}>
          <Text style={styles.waterLabel}>HIDRATACIÓN</Text>
          <Text style={styles.waterTitle}>Agua Diario</Text>

          <View style={styles.waterValue}>
            <Text style={styles.waterMainValue}>2.4</Text>
            <Text style={styles.waterSubValue}>/ 3.5 Litros</Text>
          </View>

          <View style={styles.waterGlasses}>
            <View style={[styles.waterGlass, { backgroundColor: COLORS.secondary }]} />
            <View style={[styles.waterGlass, { backgroundColor: COLORS.secondary }]} />
            <View style={[styles.waterGlass, { backgroundColor: COLORS.secondary }]} />
            <View style={[styles.waterGlass, { opacity: 0.4 }]} />
            <View style={[styles.waterGlass, { opacity: 0.2 }]} />
          </View>

          <TouchableOpacity style={styles.waterButton}>
            <Text style={styles.waterButtonText}>+ Añadir 250ml</Text>
          </TouchableOpacity>
        </View>

        {/* Weight Progress Card */}
        <View style={styles.weightCard}>
          <View style={styles.weightHeader}>
            <View>
              <Text style={styles.weightLabel}>COMPOSICIÓN CORPORAL</Text>
              <Text style={styles.weightTitle}>Peso Objetivo</Text>
            </View>
            <View style={styles.weightActual}>
              <Text style={styles.weightActualLabel}>ACTUAL</Text>
              <Text style={styles.weightActualValue}>78.4 kg</Text>
            </View>
          </View>

          {/* Bar Chart Visualization */}
          <View style={styles.chartContainer}>
            <View style={styles.chartBars}>
              <View style={[styles.chartBar, { height: '85%', backgroundColor: COLORS.surfaceHighest }]} />
              <View style={[styles.chartBar, { height: '82%', backgroundColor: COLORS.surfaceHighest }]} />
              <View style={[styles.chartBar, { height: '78%', backgroundColor: COLORS.surfaceHighest }]} />
              <View style={[styles.chartBar, { height: '75%', backgroundColor: COLORS.surfaceHighest }]} />
              <View style={[styles.chartBar, { height: '76%', backgroundColor: COLORS.surfaceHighest }]} />
              <View style={[styles.chartBar, { height: '72%', backgroundColor: COLORS.surfaceHighest }]} />
              <View style={[styles.chartBar, { height: '70%', backgroundColor: COLORS.tertiary }]} />
            </View>
          </View>

          <View style={styles.chartLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: COLORS.tertiary }]} />
              <Text style={styles.legendText}>Meta: 75.0 kg</Text>
            </View>
            <TouchableOpacity style={styles.detailsButton}>
              <Text style={styles.detailsButtonText}>DETALLES COMPLETOS</Text>
              <MaterialCommunityIcons name="arrow-right" size={12} color={COLORS.tertiary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Psychology Section */}
        <View style={styles.psychologySection}>
          <View style={styles.psychologyImage}>
            <Image
              source={{
                uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDcyzz7_lqljxEPa5ODCRqElrNny0PBM6Ps5jm1RilrOyQWZ-6yxtItT4QlPY30uvq0qPvAFrw-_KYdLuHR1rPIkC-nxiq5el0sd8TLveJi0UTzQ2XX1gYPv7mEb36wQ1RfxHBvUsKrXVyYZwa3uZySpjtp_VxROPccGyRmyNzCGqhJWZ3EEEYaviIV9zuSaBHz25e990Hg8NWbQ7QTdaO5hNwzbAqXrL3xIyJ4asl6fjJtM9uuX8ncCtAjbkAahd1JWsAyyu1__Q3N',
              }}
              style={styles.mindsetImage}
            />
          </View>
          <View style={styles.psychologyContent}>
            <Text style={styles.psychologyLabel}>MINDSET PILLAR</Text>
            <Text style={styles.psychologyTitle}>
              La meta no es el fin,{' '}
              <Text style={{ color: COLORS.tertiary }}>es el proceso.</Text>
            </Text>
            <Text style={styles.psychologyText}>
              En el Método R3SET, hackeamos tu psicología para que los objetivos físicos sean una
              consecuencia natural de tus nuevos hábitos. Ajusta tus disparadores mentales hoy.
            </Text>
            <TouchableOpacity style={styles.habitsButton}>
              <Text style={styles.habitsButtonText}>Configurar Hábitos</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Action Button */}
      <View style={styles.fabContainer}>
        <TouchableOpacity style={styles.fab}>
          <MaterialCommunityIcons name="plus" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 1.5,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  heroSection: {
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  heroTitle: {
    fontSize: 44,
    fontWeight: '700',
    color: COLORS.textPrimary,
    lineHeight: 50,
    marginBottom: 16,
  },
  heroMetas: {
    color: COLORS.primaryDim,
  },
  heroSubtitle: {
    fontSize: 11,
    color: COLORS.textTertiary,
    letterSpacing: 2,
    fontWeight: '600',
  },
  nutritionCard: {
    marginHorizontal: 24,
    marginBottom: 24,
    paddingVertical: 32,
    paddingHorizontal: 32,
    backgroundColor: COLORS.surfaceLow,
    borderRadius: 12,
  },
  nutritionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 32,
  },
  nutritionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.secondary,
    letterSpacing: 2,
    marginBottom: 8,
  },
  nutritionTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  nutritionValue: {
    alignItems: 'flex-end',
  },
  nutritionValueMain: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  nutritionValueSub: {
    fontSize: 12,
    color: COLORS.textTertiary,
    marginTop: 4,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: COLORS.surfaceHighest,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 24,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  macrosGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  macroCard: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
  },
  macroLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textTertiary,
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  macroValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  macroMainValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  macroSubValue: {
    fontSize: 10,
    color: COLORS.textTertiary,
    fontWeight: '600',
  },
  trainingCard: {
    marginHorizontal: 24,
    marginBottom: 24,
    paddingVertical: 32,
    paddingHorizontal: 32,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primaryDim,
  },
  trainingLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primaryDim,
    letterSpacing: 2,
    marginBottom: 8,
  },
  trainingTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 24,
  },
  trainingProgress: {
    marginBottom: 24,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: 1,
  },
  progressCount: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  progressBars: {
    flexDirection: 'row',
    gap: 8,
  },
  sessionBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  milestoneSeparator: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: 24,
  },
  milestoneSection: {
    paddingTop: 8,
  },
  milestoneLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textTertiary,
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  milestoneMilestone: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  waterCard: {
    marginHorizontal: 24,
    marginBottom: 24,
    paddingVertical: 32,
    paddingHorizontal: 32,
    backgroundColor: 'rgba(0, 227, 253, 0.1)',
    borderRadius: 12,
  },
  waterLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.secondary,
    letterSpacing: 2,
    marginBottom: 8,
  },
  waterTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  waterValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 24,
  },
  waterMainValue: {
    fontSize: 40,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  waterSubValue: {
    fontSize: 12,
    color: COLORS.textTertiary,
    fontWeight: '600',
  },
  waterGlasses: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 24,
  },
  waterGlass: {
    flex: 1,
    height: 32,
    borderRadius: 4,
    backgroundColor: COLORS.secondary,
  },
  waterButton: {
    width: '100%',
    paddingVertical: 12,
    backgroundColor: COLORS.secondary,
    borderRadius: 6,
    alignItems: 'center',
  },
  waterButtonText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#000',
    letterSpacing: 1,
  },
  weightCard: {
    marginHorizontal: 24,
    marginBottom: 24,
    paddingVertical: 32,
    paddingHorizontal: 32,
    backgroundColor: COLORS.surfaceHigh,
    borderRadius: 12,
  },
  weightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 32,
  },
  weightLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.tertiary,
    letterSpacing: 2,
    marginBottom: 8,
  },
  weightTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  weightActual: {
    alignItems: 'flex-end',
  },
  weightActualLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textTertiary,
    letterSpacing: 1,
    marginBottom: 4,
  },
  weightActualValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  chartContainer: {
    height: 192,
    marginBottom: 24,
    position: 'relative',
  },
  chartBars: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    paddingHorizontal: 8,
  },
  chartBar: {
    flex: 1,
    borderRadius: 4,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textTertiary,
    letterSpacing: 1,
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailsButtonText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.tertiary,
    letterSpacing: 1.5,
  },
  psychologySection: {
    marginHorizontal: 24,
    marginBottom: 32,
    gap: 24,
  },
  psychologyImage: {
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 115, 74, 0.1)',
    padding: 4,
  },
  mindsetImage: {
    width: '100%',
    height: 200,
    borderRadius: 4,
  },
  psychologyContent: {
    paddingBottom: 16,
  },
  psychologyLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.tertiary,
    letterSpacing: 2,
    marginBottom: 12,
  },
  psychologyTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.textPrimary,
    lineHeight: 34,
    marginBottom: 16,
  },
  psychologyText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 24,
  },
  habitsButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    backgroundColor: COLORS.textPrimary,
    borderRadius: 6,
    alignItems: 'center',
  },
  habitsButtonText: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.bg,
    letterSpacing: 1.5,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 100,
    right: 24,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },
});

export default MetasScreen;
