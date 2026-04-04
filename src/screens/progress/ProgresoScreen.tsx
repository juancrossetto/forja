import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ImageBackground,
} from 'react-native';

const { width } = Dimensions.get('window');

const COLORS = {
  bg: '#0e0e0e',
  surface: '#1a1a1a',
  surfaceHigh: '#20201f',
  surfaceHighest: '#262626',
  primary: '#D1FF26',
  primaryDim: '#c1ed00',
  secondary: '#00e3fd',
  secondaryDim: '#00d4ec',
  tertiary: '#ff734a',
  tertiaryFixed: '#ff9475',
  text: '#ffffff',
  textVariant: '#adaaaa',
  errorDim: '#d53d18',
};

const ProgresoScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerSubtitle}>Metrics & Analytics</Text>
          <View>
            <Text style={styles.headerTitle}>PROGRESO</Text>
            <Text style={[styles.headerTitle, { color: COLORS.secondary }]}>
              ESTADÍSTICO
            </Text>
          </View>
          <View style={styles.headerDivider} />
        </View>

        {/* Bento Grid */}
        <View style={styles.bentoGrid}>
          {/* Large: Body Weight */}
          <View style={[styles.gridItem, styles.gridLarge]}>
            <View style={styles.cardContent}>
              <Text style={styles.largeLabelIcon}>⚖️</Text>
              <Text style={styles.cardTitle}>Body Weight</Text>
              <View style={styles.largeValueContainer}>
                <Text style={styles.largeValue}>74.2</Text>
                <Text style={styles.largeUnit}>KG</Text>
              </View>
            </View>
            {/* Sparkline */}
            <View style={styles.sparklineContainer}>
              <View style={[styles.sparklineBar, { height: '60%' }]} />
              <View style={[styles.sparklineBar, { height: '55%' }]} />
              <View style={[styles.sparklineBar, { height: '65%' }]} />
              <View style={[styles.sparklineBar, { height: '70%' }]} />
              <View style={[styles.sparklineBar, { height: '62%', opacity: 0.6 }]} />
              <View style={[styles.sparklineBar, { height: '45%', opacity: 0.4 }]} />
            </View>
          </View>

          {/* Steps Today */}
          <View
            style={[
              styles.gridItem,
              styles.gridMedium,
              {
                backgroundColor: COLORS.surfaceHighest,
                borderLeftWidth: 4,
                borderLeftColor: COLORS.secondary,
              },
            ]}
          >
            <Text style={styles.cardTitle}>Steps Today</Text>
            <Text style={styles.cardValue}>12,482</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '82%' }]} />
            </View>
            <Text style={styles.progressLabel}>82% GOAL</Text>
          </View>

          {/* Photos Gallery */}
          <ImageBackground
            source={{
              uri: 'https://via.placeholder.com/300x300',
            }}
            style={[styles.gridItem, styles.gridLarge]}
            imageStyle={{ opacity: 0.5 }}
          >
            <View style={styles.photoOverlay} />
            <View style={styles.photoContent}>
              <Text style={styles.photoLabel}>Evolution Gallery</Text>
              <Text style={styles.photoTitle}>Última Foto</Text>
              <View style={styles.photoDate}>
                <Text style={styles.photoDateIcon}>📅</Text>
                <Text style={styles.photoDateText}>24 OCT, 2023</Text>
              </View>
            </View>
          </ImageBackground>

          {/* Sleep Quality */}
          <View style={[styles.gridItem, styles.gridMedium]}>
            <View style={styles.sleepHeader}>
              <Text style={styles.cardTitle}>Sleep Quality</Text>
              <Text style={styles.sleepIcon}>😴</Text>
            </View>
            <Text style={styles.cardValue}>7h 45m</Text>
            <View style={styles.sleepBars}>
              <View style={styles.sleepBar} />
              <View style={styles.sleepBar} />
              <View style={styles.sleepBar} />
              <View style={[styles.sleepBar, { opacity: 0.2 }]} />
            </View>
          </View>

          {/* Caloric Intake */}
          <View style={[styles.gridItem, styles.gridMedium]}>
            <Text style={styles.cardTitle}>Caloric Intake</Text>
            <View style={styles.caloricContent}>
              <Text style={styles.caloricValue}>2,150</Text>
              <View style={styles.caloricRemaining}>
                <Text style={styles.caloricRemainingLabel}>Remaining</Text>
                <Text style={[styles.caloricRemainingValue, { color: COLORS.secondary }]}>
                  450 KCAL
                </Text>
              </View>
            </View>
          </View>

          {/* Active Burn */}
          <View style={[styles.gridItem, styles.gridMedium]}>
            <Text style={styles.cardTitle}>Active Burn</Text>
            <View style={styles.burnContent}>
              <View style={styles.burnIcon}>
                <Text style={styles.burnIconText}>🔥</Text>
              </View>
              <View>
                <Text style={styles.cardValue}>842</Text>
                <Text style={styles.burnUnit}>KCAL</Text>
              </View>
            </View>
          </View>

          {/* Body Fat % */}
          <View
            style={[
              styles.gridItem,
              styles.gridMedium,
              { backgroundColor: COLORS.surfaceHighest },
            ]}
          >
            <Text style={styles.cardTitle}>Body Fat %</Text>
            <View style={styles.bodyFatContent}>
              <Text style={[styles.largeValue, { color: COLORS.tertiary }]}>
                14.2%
              </Text>
              <Text style={[styles.bodyFatChange, { color: COLORS.errorDim }]}>
                -0.4% WK
              </Text>
            </View>
          </View>

          {/* Blood Pressure */}
          <View style={[styles.gridItem, styles.gridMedium]}>
            <Text style={styles.cardTitle}>Blood Pressure</Text>
            <View style={styles.bpContent}>
              <Text style={styles.cardValue}>118/76</Text>
              <View style={styles.bpStatus}>
                <Text style={styles.bpStatusText}>OPTIMAL</Text>
              </View>
            </View>
            <View style={styles.bpChart}>
              <View style={[styles.bpBar, { height: 16 }]} />
              <View style={[styles.bpBar, { height: 20 }]} />
              <View style={[styles.bpBar, { height: 12 }]} />
              <View style={[styles.bpBar, { height: 24 }]} />
              <View style={[styles.bpBar, { height: 16, opacity: 1 }]} />
            </View>
          </View>

          {/* Lean Body Mass */}
          <View style={[styles.gridItem, styles.gridMedium]}>
            <Text style={styles.cardTitle}>Lean Body Mass</Text>
            <View style={styles.lbmContent}>
              <View style={styles.lbmValue}>
                <Text style={styles.largeValue}>63.8</Text>
                <Text style={styles.lbmUnit}>KG</Text>
              </View>
              <Text style={[styles.lbmGain, { color: COLORS.primaryDim }]}>
                +1.2 KG EST. GAIN
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* FABs */}
      <View style={styles.fabContainer}>
        <TouchableOpacity style={styles.fab}>
          <Text style={styles.fabIcon}>📷</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.fabPrimary}>
          <Text style={styles.fabPrimaryIcon}>➕</Text>
          <Text style={styles.fabPrimaryText}>Registrar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.primaryDim,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 48,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -1,
    lineHeight: 52,
  },
  headerDivider: {
    height: 2,
    width: 24,
    backgroundColor: COLORS.primaryDim,
    marginTop: 8,
  },
  bentoGrid: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridItem: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    justifyContent: 'space-between',
  },
  gridLarge: {
    width: `${(width - 48) * 0.48}%`,
    height: 280,
  },
  gridMedium: {
    width: `${(width - 48) * 0.48}%`,
    height: 140,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textVariant,
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  cardValue: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
  },
  cardUnit: {
    fontSize: 12,
    color: COLORS.textVariant,
    marginLeft: 4,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 8,
  },
  largeLabelIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  largeValue: {
    fontSize: 56,
    fontWeight: '700',
    color: COLORS.text,
    lineHeight: 60,
  },
  largeUnit: {
    fontSize: 12,
    color: COLORS.textVariant,
    marginLeft: 8,
  },
  largeValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 8,
  },
  sparklineContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    marginTop: 16,
    height: 80,
  },
  sparklineBar: {
    flex: 1,
    backgroundColor: COLORS.primaryDim,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    opacity: 0.4,
  },
  progressBar: {
    height: 4,
    backgroundColor: `${COLORS.text}15`,
    borderRadius: 2,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.secondary,
    borderRadius: 2,
  },
  progressLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.secondary,
    marginTop: 8,
  },
  photoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
  },
  photoContent: {
    justifyContent: 'flex-end',
    paddingBottom: 16,
  },
  photoLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: `${COLORS.text}B3`,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  photoTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  photoDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  photoDateIcon: {
    fontSize: 12,
  },
  photoDateText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.primaryDim,
  },
  sleepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sleepIcon: {
    fontSize: 20,
  },
  sleepBars: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 12,
  },
  sleepBar: {
    flex: 1,
    height: 3,
    backgroundColor: COLORS.tertiary,
    borderRadius: 1.5,
  },
  caloricContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 12,
  },
  caloricValue: {
    fontSize: 28,
    fontWeight: '700',
    fontStyle: 'italic',
    color: COLORS.text,
  },
  caloricRemaining: {
    alignItems: 'flex-end',
  },
  caloricRemainingLabel: {
    fontSize: 10,
    color: COLORS.textVariant,
    letterSpacing: 0.3,
  },
  caloricRemainingValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  burnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
  },
  burnIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: COLORS.primaryDim,
    justifyContent: 'center',
    alignItems: 'center',
  },
  burnIconText: {
    fontSize: 24,
  },
  burnUnit: {
    fontSize: 10,
    color: COLORS.textVariant,
    marginLeft: 4,
  },
  bodyFatContent: {
    flexDirection: 'column',
    marginTop: 8,
  },
  bodyFatChange: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  bpContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  bpStatus: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bpStatusText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#000000',
  },
  bpChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    marginTop: 8,
  },
  bpBar: {
    flex: 1,
    backgroundColor: COLORS.secondary,
    borderRadius: 2,
    opacity: 0.3,
  },
  lbmContent: {
    marginTop: 8,
  },
  lbmValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  lbmUnit: {
    fontSize: 10,
    color: COLORS.textVariant,
    marginLeft: 4,
    fontStyle: 'italic',
  },
  lbmGain: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
    marginTop: 4,
  },
  bottomSpacer: {
    height: 120,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 100,
    right: 16,
    gap: 12,
    alignItems: 'flex-end',
  },
  fab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.surfaceHighest,
    borderWidth: 1,
    borderColor: `${COLORS.text}1A`,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  fabIcon: {
    fontSize: 24,
  },
  fabPrimary: {
    height: 56,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  fabPrimaryIcon: {
    fontSize: 20,
    color: '#000000',
  },
  fabPrimaryText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: 0.5,
  },
});

export default ProgresoScreen;
