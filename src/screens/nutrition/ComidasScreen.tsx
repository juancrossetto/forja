import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  Image,
  TouchableOpacity,
  Switch,
  Dimensions,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getProfile } from '../../services/profileService';
import { AppProgressiveHeader, HEADER_ROW_HEIGHT } from '../../components/AppProgressiveHeader';

const { width } = Dimensions.get('window');

interface DayButton {
  day: string;
  date: number;
}

interface Meal {
  id: string;
  name: string;
  time: string;
  image: string;
  protein: number;
  carbs: number;
  fats: number;
  completed: boolean;
}

interface ShoppingItem {
  id: string;
  name: string;
  quantity: string;
  category: string;
  icon: string;
}

const COLORS = {
  bg: '#0e0e0e',
  surface: '#1a1a1a',
  surfaceHigh: '#20201f',
  elevated: '#262626',
  primary: '#D1FF26',
  secondary: '#00e3fd',
  tertiary: '#ff734a',
  text: '#ffffff',
  textVariant: '#adaaaa',
};

const DAYS: DayButton[] = [
  { day: 'Lun', date: 12 },
  { day: 'Mar', date: 13 },
  { day: 'Mié', date: 14 },
  { day: 'Jue', date: 15 },
  { day: 'Vie', date: 16 },
  { day: 'Sáb', date: 17 },
  { day: 'Dom', date: 18 },
];

const MEALS: Meal[] = [
  {
    id: '1',
    name: 'Bowl de Avena & Proteína',
    time: '08:00 AM',
    image: 'https://via.placeholder.com/100',
    protein: 32,
    carbs: 45,
    fats: 0,
    completed: true,
  },
  {
    id: '2',
    name: 'Salmón con Espárragos',
    time: '13:30 PM',
    image: 'https://via.placeholder.com/100',
    protein: 40,
    carbs: 12,
    fats: 0,
    completed: false,
  },
  {
    id: '3',
    name: 'Yogurt Griego & Nueces',
    time: '17:00 PM',
    image: 'https://via.placeholder.com/100',
    protein: 20,
    carbs: 0,
    fats: 15,
    completed: false,
  },
];

const SHOPPING_ITEMS: ShoppingItem[] = [
  { id: '1', name: 'Salmón Fresco', quantity: '500g', category: 'Pescadería', icon: '🐟' },
  { id: '2', name: 'Espárragos Verdes', quantity: '2 manojos', category: 'Verdulería', icon: '🥦' },
  { id: '3', name: 'Yogurt Griego 0%', quantity: '1kg', category: 'Lácteos', icon: '🥛' },
  { id: '4', name: 'Nueces de California', quantity: '200g', category: 'Frutos Secos', icon: '🥜' },
];

const ComidasScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState(2);
  const [meals, setMeals] = useState<Meal[]>(MEALS);

  useEffect(() => {
    getProfile().then((p) => { if (p?.avatar_url) setAvatarUrl(p.avatar_url); });
  }, []);

  const toggleMealCompletion = (mealId: string) => {
    setMeals(prevMeals =>
      prevMeals.map(meal =>
        meal.id === mealId ? { ...meal, completed: !meal.completed } : meal
      )
    );
  };

  const renderDayButton = ({ item, index }: { item: DayButton; index: number }) => (
    <TouchableOpacity
      style={[
        styles.dayButton,
        index === selectedDay && styles.dayButtonActive,
      ]}
      onPress={() => setSelectedDay(index)}
    >
      <Text style={[
        styles.dayButtonLabel,
        index === selectedDay && styles.dayButtonLabelActive,
      ]}>
        {item.day}
      </Text>
      <Text style={[
        styles.dayButtonDate,
        index === selectedDay && styles.dayButtonDateActive,
      ]}>
        {item.date}
      </Text>
    </TouchableOpacity>
  );

  const renderMealCard = ({ item }: { item: Meal }) => (
    <View style={[styles.mealCard, item.completed && styles.mealCardCompleted]}>
      <Image
        source={{ uri: item.image }}
        style={styles.mealImage}
      />
      <View style={styles.mealContent}>
        <View style={styles.mealHeader}>
          <View style={styles.mealTitleSection}>
            <Text style={styles.mealTime}>{item.time}</Text>
            <Text style={styles.mealName}>{item.name}</Text>
          </View>
          <Switch
            value={item.completed}
            onValueChange={() => toggleMealCompletion(item.id)}
            trackColor={{ false: COLORS.surfaceHigh, true: COLORS.primary }}
            thumbColor={item.completed ? COLORS.primary : COLORS.text}
          />
        </View>
        <View style={styles.macroRow}>
          {item.protein > 0 && (
            <View style={styles.macroTag}>
              <Text style={styles.macroLabel}>Proteína</Text>
              <Text style={styles.macroValue}>{item.protein}g</Text>
            </View>
          )}
          {item.carbs > 0 && (
            <View style={styles.macroTag}>
              <Text style={styles.macroLabel}>Carbs</Text>
              <Text style={styles.macroValue}>{item.carbs}g</Text>
            </View>
          )}
          {item.fats > 0 && (
            <View style={styles.macroTag}>
              <Text style={styles.macroLabel}>Grasas</Text>
              <Text style={styles.macroValue}>{item.fats}g</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );

  const renderShoppingItem = ({ item }: { item: ShoppingItem }) => (
    <TouchableOpacity style={styles.shoppingItemCard}>
      <Text style={styles.shoppingIcon}>{item.icon}</Text>
      <View style={styles.shoppingItemContent}>
        <Text style={styles.shoppingItemName}>{item.name}</Text>
        <Text style={styles.shoppingItemCategory}>{item.quantity} - {item.category}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingTop: insets.top + HEADER_ROW_HEIGHT }}
      >
        {/* Day Scroller */}
        <View style={styles.dayScrollerContainer}>
          <FlatList
            data={DAYS}
            renderItem={renderDayButton}
            keyExtractor={(_, index) => index.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
          />
        </View>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>NUTRICIÓN</Text>
            <Text style={[styles.headerTitle, { color: COLORS.primary }]}>CONSCIENTE</Text>
            <View style={styles.headerMeta}>
              <Text style={styles.headerMetaLabel}>2,400 kcal</Text>
              <Text style={[styles.headerMetaLabel, { color: COLORS.textVariant }]}>Meta diaria</Text>
            </View>
          </View>
          <View style={styles.calorieRemaining}>
            <Text style={styles.remainingLabel}>Restantes</Text>
            <Text style={styles.remainingValue}>850</Text>
          </View>
        </View>

        {/* Meals */}
        <View style={styles.mealsContainer}>
          <FlatList
            data={meals}
            renderItem={renderMealCard}
            keyExtractor={item => item.id}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={styles.mealSpacer} />}
          />
        </View>

        {/* Shopping List */}
        <View style={styles.shoppingSection}>
          <View style={styles.shoppingHeader}>
            <Text style={styles.shoppingTitle}>LISTA DE COMPRAS</Text>
            <View style={styles.itemsCount}>
              <Text style={styles.itemsCountText}>12 items</Text>
            </View>
          </View>
          <View style={styles.shoppingGrid}>
            <FlatList
              data={SHOPPING_ITEMS}
              renderItem={renderShoppingItem}
              keyExtractor={item => item.id}
              numColumns={2}
              scrollEnabled={false}
              columnWrapperStyle={styles.shoppingGridRow}
            />
          </View>
          <TouchableOpacity style={styles.manageListButton}>
            <Text style={styles.manageListButtonText}>Gestionar Lista Completa</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacer} />
      </Animated.ScrollView>

      <AppProgressiveHeader
        scrollY={scrollY}
        topInset={insets.top}
        onHomePress={() => navigation.getParent()?.navigate('HomeStack', { screen: 'Inicio' })}
        onAvatarPress={() => navigation.getParent()?.navigate('HomeStack', { screen: 'Perfil' })}
        avatarUrl={avatarUrl}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  dayScrollerContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: `${COLORS.text}15`,
  },
  dayButton: {
    width: 56,
    height: 80,
    marginRight: 12,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: `${COLORS.text}0A`,
  },
  dayButtonActive: {
    backgroundColor: COLORS.primary,
  },
  dayButtonLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: `${COLORS.text}66`,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  dayButtonLabelActive: {
    color: '#000000',
  },
  dayButtonDate: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  dayButtonDateActive: {
    color: '#000000',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -1,
    lineHeight: 40,
  },
  headerMeta: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 16,
  },
  headerMetaLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.secondary,
    letterSpacing: 0.5,
  },
  headerLeft: {
    flex: 1,
    flexShrink: 1,
    marginRight: 12,
  },
  calorieRemaining: {
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  remainingLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textVariant,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  remainingValue: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
  },
  mealsContainer: {
    paddingHorizontal: 16,
    gap: 16,
  },
  mealCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: 16,
    gap: 16,
  },
  mealCardCompleted: {
    opacity: 0.6,
  },
  mealImage: {
    width: 96,
    height: 96,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceHigh,
  },
  mealContent: {
    flex: 1,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  mealTitleSection: {
    flex: 1,
  },
  mealTime: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.secondary,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  mealName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  macroRow: {
    flexDirection: 'row',
    gap: 12,
  },
  macroTag: {
    backgroundColor: COLORS.surfaceHigh,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  macroLabel: {
    fontSize: 8,
    fontWeight: '600',
    color: `${COLORS.text}80`,
    letterSpacing: 0.3,
  },
  macroValue: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 2,
  },
  mealSpacer: {
    height: 12,
  },
  shoppingSection: {
    marginTop: 32,
    marginHorizontal: 16,
    backgroundColor: COLORS.surfaceHigh,
    borderRadius: 8,
    padding: 24,
    marginBottom: 24,
  },
  shoppingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  shoppingTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  itemsCount: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  itemsCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: 0.5,
  },
  shoppingGrid: {
    marginBottom: 20,
  },
  shoppingGridRow: {
    gap: 12,
    marginBottom: 12,
  },
  shoppingItemCard: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: COLORS.bg,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    gap: 12,
  },
  shoppingIcon: {
    fontSize: 24,
  },
  shoppingItemContent: {
    flex: 1,
  },
  shoppingItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  shoppingItemCategory: {
    fontSize: 10,
    fontWeight: '500',
    color: COLORS.textVariant,
    letterSpacing: 0.3,
    marginTop: 2,
  },
  manageListButton: {
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: `${COLORS.text}1A`,
    borderRadius: 8,
    alignItems: 'center',
  },
  manageListButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 0.5,
  },
  bottomSpacer: {
    height: 32,
  },
});

export default ComidasScreen;
