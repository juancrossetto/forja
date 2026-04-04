import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Color palette
const colors = {
  bg: '#0e0e0e',
  surface: '#1a1a1a',
  elevated: '#222222',
  primary: '#D1FF26',
  secondary: '#00e3fd',
  tertiary: '#ff734a',
  textPrimary: '#FFF',
  textSecondary: 'rgba(255,255,255,0.70)',
  textTertiary: 'rgba(255,255,255,0.45)',
};

interface DayCard {
  id: string;
  day: number;
  dayName: string;
  title: string;
  duration: number;
  intensity: string;
  type: 'active' | 'rest' | 'normal';
}

const WORKOUT_DAYS: DayCard[] = [
  {
    id: '1',
    day: 1,
    dayName: 'Lunes',
    title: 'Empuje Horizontal',
    duration: 75,
    intensity: 'Alta Intensidad',
    type: 'active',
  },
  {
    id: '2',
    day: 2,
    dayName: 'Martes',
    title: 'Tracción Vertical',
    duration: 60,
    intensity: 'Moderada',
    type: 'normal',
  },
  {
    id: '3',
    day: 3,
    dayName: 'Miércoles',
    title: 'Descanso Activo',
    duration: 30,
    intensity: 'Movilidad',
    type: 'rest',
  },
  {
    id: '4',
    day: 4,
    dayName: 'Jueves',
    title: 'Tren Inferior',
    duration: 80,
    intensity: 'Max Esfuerzo',
    type: 'normal',
  },
  {
    id: '5',
    day: 5,
    dayName: 'Viernes',
    title: 'Full Body Flow',
    duration: 65,
    intensity: 'Moderada',
    type: 'normal',
  },
  {
    id: '6',
    day: 6,
    dayName: 'Sábado',
    title: 'LISS & Recovery',
    duration: 45,
    intensity: 'Baja',
    type: 'normal',
  },
  {
    id: '7',
    day: 7,
    dayName: 'Domingo',
    title: 'Rest Day',
    duration: 0,
    intensity: 'Descanso',
    type: 'rest',
  },
];

