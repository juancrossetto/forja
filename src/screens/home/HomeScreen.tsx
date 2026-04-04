import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ImageBackground,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const COLORS = {
  bg: '#0e0e0e',
  surface: '#1a1a1a',
  surfaceHigh: '#20201f',
  surfaceHighest: '#262626',
  surfaceLow: '#131313',
  elevated: '#222222',
  primary: '#D1FF26',
  primaryDim: '#c1ed00',
  secondary: '#00e3fd',
  tertiary: '#ff734a',
  textPrimary: '#FFF',
  textSecondary: 'rgba(255,255,255,0.70)',
  textTertiary: 'rgba(255,255,255,0.45)',
  borderLight: 'rgba(255,255,255,0.05)',
};

interface DayData {
  day: string;
  date: number;
  isActive: boolean;
}

interface Goal {
  id: string;
  text: string;
  completed: boolean;
}

const HomeScreen: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [goals, setGoals] = useState<Goal[]>([
    { id: '1', text: '2.5L de Agua', completed: true },
    { id: '2', text: 'Meditación 10 min', completed: true },
    { id: '3', text: 'Caminar 10,000 pasos', completed: false },
    { id: '4', text: 'Sin azúcar procesada', completed: false },
  ]);

  const daysOfWeek: DayData[] = [
    { day: 'Lun', date: 11, isActive: false },
    { day: 'Mar', date: 12, isActive: false },
    { day: 'Mie', date: 13, isActive: false },
    { day: 'Jue', date: 14, isActive: true },
    { day: 'Vie', date: 15, isActive: false },
    { day: 'Sab', date: 16, isActive: false },
    { day: 'Dom', date: 17, isActive: false },
  ];

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const toggleGoal = (id: string) => {
    setGoals(goals.map(g => (g.id === id ? { ...g, completed: !g.completed } : g)));
  };

  const completedGoals = goals.filter(g => g.completed).length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Fixed Header */}
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
              uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDKYrzRA54WdyZ2AJ803jO9vzBARcWEl_4-HuBCt6UGy0WR7RLWmwKbjCNyqXwaZZb_v-A2zaPrhpp_jQELbxxyZFJu5Iy8JqkLrTBkScS24abyLQKlTsq59mr_s9mDSCeV7znh7v-MFepmv8BHaWrAk_zoSFVldKnEj67fWboGXfkXdgZdWssAkrulBxSjyClZ1lYbWyi9weLZm7dgtl-nADnRH0bj8aIVzp6pp3JaDcNUBB1Pbfhr5NEIbznjneRTM0qctUUHj49k',
            }}
            style={styles.avatar}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        scrollIndicatorInsets={{ bottom: 80 }}
      >
        {/* Date Header */}
        <View style={styles.dateSection}>
          <View>
            <Text style={styles.dateLabel}>HOY</Text>
            <Text style={styles.dateTitle}>14 de Octubre</Text>
          </View>
          <View style={styles.dateActions}>
            <TouchableOpacity style={styles.todayButton}>
              <Text style={styles.todayButtonText}>Today</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.calendarButton}>
              <MaterialCommunityIcons name="calendar-today" size={18} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Week Day Scroller */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.weekScroller}
          scrollEventThrottle={16}
        >
          {daysOfWeek.map((day, index) => (
            <TouchableOpacity key={index} style={styles.dayColumn}>
              <Text style={[styles.dayLabel, day.isActive && styles.dayLabelActive]}>{day.day}</Text>
              <View
                style={[
                  styles.dayCard,
                  day.isActive && styles.dayCardActive,
                ]}
              >
                <Text style={[styles.dayDate, day.isActive && styles.dayDateActive]}>
                  {day.date}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Training Card */}
        <ImageBackground
          source={{
            uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCWVA8HVPGt0grw-MKUXC213bTRcLjgpXR2bFenAL6FpNyoiN7etNRJbRDDvc6I4yPXcta_S4OHWZVHWuSvtIeznyl7K-Xb_PyKZgxP2jyiuBb10w8TDQKKXONUBf-jravIzHZ_PMgZdmIWpiQ6sEnGsLfdCch2BRIRGqshLAoVWy4knvPB8F6ZAFCmS0TtYuHTe1KNt2O9LnvsUM-o0AN_niQGB8TeOoOt7CsFztuuMAzktfzpGEvOc3TV67xQ8_Ud02CkKYKwi6OT',
          }}
          style={styles.trainingCard}
          imageStyle={styles.trainingCardImage}
        >
          <View style={styles.trainingCardOverlay} />
          <View style={styles.trainingCardContent}>
            <Text style={styles.trainingLabel}>ACTIVIDAD PRINCIPAL</Text>
            <Text style={styles.trainingTitle}>Entrenamiento del día</Text>
            <View style={styles.trainingStats}>
              <View style={styles.statBadge}>
                <MaterialCommunityIcons name="timer-outline" size={12} color={COLORS.textSecondary} />
                <Text style={styles.statText}>45 min</Text>
              </View>
              <View style={styles.statBadge}>
                <MaterialCommunityIcons name="fire" size={12} color={COLORS.textSecondary} />
                <Text style={styles.statText}>320 kcal</Text>
              </View>
            </View>
          </View>
        </ImageBackground>

        {/* Quick Action Cards */}
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity style={styles.quickActionCard}>
            <View style={[styles.quickActionIcon, { backgroundColor: COLORS.surfaceHighest }]}>
              <MaterialCommunityIcons name="camera-plus" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.quickActionTitle}>Cargar fotos</Text>
            <Text style={styles.quickActionSubtitle}>Progreso visual</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickActionCard}>
            <View style={[styles.quickActionIcon, { backgroundColor: COLORS.surfaceHighest }]}>
              <MaterialCommunityIcons name="ruler" size={20} color={COLORS.secondary} />
            </View>
            <Text style={styles.quickActionTitle}>Peso y Medidas</Text>
            <Text style={styles.quickActionSubtitle}>Antropométrico</Text>
          </TouchableOpacity>
        </View>

        {/* Session Card */}
        <View style={styles.sessionCard}>
          <View style={styles.sessionHeader}>
            <View style={styles.sessionBadge}>
              <Text style={styles.sessionBadgeText}>EN VIVO</Text>
            </View>
            <Text style={styles.sessionTime}>18:00 - 18:30</Text>
          </View>
          <Text style={styles.sessionTitle}>Sesión 1-1</Text>
          <Text style={styles.sessionDescription}>
            Revisión de técnica y ajuste de plan nutricional con Coach Alex.
          </Text>
          <TouchableOpacity style={styles.sessionLink}>
            <Text style={styles.sessionLinkText}>Unirse a la llamada</Text>
            <MaterialCommunityIcons name="arrow-right" size={12} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* Goals Section */}
        <View style={styles.goalsSection}>
          <View style={styles.goalsSectionHeader}>
            <Text style={styles.goalsSectionTitle}>Metas del día</Text>
            <Text style={styles.goalsProgress}>
              {completedGoals}/{goals.length} Completado
            </Text>
          </View>

          <View style={styles.goalsList}>
            {goals.map(goal => (
              <TouchableOpacity
                key={goal.id}
                style={styles.goalItem}
                onPress={() => toggleGoal(goal.id)}
              >
                <View
                  style={[
                    styles.goalCheckbox,
                    goal.completed && styles.goalCheckboxCompleted,
                  ]}
                >
                  {goal.completed && (
                    <MaterialCommunityIcons name="check" size={14} color={COLORS.textPrimary} />
                  )}
                </View>
                <Text
                  style={[
                    styles.goalText,
                    goal.completed && styles.goalTextCompleted,
                  ]}
                >
                  {goal.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Action Buttons */}
      <View style={styles.fabContainer}>
        <TouchableOpacity style={styles.fabSecondary}>
          <MaterialCommunityIcons name="chat-bubble-outline" size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.fabPrimary}>
          <MaterialCommunityIcons name="plus" size={28} color={COLORS.textPrimary} />
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
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 24,
  },
  dateSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginVertical: 32,
  },
  dateLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textTertiary,
    letterSpacing: 2,
    marginBottom: 8,
  },
  dateTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  dateActions: {
    flexDirection: 'row',
    gap: 8,
  },
  todayButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.surfaceHigh,
    borderRadius: 8,
  },
  todayButtonText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: 1.2,
  },
  calendarButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceHigh,
    borderRadius: 8,
  },
  weekScroller: {
    marginBottom: 24,
    marginHorizontal: -24,
    paddingHorizontal: 24,
  },
  dayColumn: {
    alignItems: 'center',
    marginRight: 16,
    width: 60,
  },
  dayLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textTertiary,
    letterSpacing: 1,
    marginBottom: 8,
  },
  dayLabelActive: {
    color: COLORS.primary,
  },
  dayCard: {
    width: 48,
    height: 64,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceLow,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0)',
  },
  dayCardActive: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  dayDate: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  dayDateActive: {
    color: '#000',
  },
  trainingCard: {
    height: 192,
    borderRadius: 12,
    marginBottom: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  trainingCardImage: {
    opacity: 0.4,
  },
  trainingCardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(14,14,14,1)',
  },
  trainingCardContent: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  trainingLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.primaryDim,
    letterSpacing: 2,
    marginBottom: 8,
  },
  trainingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  trainingStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  quickActionCard: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 24,
    backgroundColor: COLORS.surfaceLow,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  quickActionSubtitle: {
    fontSize: 11,
    color: COLORS.textTertiary,
  },
  sessionCard: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#ff5722',
    marginBottom: 16,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sessionBadge: {
    backgroundColor: 'rgba(255, 87, 34, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  sessionBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#ff9475',
    letterSpacing: 1.5,
  },
  sessionTime: {
    fontSize: 9,
    color: COLORS.textTertiary,
    fontWeight: '600',
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  sessionDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  sessionLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  sessionLinkText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 1,
  },
  goalsSection: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    backgroundColor: COLORS.surfaceLow,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginBottom: 24,
  },
  goalsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  goalsSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  goalsProgress: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.primary,
  },
  goalsList: {
    gap: 16,
  },
  goalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  goalCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalCheckboxCompleted: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  goalText: {
    fontSize: 13,
    color: COLORS.textPrimary,
    flex: 1,
  },
  goalTextCompleted: {
    textDecorationLine: 'line-through',
    color: COLORS.textTertiary,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 80,
    right: 24,
    gap: 16,
  },
  fabSecondary: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.surfaceHighest,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabPrimary: {
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

export default HomeScreen;
