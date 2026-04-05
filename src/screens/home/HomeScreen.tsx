import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
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
  FlatList,
  Dimensions,
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/authStore';
import {
  getGoalsForDate,
  toggleGoal as toggleGoalApi,
  type DailyGoal,
} from '../../services/goalsService';

type Nav = NativeStackNavigationProp<HomeStackParamList>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DAY_ITEM_WIDTH = 60;

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

const DAYS_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

// Generate a range of days centered around today
const TOTAL_DAYS = 365; // ~6 months each direction
const CENTER_INDEX = Math.floor(TOTAL_DAYS / 2);

interface CalendarDay {
  date: Date;
  dayName: string;
  dayNumber: number;
  monthName: string;
  isToday: boolean;
  key: string;
}

function generateDays(): CalendarDay[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days: CalendarDay[] = [];

  for (let i = -CENTER_INDEX; i <= CENTER_INDEX; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push({
      date: d,
      dayName: DAYS_SHORT[d.getDay()],
      dayNumber: d.getDate(),
      monthName: MONTHS[d.getMonth()],
      isToday: i === 0,
      key: d.toISOString().split('T')[0],
    });
  }
  return days;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatDateHeader(date: Date): string {
  return `${date.getDate()} de ${MONTHS[date.getMonth()]}`;
}

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const user = useAuthStore((s) => s.user);

  const calendarDays = useMemo(() => generateDays(), []);
  const calendarRef = useRef<FlatList>(null);

  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  });

  const [refreshing, setRefreshing] = useState(false);
  const [goals, setGoals] = useState<DailyGoal[]>([]);
  const [goalsLoading, setGoalsLoading] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerDate, setPickerDate] = useState(new Date());

  // Load goals when date changes
  const loadGoals = useCallback(async (date: Date) => {
    setGoalsLoading(true);
    try {
      const data = await getGoalsForDate(date);
      setGoals(data);
    } catch (e) {
      console.error('Error loading goals:', e);
    } finally {
      setGoalsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGoals(selectedDate);
  }, [selectedDate, loadGoals]);

  // Scroll to today on mount
  useEffect(() => {
    setTimeout(() => {
      calendarRef.current?.scrollToIndex({
        index: CENTER_INDEX,
        animated: false,
        viewPosition: 0.35,
      });
    }, 200);
  }, []);

  const scrollToToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setSelectedDate(today);
    calendarRef.current?.scrollToIndex({
      index: CENTER_INDEX,
      animated: true,
      viewPosition: 0.35,
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadGoals(selectedDate);
    setRefreshing(false);
  };

  const openDatePicker = () => {
    setPickerDate(new Date(selectedDate));
    setShowDatePicker(true);
  };

  const selectPickerDate = (date: Date) => {
    setShowDatePicker(false);
    setSelectedDate(date);
    // Find the index for this date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    const targetIndex = CENTER_INDEX + diffDays;
    if (targetIndex >= 0 && targetIndex < TOTAL_DAYS) {
      setTimeout(() => {
        calendarRef.current?.scrollToIndex({
          index: targetIndex,
          animated: true,
          viewPosition: 0.35,
        });
      }, 100);
    }
  };

  const changePickerMonth = (delta: number) => {
    const newDate = new Date(pickerDate);
    newDate.setMonth(newDate.getMonth() + delta);
    setPickerDate(newDate);
  };

  const getPickerDays = () => {
    const year = pickerDate.getFullYear();
    const month = pickerDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  };

  const handleToggleGoal = async (goal: DailyGoal) => {
    const newCompleted = !goal.completed;
    // Optimistic update
    setGoals((prev) =>
      prev.map((g) => (g.id === goal.id ? { ...g, completed: newCompleted } : g))
    );
    const ok = await toggleGoalApi(goal.id, newCompleted);
    if (!ok) {
      // Revert on error
      setGoals((prev) =>
        prev.map((g) => (g.id === goal.id ? { ...g, completed: !newCompleted } : g))
      );
    }
  };

  const completedGoals = goals.filter((g) => g.completed).length;
  const isToday = isSameDay(selectedDate, new Date());

  const renderCalendarDay = useCallback(
    ({ item }: { item: CalendarDay }) => {
      const isSelected = isSameDay(item.date, selectedDate);
      return (
        <TouchableOpacity
          style={styles.dayColumn}
          onPress={() => setSelectedDate(new Date(item.date))}
          activeOpacity={0.7}
        >
          <Text style={[styles.dayLabel, isSelected && styles.dayLabelActive]}>
            {item.dayName}
          </Text>
          <View style={[styles.dayCard, isSelected && styles.dayCardActive]}>
            <Text style={[styles.dayDate, isSelected && styles.dayDateActive]}>
              {item.dayNumber}
            </Text>
          </View>
          {item.isToday && <View style={styles.todayDot} />}
        </TouchableOpacity>
      );
    },
    [selectedDate]
  );

  const getItemLayout = useCallback(
    (_data: any, index: number) => ({
      length: DAY_ITEM_WIDTH,
      offset: DAY_ITEM_WIDTH * index,
      index,
    }),
    []
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Fixed Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.navigate('Perfil')}>
            <MaterialCommunityIcons name="menu" size={24} color={COLORS.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>MÉTODO R3SET</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Perfil')}>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitial}>
              {(user?.name?.[0] ?? user?.email?.[0] ?? 'U').toUpperCase()}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
        scrollIndicatorInsets={{ bottom: 80 }}
      >
        {/* Date Header */}
        <View style={styles.dateSection}>
          <View style={{ flex: 1 }}>
            <Text style={styles.dateLabel}>{isToday ? 'HOY' : DAYS_SHORT[selectedDate.getDay()]?.toUpperCase()}</Text>
            <Text style={styles.dateTitle}>{formatDateHeader(selectedDate)}</Text>
          </View>
          <View style={styles.dateActions}>
            <TouchableOpacity style={styles.todayButton} onPress={scrollToToday}>
              <Text style={styles.todayButtonText}>Hoy</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.calendarButton} onPress={openDatePicker}>
              <MaterialCommunityIcons name="calendar-month" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Infinite Week Day Scroller */}
        <View style={styles.weekScrollerContainer}>
          <FlatList
            ref={calendarRef}
            data={calendarDays}
            renderItem={renderCalendarDay}
            keyExtractor={(item) => item.key}
            horizontal
            showsHorizontalScrollIndicator={false}
            getItemLayout={getItemLayout}
            initialScrollIndex={CENTER_INDEX}
            windowSize={15}
            maxToRenderPerBatch={21}
            removeClippedSubviews
            onScrollToIndexFailed={(info) => {
              setTimeout(() => {
                calendarRef.current?.scrollToIndex({
                  index: info.index,
                  animated: false,
                  viewPosition: 0.35,
                });
              }, 100);
            }}
          />
        </View>

        {/* Training Card */}
        <View style={styles.contentPadding}>
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
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => navigation.navigate('CargarFotos')}
              activeOpacity={0.7}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: COLORS.surfaceHighest }]}>
                <MaterialCommunityIcons name="camera-plus" size={20} color={COLORS.primary} />
              </View>
              <Text style={styles.quickActionTitle}>Cargar fotos</Text>
              <Text style={styles.quickActionSubtitle}>Progreso visual</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => navigation.navigate('PesoYMedidas')}
              activeOpacity={0.7}
            >
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
              {!goalsLoading && goals.length > 0 && (
                <Text style={styles.goalsProgress}>
                  {completedGoals}/{goals.length} Completado
                </Text>
              )}
            </View>

            {goalsLoading ? (
              <View style={styles.goalsLoadingContainer}>
                <ActivityIndicator size="small" color={COLORS.primary} />
              </View>
            ) : (
              <View style={styles.goalsList}>
                {goals.map((goal) => (
                  <TouchableOpacity
                    key={goal.id}
                    style={styles.goalItem}
                    onPress={() => handleToggleGoal(goal)}
                  >
                    <View
                      style={[
                        styles.goalCheckbox,
                        goal.completed && styles.goalCheckboxCompleted,
                      ]}
                    >
                      {goal.completed && (
                        <MaterialCommunityIcons name="check" size={14} color="#000" />
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
            )}
          </View>

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Date Picker Modal */}
      <Modal visible={showDatePicker} transparent animationType="fade" onRequestClose={() => setShowDatePicker(false)}>
        <TouchableOpacity style={styles.pickerOverlay} activeOpacity={1} onPress={() => setShowDatePicker(false)}>
          <View style={styles.pickerContainer} onStartShouldSetResponder={() => true}>
            <View style={styles.pickerHeader}>
              <TouchableOpacity onPress={() => changePickerMonth(-1)}>
                <MaterialCommunityIcons name="chevron-left" size={28} color={COLORS.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.pickerTitle}>
                {MONTHS[pickerDate.getMonth()]} {pickerDate.getFullYear()}
              </Text>
              <TouchableOpacity onPress={() => changePickerMonth(1)}>
                <MaterialCommunityIcons name="chevron-right" size={28} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>
            <View style={styles.pickerWeekRow}>
              {DAYS_SHORT.map((d) => (
                <Text key={d} style={styles.pickerWeekDay}>{d}</Text>
              ))}
            </View>
            <View style={styles.pickerGrid}>
              {getPickerDays().map((day, i) => {
                if (day === null) return <View key={`e-${i}`} style={styles.pickerDayCell} />;
                const date = new Date(pickerDate.getFullYear(), pickerDate.getMonth(), day);
                const isSelected = isSameDay(date, selectedDate);
                const isTodayDate = isSameDay(date, new Date());
                return (
                  <TouchableOpacity
                    key={`d-${day}`}
                    style={[styles.pickerDayCell, isSelected && styles.pickerDayCellActive]}
                    onPress={() => selectPickerDate(date)}
                  >
                    <Text style={[styles.pickerDayText, isSelected && styles.pickerDayTextActive, isTodayDate && !isSelected && styles.pickerDayToday]}>
                      {day}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
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
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceHighest,
    borderWidth: 1,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  scrollView: {
    flex: 1,
  },
  contentPadding: {
    paddingHorizontal: 24,
  },
  dateSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginVertical: 24,
    paddingHorizontal: 24,
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
    textTransform: 'uppercase',
  },
  weekScrollerContainer: {
    marginBottom: 24,
  },
  dayColumn: {
    alignItems: 'center',
    width: DAY_ITEM_WIDTH,
  },
  dayLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textTertiary,
    letterSpacing: 1,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  dayLabelActive: {
    color: COLORS.primary,
  },
  dayCard: {
    width: 44,
    height: 56,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceLow,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
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
  todayDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    marginTop: 6,
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
    backgroundColor: 'rgba(14,14,14,0.5)',
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
    paddingHorizontal: 20,
    paddingVertical: 20,
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
  goalsLoadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
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
  calendarButton: {
    width: 36,
    height: 36,
    backgroundColor: COLORS.surfaceHigh,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerContainer: {
    width: SCREEN_WIDTH - 48,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  pickerWeekRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  pickerWeekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textTertiary,
    letterSpacing: 1,
  },
  pickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  pickerDayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerDayCellActive: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
  },
  pickerDayText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  pickerDayTextActive: {
    color: '#000',
    fontWeight: '700',
  },
  pickerDayToday: {
    color: COLORS.primary,
  },
});

export default HomeScreen;