export const EntrenamientosScreen: React.FC = () => {
  const [selectedDay, setSelectedDay] = useState(WORKOUT_DAYS[0]);

  const renderDayCard = ({ item }: { item: DayCard }) => {
    const isActive = item.type === 'active';
    const isRest = item.type === 'rest';

    return (
      <View
        style={[
          styles.dayCard,
          isActive && styles.dayCardActive,
          isRest && styles.dayCardRest,
        ]}
      >
        <View
          style={[
            styles.dayNumber,
            isActive && styles.dayNumberActive,
            isRest && styles.dayNumberRest,
          ]}
        >
          <Text
            style={[
              styles.dayNumberText,
              isRest && { color: colors.tertiary },
            ]}
          >
            {String(item.day).padStart(2, '0')}
          </Text>
          <Text
            style={[
              styles.dayNameText,
              isRest && { color: colors.tertiary },
            ]}
          >
            {item.dayName}
          </Text>
        </View>

        <View style={styles.dayContent}>
          <View>
            <Text style={styles.dayTitle}>{item.title}</Text>
            <View style={styles.dayMeta}>
              <Text style={styles.dayMetaText}>
                {item.duration} MIN
              </Text>
              {!isRest && (
                <Text style={styles.dayIntensity}>{item.intensity}</Text>
              )}
              {isRest && (
                <Text style={[styles.dayIntensity, { color: colors.tertiary }]}>
                  {item.intensity}
                </Text>
              )}
            </View>
          </View>

          {!isRest ? (
            <TouchableOpacity
              style={[
                styles.dayButton,
                isActive && styles.dayButtonActive,
              ]}
              onPress={() => setSelectedDay(item)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.dayButtonText,
                  isActive && styles.dayButtonTextActive,
                ]}
              >
                {isActive ? 'Iniciar' : 'Ver Rutina'}
              </Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.restIcon}>zzz</Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            POTENCIA{'\n'}ESTRUCTURAL
          </Text>
          <View style={styles.headerTags}>
            <View style={styles.phaseTag}>
              <Text style={styles.phaseTagText}>Fase 02</Text>
            </View>
            <Text style={styles.phaseDescription}>
              Hipertrofia Funcional
            </Text>
          </View>
        </View>

        {/* Phase Progress Card */}
        <View style={styles.progressSection}>
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <View>
                <Text style={styles.progressTitle}>
                  Fase de Reconstrucción
                </Text>
                <Text style={styles.progressDate}>01 OCT — 28 OCT</Text>
              </View>
              <Text style={styles.progressPercent}>25%</Text>
            </View>

            <Text style={styles.progressDescription}>
              Enfoque en la densidad muscular y estabilización de cadenas
              cinéticas. Priorizamos el tiempo bajo tensión y la recuperación
              activa entre bloques de alta intensidad.
            </Text>

            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBackground}>
                <LinearGradient
                  colors={[colors.secondary, colors.primary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.progressBar}
                />
              </View>
            </View>
          </View>

          <View style={styles.sideCards}>
            <View style={styles.goalCard}>
              <Text style={styles.goalLabel}>Meta de la Semana</Text>
              <Text style={styles.goalValue}>Sobrecarga Progresiva +2kg</Text>
            </View>
            <View style={styles.quoteCard}>
              <Text style={styles.quoteLabel}>Recordatorio R3SET</Text>
              <Text style={styles.quoteText}>
                "La consistencia vence a la intensidad pura en el largo plazo."
              </Text>
            </View>
          </View>
        </View>

        {/* Workouts Schedule */}
        <View style={styles.scheduleSection}>
          <Text style={styles.scheduleTitle}>Cronograma Semanal</Text>
          <Text style={styles.scheduleSubtitle}>
            Desliza para explorar
          </Text>

          <FlatList
            data={WORKOUT_DAYS}
            renderItem={renderDayCard}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            contentContainerStyle={styles.daysList}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 32,
    marginBottom: 48,
  },
  headerTitle: {
    fontSize: 56,
    fontWeight: '900',
    color: colors.primary,
    lineHeight: 56,
    letterSpacing: -1.5,
    marginBottom: 16,
  },
  headerTags: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  phaseTag: {
    backgroundColor: '#006875',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  phaseTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'white',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  phaseDescription: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  progressSection: {
    paddingHorizontal: 24,
    marginBottom: 48,
    gap: 16,
  },
  progressCard: {
    backgroundColor: colors.elevated,
    padding: 24,
    borderRadius: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  progressTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  progressDate: {
    fontSize: 11,
    fontWeight: '400',
    color: colors.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  progressPercent: {
    fontSize: 32,
    fontWeight: '900',
    color: 'rgba(72, 72, 71, 0.3)',
    fontStyle: 'italic',
  },
  progressDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 24,
  },
  progressBarContainer: {
    gap: 8,
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: colors.surface,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    width: '25%',
    height: '100%',
  },
  sideCards: {
    gap: 12,
  },
  goalCard: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 8,
  },
  goalLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  goalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  quoteCard: {
    backgroundColor: colors.elevated,
    padding: 16,
    borderRadius: 8,
  },
  quoteLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  quoteText: {
    fontSize: 13,
    fontStyle: 'italic',
    color: colors.textSecondary,
    lineHeight: 18,
  },
  scheduleSection: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  scheduleTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  scheduleSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 24,
  },
  daysList: {
    gap: 16,
  },
  dayCard: {
    backgroundColor: colors.elevated,
    borderRadius: 8,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  dayCardActive: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  dayCardRest: {
    borderLeftWidth: 4,
    borderLeftColor: colors.tertiary,
    opacity: 0.8,
  },
  dayNumber: {
    backgroundColor: '#262626',
    paddingHorizontal: 16,
    paddingVertical: 16,
    width: '28%',
    justifyContent: 'space-between',
  },
  dayNumberActive: {
    backgroundColor: colors.primary,
  },
  dayNumberRest: {
    backgroundColor: colors.tertiary,
    opacity: 0.2,
  },
  dayNumberText: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.textTertiary,
    lineHeight: 32,
  },
  dayNameText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 8,
  },
  dayContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  dayMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  dayMetaText: {
    fontSize: 11,
    fontWeight: '400',
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  dayIntensity: {
    fontSize: 11,
    fontWeight: '400',
    color: colors.secondary,
    textTransform: 'uppercase',
  },
  dayButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(72, 72, 71, 0.5)',
    borderRadius: 4,
  },
  dayButtonActive: {
    backgroundColor: colors.textPrimary,
    borderColor: colors.textPrimary,
  },
  dayButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dayButtonTextActive: {
    color: '#000',
  },
  restIcon: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.tertiary,
    opacity: 0.4,
  },
});
export default EntrenamientosScreen;
