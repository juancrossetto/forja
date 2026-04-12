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
  FlatList,
  Dimensions,
  ActivityIndicator,
  Modal,
  Platform,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppProgressiveHeader, HEADER_ROW_HEIGHT } from '../../components/AppProgressiveHeader';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import {
  getGoalsForDate,
  toggleGoal as toggleGoalApi,
  type DailyGoal,
} from '../../services/goalsService';
import { getProfile } from '../../services/profileService';
import { syncAllGoalsForDate } from '../../services/goalProgressService';
import { registerForPushNotifications } from '../../services/pushNotificationService';
import { startStepTracking, stopStepTracking, syncStepsToGoal } from '../../services/stepCounterService';

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

// ── Progress label for auto-tracked goals ──
function goalProgressLabel(goal: DailyGoal): string | null {
  if (!goal.auto_track || goal.target_unit === 'boolean') return null;
  const cur = goal.current_value ?? 0;
  const tgt = goal.target_value ?? 1;
  switch (goal.target_unit) {
    case 'ml':
      return `${(cur / 1000).toFixed(1)}L / ${(tgt / 1000).toFixed(1)}L`;
    case 'steps':
      return `${cur.toLocaleString()} / ${tgt.toLocaleString()}`;
    case 'minutes':
      return `${Math.round(cur)} / ${Math.round(tgt)} min`;
    case 'meals':
      return `${Math.round(cur)} / ${Math.round(tgt)}`;
    default:
      return null;
  }
}

function goalProgressPct(goal: DailyGoal): number {
  if (!goal.auto_track || !goal.target_value) return 0;
  return Math.min((goal.current_value ?? 0) / goal.target_value, 1);
}

// ── Animated Goal Item ──────────────────────────────────────────────────────
const GoalItem = React.memo(({ goal, onToggle }: { goal: DailyGoal; onToggle: (g: DailyGoal) => void }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const bgAnim    = useRef(new Animated.Value(goal.completed ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(bgAnim, {
      toValue: goal.completed ? 1 : 0,
      duration: 280,
      useNativeDriver: false,
    }).start();
  }, [goal.completed]);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.72, duration: 75, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 3, tension: 220, useNativeDriver: true }),
    ]).start();
    onToggle(goal);
  };

  const bgColor = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(209,255,38,0)', 'rgba(209,255,38,0.06)'],
  });

  const progress = goalProgressLabel(goal);
  const pct = goalProgressPct(goal);

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
      <Animated.View style={[styles.goalItem, { backgroundColor: bgColor }]}>
        <Animated.View style={[styles.goalCheckbox, goal.completed && styles.goalCheckboxCompleted, { transform: [{ scale: scaleAnim }] }]}>
          {goal.completed && <MaterialCommunityIcons name="check" size={13} color="#000" />}
        </Animated.View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.goalText, goal.completed && styles.goalTextCompleted]}>{goal.text}</Text>
          {progress && (
            <View style={styles.goalProgressRow}>
              <View style={styles.goalProgressBarBgSmall}>
                <View style={[styles.goalProgressBarFillSmall, { width: `${Math.round(pct * 100)}%` }]} />
              </View>
              <Text style={styles.goalProgressLabel}>{progress}</Text>
            </View>
          )}
        </View>
        {goal.completed && (
          <MaterialCommunityIcons name="check-circle" size={16} color={COLORS.primary} style={{ opacity: 0.55 }} />
        )}
      </Animated.View>
    </TouchableOpacity>
  );
});

