import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
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

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?q=80&w=600';

export const EntrenamientoEnVivoScreen: React.FC = () => {
  const [timeRemaining, setTimeRemaining] = useState(44);
  const [isPlaying, setIsPlaying] = useState(true);
  const totalTime = 90;
  const completionPercentage = (((totalTime - timeRemaining) / totalTime) * 100);

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying]);

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  return (
    <View style={styles.container}>
      {/* Video Canvas */}
      <ImageBackground
        source={{ uri: HERO_IMAGE }}
        style={styles.videoCanvas}
        imageStyle={styles.videoImage}
      >
        <LinearGradient
          colors={['transparent', colors.bg]}
          style={styles.videoGradient}
        />

        {/* Current Exercise Label */}
        <View style={styles.exerciseLabel}>
          <Text style={styles.exerciseLabelText}>Current Exercise</Text>
          <Text style={styles.exerciseName}>KETTLEBELL SWINGS</Text>
          <View style={styles.exerciseTags}>
            <View style={styles.exerciseTag}>
              <Text style={styles.exerciseTagText}>32 KG</Text>
            </View>
            <View style={styles.roundTag}>
              <Text style={styles.roundTagText}>Round 2/4</Text>
            </View>
          </View>
        </View>
      </ImageBackground>

      {/* Metrics Dashboard */}
      <View style={styles.metricsContainer}>
        {/* Progress Bar */}
        <View style={styles.progressBarWrapper}>
          <View style={styles.progressBar}>
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressFill, { width: `${completionPercentage}%` }]}
            />
          </View>
        </View>

        {/* Timer Card */}
        <View style={styles.timerCard}>
          <Text style={styles.timerLabel}>Duration remaining</Text>
          <Text style={styles.timerDisplay}>
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </Text>

          {/* Timeline */}
          <View style={styles.timeline}>
            <Text style={styles.timelineStart}>00:00</Text>
            <View style={styles.timelineBar}>
              <View
                style={[
                  styles.timelinePointer,
                  { left: `${completionPercentage}%` },
                ]}
              />
            </View>
            <Text style={styles.timelineEnd}>01:30</Text>
          </View>
        </View>

        {/* Metrics Grid */}
        <View style={styles.metricsGrid}>
          {/* Workout Finish */}
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Workout Finish</Text>
            <Text style={styles.metricValue}>14:20</Text>
            <View style={styles.metricFooter}>
              <Text style={styles.metricFooterText}>LEFT</Text>
            </View>
          </View>

          {/* Completion */}
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Completion</Text>
            <Text style={styles.metricValue}>62%</Text>
            <View style={styles.metricFooter}>
              <Text style={styles.metricFooterText}>DONE</Text>
            </View>
          </View>
        </View>

        {/* Next Exercise */}
        <TouchableOpacity style={styles.nextExercise} activeOpacity={0.8}>
          <View style={styles.nextExerciseImage}>
            <Image
              source={{ uri: 'https://via.placeholder.com/56x56?text=Stretch' }}
              style={styles.nextImage}
            />
          </View>
          <View style={styles.nextExerciseInfo}>
            <Text style={styles.nextLabel}>Next</Text>
            <Text style={styles.nextExerciseName}>Pigeon Stretch</Text>
          </View>
          <Text style={styles.nextArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Control Bar */}
      <View style={styles.controlBar}>
        {/* Back */}
        <TouchableOpacity style={styles.controlButton} activeOpacity={0.7}>
          <Text style={styles.controlIcon}>⏪</Text>
          <Text style={styles.controlLabel}>BACK</Text>
        </TouchableOpacity>

        {/* Lock */}
        <TouchableOpacity style={styles.controlButton} activeOpacity={0.7}>
          <Text style={styles.controlIcon}>🔒</Text>
          <Text style={styles.controlLabel}>LOCK</Text>
        </TouchableOpacity>

        {/* Play/Pause (Floating Center) */}
        <TouchableOpacity
          style={styles.playButton}
          onPress={() => setIsPlaying(!isPlaying)}
          activeOpacity={0.85}
        >
          <Text style={styles.playIcon}>
            {isPlaying ? '⏸' : '▶'}
          </Text>
        </TouchableOpacity>

        {/* Stop */}
        <TouchableOpacity style={styles.controlButton} activeOpacity={0.7}>
          <Text style={styles.controlIcon}>⏹</Text>
          <Text style={styles.controlLabel}>STOP</Text>
        </TouchableOpacity>

        {/* Skip */}
        <TouchableOpacity style={styles.controlButton} activeOpacity={0.7}>
          <Text style={styles.controlIcon}>⏭</Text>
          <Text style={styles.controlLabel}>NEXT</Text>
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
  videoCanvas: {
    flex: 1,
    position: 'relative',
    backgroundColor: colors.elevated,
  },
  videoImage: {
    backgroundColor: colors.elevated,
  },
  videoGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
  },
  exerciseLabel: {
    position: 'absolute',
    top: 24,
    left: 24,
    zIndex: 10,
  },
  exerciseLabelText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  exerciseName: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
    textTransform: 'uppercase',
    lineHeight: 32,
    marginBottom: 8,
  },
  exerciseTags: {
    flexDirection: 'row',
    gap: 8,
  },
  exerciseTag: {
    backgroundColor: 'rgba(0, 227, 253, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  exerciseTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.secondary,
    textTransform: 'uppercase',
  },
  roundTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  roundTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  metricsContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 120,
    gap: 16,
  },
  progressBarWrapper: {
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  timerCard: {
    backgroundColor: colors.elevated,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  timerLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.4)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  timerDisplay: {
    fontSize: 72,
    fontWeight: '900',
    color: colors.primary,
    lineHeight: 72,
    marginBottom: 16,
    letterSpacing: -2,
    textShadowColor: `${colors.primary}40`,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  timeline: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  timelineStart: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.2)',
  },
  timelineBar: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 1,
    position: 'relative',
  },
  timelinePointer: {
    width: 8,
    height: 8,
    backgroundColor: colors.primary,
    borderRadius: 4,
    position: 'absolute',
    top: -3,
  },
  timelineEnd: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.2)',
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  metricCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.4)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  metricFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricFooterText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
  },
  nextExercise: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(20px)',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  nextExerciseImage: {
    width: 56,
    height: 56,
    backgroundColor: colors.bg,
    borderRadius: 6,
    overflow: 'hidden',
  },
  nextImage: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.elevated,
  },
  nextExerciseInfo: {
    flex: 1,
  },
  nextLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nextExerciseName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    textTransform: 'uppercase',
  },
  nextArrow: {
    fontSize: 20,
    color: colors.textSecondary,
  },
  controlBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 20,
    backgroundColor: 'rgba(14, 14, 14, 0.8)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  controlButton: {
    alignItems: 'center',
    gap: 4,
  },
  controlIcon: {
    fontSize: 28,
    color: colors.textSecondary,
  },
  controlLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  playIcon: {
    fontSize: 32,
    color: '#000',
    fontWeight: 'bold',
  },
});
export default EntrenamientoEnVivoScreen;
