import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  ImageBackground,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

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

interface Exercise {
  id: string;
  number: string;
  name: string;
  sets: number;
  reps: number;
  image: string;
}

const EXERCISES: Exercise[] = [
  {
    id: '1',
    number: '01',
    name: 'Press de Banca',
    sets: 4,
    reps: 10,
    image: 'https://via.placeholder.com/200x150?text=Press+de+Banca',
  },
  {
    id: '2',
    number: '02',
    name: 'Vuelos Laterales',
    sets: 3,
    reps: 15,
    image: 'https://via.placeholder.com/200x150?text=Vuelos+Laterales',
  },
  {
    id: '3',
    number: '03',
    name: 'Extensión Tríceps',
    sets: 3,
    reps: 12,
    image: 'https://via.placeholder.com/200x150?text=Extension+Triceps',
  },
  {
    id: '4',
    number: '04',
    name: '+ 5 Ejercicios más',
    sets: 0,
    reps: 0,
    image: '',
  },
];

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1574680178050-55a41cebbe7f?q=80&w=400';

export const DetalleEntrenamientoScreen: React.FC = () => {
  const renderExerciseCard = ({ item, index }: { item: Exercise; index: number }) => {
    if (index === 3) {
      return (
        <View style={styles.exercisePlaceholder}>
          <Text style={styles.placeholderText}>+ 5 Ejercicios más</Text>
        </View>
      );
    }

    return (
      <TouchableOpacity
        style={styles.exerciseCard}
        activeOpacity={0.7}
      >
        <Image
          source={{ uri: item.image }}
          style={styles.exerciseThumbnail}
        />
        <View style={styles.exerciseOverlay}>
          <Text style={styles.playIcon}>▶</Text>
        </View>

        <View style={styles.exerciseInfo}>
          <Text style={styles.exerciseNumber}>{item.number} / 08</Text>
          <Text style={styles.exerciseName}>{item.name}</Text>
          <Text style={styles.exerciseMeta}>
            {item.sets} Series x {item.reps} Reps
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
      >
        {/* Hero Section */}
        <View style={styles.heroContainer}>
          <Image
            source={{ uri: HERO_IMAGE }}
            style={styles.heroImage}
          />
          <LinearGradient
            colors={['transparent', colors.bg]}
            style={styles.heroGradient}
          />

          <View style={styles.heroContent}>
            <View style={styles.tagsRow}>
              <View style={styles.tag}>
                <Text style={styles.tagText}>Fuerza</Text>
              </View>
              <View style={styles.tagSecondary}>
                <Text style={styles.tagTextSecondary}>Día 12</Text>
              </View>
            </View>

            <Text style={styles.heroTitle}>Empuje Radical</Text>

            <View style={styles.heroMeta}>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Duración</Text>
                <Text style={styles.metaValue}>45 MIN</Text>
              </View>
              <View style={styles.metaDivider} />
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Ejercicios</Text>
                <Text style={styles.metaValue}>8 BLOQUES</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsSection}>
          <View style={styles.instructionCard}>
            <Text style={styles.instructionLabel}>Instrucciones de Sesión</Text>
            <Text style={styles.instructionText}>
              Mantén el foco en el <Text style={styles.instructionHighlight}>
                tempo controlada (3-1-1)
              </Text>
              . Descansa 60 segundos entre series. La hidratación debe ser
              constante pero en sorbos pequeños. Recuerda: la técnica precede a
              la carga.
            </Text>
          </View>
        </View>

        {/* Exercise List */}
        <View style={styles.exercisesSection}>
          <Text style={styles.sectionTitle}>Contenido del Entrenamiento</Text>

          <FlatList
            data={EXERCISES}
            renderItem={renderExerciseCard}
            keyExtractor={(item) => item.id}
            numColumns={2}
            scrollEnabled={false}
            columnWrapperStyle={styles.exerciseGrid}
            contentContainerStyle={styles.exercisesList}
          />
        </View>

        {/* Stats Cards */}
        <View style={styles.statsSection}>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🔥</Text>
            <Text style={styles.statValue}>340</Text>
            <Text style={styles.statLabel}>Kcal</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statIcon}>❤️</Text>
            <Text style={styles.statValue}>145</Text>
            <Text style={styles.statLabel}>BPM Med.</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🎯</Text>
            <Text style={styles.statValue}>ALTO</Text>
            <Text style={styles.statLabel}>Enfoque</Text>
          </View>
        </View>

        {/* Bottom Padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Fixed Button */}
      <View style={styles.fixedButtonContainer}>
        <TouchableOpacity
          style={styles.startButton}
          activeOpacity={0.85}
        >
          <Text style={styles.startButtonText}>Iniciar Entrenamiento</Text>
          <Text style={styles.playArrow}>▶</Text>
        </TouchableOpacity>
      </View>
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
  heroContainer: {
    position: 'relative',
    height: 397,
    backgroundColor: colors.surface,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.elevated,
  },
  heroGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  heroContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  tag: {
    backgroundColor: '#006875',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'white',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  tagSecondary: {
    backgroundColor: colors.elevated,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  tagTextSecondary: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  heroTitle: {
    fontSize: 48,
    fontWeight: '900',
    color: colors.primary,
    textTransform: 'uppercase',
    lineHeight: 48,
    marginBottom: 16,
    letterSpacing: -1,
  },
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  metaItem: {
    flexDirection: 'column',
  },
  metaLabel: {
    fontSize: 10,
    fontWeight: '400',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  metaDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(72, 72, 71, 0.3)',
  },
  instructionsSection: {
    paddingHorizontal: 24,
    marginTop: 32,
    marginBottom: 48,
  },
  instructionCard: {
    backgroundColor: colors.elevated,
    borderLeftWidth: 2,
    borderLeftColor: colors.primary,
    padding: 24,
    borderRadius: 8,
  },
  instructionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  instructionHighlight: {
    color: colors.secondary,
    fontWeight: '700',
  },
  exercisesSection: {
    paddingHorizontal: 24,
    marginBottom: 48,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 32,
  },
  exercisesList: {
    gap: 16,
  },
  exerciseGrid: {
    gap: 16,
  },
  exerciseCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 8,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  exerciseThumbnail: {
    width: 128,
    height: 96,
    backgroundColor: colors.elevated,
  },
  exerciseOverlay: {
    position: 'absolute',
    width: 128,
    height: 96,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  playIcon: {
    fontSize: 28,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  exerciseInfo: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  exerciseNumber: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    textTransform: 'uppercase',
    marginBottom: 4,
    lineHeight: 18,
  },
  exerciseMeta: {
    fontSize: 10,
    fontWeight: '400',
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  exercisePlaceholder: {
    flex: 1,
    backgroundColor: colors.elevated,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(72, 72, 71, 0.3)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 96,
  },
  placeholderText: {
    fontSize: 10,
    fontWeight: '400',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  statsSection: {
    paddingHorizontal: 24,
    marginBottom: 48,
    flexDirection: 'row',
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.elevated,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  statIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: 8,
    fontWeight: '400',
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  bottomPadding: {
    height: 120,
  },
  fixedButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingVertical: 24,
    backgroundColor: colors.bg,
  },
  startButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#000',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  playArrow: {
    fontSize: 18,
    color: '#000',
    fontWeight: 'bold',
  },
});
export default DetalleEntrenamientoScreen;