// ────────────────────────────────────────────────────────────────────────────
const HomeScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const user = useAuthStore((s) => s.user);
  const setActiveDate = useUIStore((s) => s.setActiveDate);
  const insets = useSafeAreaInsets();

  const calendarDays = useMemo(() => generateDays(), []);
  const calendarRef = useRef<FlatList>(null);

  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  });

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [goals, setGoals] = useState<DailyGoal[]>([]);
  const [goalsLoading, setGoalsLoading] = useState(true);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerDate, setPickerDate] = useState(new Date());

  // Load goals when date changes — also sync progress from tracked sources
  const loadGoals = useCallback(async (date: Date) => {
    setGoalsLoading(true);
    try {
      const dateStr = date.toISOString().split('T')[0];
      // Ensure goals exist first, then sync real-time progress
      const data = await getGoalsForDate(date);
      setGoals(data);
      // Sync progress from hydration/meals/training in background, then refresh
      syncAllGoalsForDate(dateStr).then(() => {
        getGoalsForDate(date).then(setGoals);
      }).catch(() => {});
      // Also sync steps for today
      if (isSameDay(date, new Date())) {
        syncStepsToGoal().catch(() => {});
      }
    } catch (e) {
      console.error('Error loading goals:', e);
    } finally {
      setGoalsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGoals(selectedDate);
    // Sync active date to global store so other screens (e.g. Hidratacion) know which day we're on
    setActiveDate(selectedDate.toISOString().split('T')[0]);
  }, [selectedDate, loadGoals, setActiveDate]);

  // Load avatar from profile
  useEffect(() => {
    getProfile().then((p) => { if (p?.avatar_url) setAvatarUrl(p.avatar_url); });
  }, []);

  // One-time init: push notifications + step tracking
  useEffect(() => {
    registerForPushNotifications().catch(() => {});
    startStepTracking().catch(() => {});
    return () => { stopStepTracking(); };
  }, []);

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

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: goals.length > 0 ? completedGoals / goals.length : 0,
      duration: 450,
      useNativeDriver: false,
    }).start();
  }, [completedGoals, goals.length]);
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
    <View style={styles.container}>
      <Animated.ScrollView
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
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingTop: insets.top + HEADER_ROW_HEIGHT }}
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
            <View style={styles.sessionTopRow}>
              <View style={styles.sessionLiveBadge}>
                <View style={styles.sessionLiveDot} />
                <Text style={styles.sessionLiveText}>EN VIVO</Text>
              </View>
              <View style={styles.sessionTimeRow}>
                <MaterialCommunityIcons name="clock-outline" size={11} color={COLORS.textTertiary} />
                <Text style={styles.sessionTime}>18:00 – 18:30</Text>
              </View>
            </View>

            <Text style={styles.sessionTitle}>Sesión 1-1</Text>

            <View style={styles.sessionCoachRow}>
              <View style={styles.sessionCoachAvatar}>
                <MaterialCommunityIcons name="account" size={15} color={COLORS.textTertiary} />
              </View>
              <Text style={styles.sessionCoachName}>Coach Alex</Text>
              <View style={styles.sessionDividerDot} />
              <Text style={styles.sessionDescription}>Nutrición · Técnica</Text>
            </View>

            <TouchableOpacity style={styles.sessionCTA} activeOpacity={0.85}>
              <MaterialCommunityIcons name="video" size={14} color="#000" />
              <Text style={styles.sessionCTAText}>UNIRSE A LA LLAMADA</Text>
            </TouchableOpacity>
          </View>

          {/* Goals Section */}
          <View style={styles.goalsSection}>
            <View style={styles.goalsSectionHeader}>
              <View>
                <Text style={styles.goalsSectionTitle}>Metas del día</Text>
                {!goalsLoading && goals.length > 0 && (
                  <Text style={styles.goalsSubtitle}>
                    {completedGoals} de {goals.length} completadas
                  </Text>
                )}
              </View>
              {!goalsLoading && goals.length > 0 && (
                <View style={styles.goalsRing}>
                  <Text style={styles.goalsRingText}>
                    {Math.round((completedGoals / goals.length) * 100)}%
                  </Text>
                </View>
              )}
            </View>

            {!goalsLoading && goals.length > 0 && (
              <View style={styles.goalsProgressBarBg}>
                <Animated.View
                  style={[
                    styles.goalsProgressBarFill,
                    {
                      width: progressAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      }),
                    },
                  ]}
                />
              </View>
            )}

            {goalsLoading ? (
              <View style={styles.goalsLoadingContainer}>
                <ActivityIndicator size="small" color={COLORS.primary} />
              </View>
            ) : (
              <View style={styles.goalsList}>
                {goals.map((goal) => (
                  <GoalItem key={goal.id} goal={goal} onToggle={handleToggleGoal} />
                ))}
              </View>
            )}
          </View>

          <View style={{ height: 100 }} />
        </View>
      </Animated.ScrollView>

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

      {/* Progressive blur header — rendered last so it layers on top */}
      <AppProgressiveHeader
        scrollY={scrollY}
        topInset={insets.top}
        onHomePress={() => navigation.navigate('Inicio')}
        onAvatarPress={() => navigation.navigate('Perfil')}
        avatarUrl={avatarUrl}
        avatarInitial={(user?.name?.[0] ?? user?.email?.[0] ?? 'U').toUpperCase()}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    // Content extends edge-to-edge; AppProgressiveHeader handles the top inset.
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
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(209,255,38,0.4)',
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 8,
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
  // Session Card
  sessionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,115,74,0.15)',
    overflow: 'hidden',
  },
  sessionTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sessionLiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,115,74,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,115,74,0.3)',
  },
  sessionLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.tertiary,
  },
  sessionLiveText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.tertiary,
    letterSpacing: 1.5,
  },
  sessionTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  sessionTime: {
    fontSize: 11,
    color: COLORS.textTertiary,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  sessionTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  sessionCoachRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sessionCoachAvatar: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: COLORS.surfaceHighest,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sessionCoachName: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  sessionDividerDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: COLORS.textTertiary,
  },
  sessionDescription: {
    fontSize: 11,
    color: COLORS.textTertiary,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  sessionCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 13,
    borderRadius: 10,
  },
  sessionCTAText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#000',
    letterSpacing: 1.5,
  },

  // Goals Section
  goalsSection: {
    backgroundColor: COLORS.surfaceLow,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginBottom: 24,
  },
  goalsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  goalsSectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  goalsSubtitle: {
    fontSize: 11,
    color: COLORS.textTertiary,
    fontWeight: '500',
  },
  goalsRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(209,255,38,0.07)',
  },
  goalsRingText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
  },
  goalsProgressBarBg: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 2,
    marginBottom: 20,
    overflow: 'hidden',
  },
  goalsProgressBarFill: {
    height: 3,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  goalsLoadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  goalsList: {
    gap: 4,
  },
  goalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: 'transparent',
  },

  goalCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  goalCheckboxCompleted: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  goalText: {
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  goalTextCompleted: {
    textDecorationLine: 'line-through',
    color: COLORS.textTertiary,
  },
  goalProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 5,
  },
  goalProgressBarBgSmall: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  goalProgressBarFillSmall: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: COLORS.primary,
  },
  goalProgressLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textTertiary,
    minWidth: 75,
    textAlign: 'right',
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
