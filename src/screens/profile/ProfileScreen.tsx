import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  Alert,
  AppState,
  AppStateStatus,
  Linking,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { getProfile, getMemberSinceYear, uploadAvatar, type UserProfile } from '../../services/profileService';
import { getMeasurementHistory, type BodyMeasurement } from '../../services/measurementsService';
import {
  getHealthStatus,
  requestHealthPermissions,
  getHealthSummaryToday,
  startHealthSync,
  stopHealthSync,
  healthStatusLabel,
  type HealthSummary,
  type HealthPermissions,
} from '../../services/healthService';
import { radius } from '../../theme/radius';

const { width } = Dimensions.get('window');

const BODY_IMAGES = {
  male:   require('../../../assets/male.png'),
  female: require('../../../assets/female.png'),
};

const COLORS = {
  bg:               '#0e0e0e',
  surface:          '#1a1a1a',
  surfaceHigh:      '#20201f',
  surfaceHighest:   '#262626',
  surfaceLow:       '#131313',
  surfaceLowest:    '#000000',
  primary:          '#D1FF26',
  primaryDim:       '#c1ed00',
  secondary:        '#00e3fd',
  tertiary:         '#ff734a',
  text:             '#ffffff',
  textVariant:      '#adaaaa',
  textDim:          'rgba(255,255,255,0.45)',
  borderLight:      'rgba(255,255,255,0.05)',
};

const QUICK_ACTIONS = [
  { label: 'AJUSTES',   icon: 'cog',           },
  { label: 'MENSAJES',  icon: 'message',        },
  { label: 'LLAMADA',   icon: 'phone',          },
  { label: 'COMPARTIR', icon: 'share-variant',  },
] as const;

const ProfileScreen: React.FC = () => {
  const insets            = useSafeAreaInsets();
  const logout            = useAuthStore((s) => s.logout);
  const setAvatarUrl      = useAuthStore((s) => s.setAvatarUrl);
  const setWatchConnected = useAuthStore((s) => s.setWatchConnected);
  const storeSteps        = useAuthStore((s) => s.steps);

  const [profile, setProfile]           = useState<UserProfile | null>(null);
  const [measurements, setMeasurements] = useState<BodyMeasurement | null>(null);
  const [memberYear, setMemberYear]     = useState('');
  const [loading, setLoading]           = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Health state
  const [healthPermission, setHealthPermission] = useState<HealthPermissions['steps']>('undetermined');
  const [healthData, setHealthData]   = useState<HealthSummary>({
    steps: null, heartRate: null, calories: null, lastSyncedAt: null,
  });
  const [healthLoading, setHealthLoading] = useState(false);

  /* ── Avatar ── */

  const handleChangeAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled || !result.assets[0]) return;

    setUploadingAvatar(true);
    const url = await uploadAvatar(result.assets[0].uri);
    setUploadingAvatar(false);

    if (url) {
      setProfile((prev) => prev ? { ...prev, avatar_url: url } : prev);
      setAvatarUrl(url); // sync to shared store → header updates on all tabs
    } else {
      Alert.alert('Error', 'No se pudo actualizar la foto. Intentá de nuevo.');
    }
  };

  /* ── Health sync ── */

  const initHealth = useCallback(async () => {
    const status = await getHealthStatus();
    const perm = status.permissions.steps;
    setHealthPermission(perm);

    if (perm === 'granted') {
      setWatchConnected(true);
      setHealthLoading(true);
      // Load HR and calories (steps come from the global sync in MainTabs)
      const summary = await getHealthSummaryToday();
      setHealthData((prev) => ({ ...prev, heartRate: summary.heartRate, calories: summary.calories, lastSyncedAt: summary.lastSyncedAt }));
      setHealthLoading(false);
    }
  }, [setWatchConnected]);

  const handleConnectAppleWatch = async () => {
    if (healthPermission === 'denied') {
      Alert.alert(
        'Acceso restringido',
        'Para ver tus pasos y actividad diaria, necesitamos permiso de Movimiento y actividad física.\n\nPodés habilitarlo en:\nAjustes → Privacidad y seguridad → Movimiento y actividad física → Método R3SET',
        [
          { text: 'Ahora no', style: 'cancel' },
          { text: 'Ir a Ajustes', onPress: () => Linking.openURL('app-settings:') },
        ],
      );
      return;
    }

    setHealthLoading(true);
    const status = await requestHealthPermissions();
    const perm = status.permissions.steps;
    setHealthPermission(perm);

    if (perm === 'granted') {
      setWatchConnected(true);
      const summary = await getHealthSummaryToday();
      setHealthData((prev) => ({ ...prev, heartRate: summary.heartRate, calories: summary.calories, lastSyncedAt: summary.lastSyncedAt }));
    } else {
      setWatchConnected(false);
    }
    setHealthLoading(false);
  };

  /* ── App state: re-sync steps when app comes to foreground ── */

  useEffect(() => {
    const sub = AppState.addEventListener('change', async (next: AppStateStatus) => {
      if (next === 'active' && healthPermission === 'granted') {
        const summary = await getHealthSummaryToday();
        setHealthData(summary);
      }
    });
    return () => sub.remove();
  }, [healthPermission]);

  /* ── Initial data load ── */

  useEffect(() => {
    (async () => {
      const [prof, history, year] = await Promise.all([
        getProfile(),
        getMeasurementHistory(1),
        getMemberSinceYear(),
      ]);
      setProfile(prof);
      setMeasurements(history[0] ?? null);
      setMemberYear(year);
      setLoading(false);
    })();

    initHealth();
  }, [initHealth]);

  /* ── Derived health display values ── */

  const watchStatusText  = healthStatusLabel(healthPermission);
  const watchIsConnected = healthPermission === 'granted';
  const watchIsDenied    = healthPermission === 'denied';

  const stepsDisplay    = storeSteps != null ? storeSteps.toLocaleString('es-AR') : '—';
  const hrDisplay       = healthData.heartRate != null ? `${healthData.heartRate}` : '—';
  const calDisplay      = healthData.calories  != null ? `${Math.round(healthData.calories)}` : '—';

  const lastSyncLabel = healthData.lastSyncedAt
    ? healthData.lastSyncedAt.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
      >
        {loading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 60 }} />
        ) : (<>

        {/* ── Profile Header ── */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarWrapper}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <MaterialCommunityIcons name="account" size={52} color={COLORS.textVariant} />
              </View>
            )}
            <TouchableOpacity style={styles.cameraBtn} onPress={handleChangeAvatar} disabled={uploadingAvatar}>
              {uploadingAvatar
                ? <ActivityIndicator size="small" color="#000" />
                : <MaterialCommunityIcons name="camera" size={13} color="#000" />
              }
            </TouchableOpacity>
          </View>
          <Text style={styles.profileName}>
            {profile?.full_name?.toUpperCase() ?? 'USUARIO'}
          </Text>
          <Text style={styles.profileLevel}>
            NIVEL {profile?.level?.toUpperCase() ?? '—'}{memberYear ? ` • MIEMBRO DESDE ${memberYear}` : ''}
          </Text>
        </View>

        {/* ── Quick Actions ── */}
        <View style={styles.actionsGrid}>
          {QUICK_ACTIONS.map((a) => (
            <TouchableOpacity key={a.label} style={styles.actionCard} activeOpacity={0.7}>
              <MaterialCommunityIcons name={a.icon as any} size={22} color={COLORS.primary} />
              <Text style={styles.actionLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Body Composition ── */}
        <View style={styles.compositionCard}>
          <View style={styles.silhouetteBox}>
            <Image
              source={BODY_IMAGES[measurements?.gender ?? 'male']}
              style={styles.silhouetteImage}
              resizeMode="contain"
            />
            <View style={[styles.dot, { top: '24%', left: '44%', backgroundColor: COLORS.primaryDim }]} />
            <View style={[styles.dot, { top: '34%', left: '60%', backgroundColor: COLORS.secondary   }]} />
            <View style={[styles.dot, { top: '40%', left: '46%', backgroundColor: COLORS.primaryDim }]} />
            <View style={[styles.dot, { top: '68%', left: '43%', backgroundColor: COLORS.secondary   }]} />
          </View>

          <Text style={styles.compositionTitle}>
            COMPOSICIÓN <Text style={{ color: COLORS.primaryDim }}>CORPORAL</Text>
          </Text>

          <View style={styles.metricsRow}>
            <View style={[styles.metricCell, { borderLeftColor: COLORS.primaryDim }]}>
              <Text style={styles.metricLabel}>PESO ACTUAL</Text>
              <View style={styles.metricValueRow}>
                <Text style={styles.metricValue}>
                  {measurements?.weight_kg != null ? measurements.weight_kg : '—'}
                </Text>
                <Text style={styles.metricUnit}>KG</Text>
              </View>
            </View>

            <View style={[styles.metricCell, { borderLeftColor: COLORS.secondary }]}>
              <Text style={styles.metricLabel}>GRASA CORP.</Text>
              <View style={styles.metricValueRow}>
                <Text style={styles.metricValue}>
                  {measurements?.body_fat_pct != null ? measurements.body_fat_pct : '—'}
                </Text>
                <Text style={styles.metricUnit}>%</Text>
              </View>
            </View>

            <View style={[styles.metricCell, { borderLeftColor: COLORS.text }]}>
              <Text style={styles.metricLabel}>CINTURA</Text>
              <View style={styles.metricValueRow}>
                <Text style={styles.metricValue}>
                  {measurements?.waist_cm != null ? measurements.waist_cm : '—'}
                </Text>
                <Text style={styles.metricUnit}>CM</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.updateBtn} activeOpacity={0.85}>
            <Text style={styles.updateBtnText}>ACTUALIZAR MEDIDAS</Text>
          </TouchableOpacity>
        </View>

        {/* ── Devices ── */}
        <View style={styles.devicesSection}>
          <Text style={styles.sectionLabel}>DISPOSITIVOS VINCULADOS</Text>

          {/* Apple Watch — real connection state */}
          <TouchableOpacity
            style={styles.deviceCard}
            activeOpacity={0.7}
            onPress={!watchIsConnected ? handleConnectAppleWatch : undefined}
            disabled={healthLoading}
          >
            <View style={styles.deviceLeft}>
              <View style={[
                styles.deviceIconBox,
                watchIsConnected && styles.deviceIconBoxActive,
              ]}>
                <MaterialCommunityIcons name="watch" size={20} color={watchIsConnected ? COLORS.primary : COLORS.text} />
              </View>
              <View>
                <Text style={styles.deviceName}>Apple Watch</Text>
                <Text style={[
                  styles.deviceStatus,
                  watchIsConnected && styles.deviceStatusConnected,
                  watchIsDenied   && styles.deviceStatusDenied,
                ]}>
                  {healthLoading ? 'SINCRONIZANDO…' : watchStatusText}
                </Text>
              </View>
            </View>
            {healthLoading ? (
              <ActivityIndicator size="small" color={COLORS.primaryDim} />
            ) : watchIsConnected ? (
              <MaterialCommunityIcons name="check-circle" size={20} color={COLORS.primaryDim} />
            ) : (
              <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.textDim} />
            )}
          </TouchableOpacity>

          {/* Fitbit */}
          <TouchableOpacity style={styles.deviceCard} activeOpacity={0.7}>
            <View style={styles.deviceLeft}>
              <View style={styles.deviceIconBox}>
                <MaterialCommunityIcons name="heart-pulse" size={20} color={COLORS.text} />
              </View>
              <View>
                <Text style={styles.deviceName}>Fitbit</Text>
                <Text style={styles.deviceStatus}>VINCULAR CUENTA</Text>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.textDim} />
          </TouchableOpacity>

          {/* Garmin */}
          <TouchableOpacity style={styles.deviceCard} activeOpacity={0.7}>
            <View style={styles.deviceLeft}>
              <View style={styles.deviceIconBox}>
                <MaterialCommunityIcons name="navigation" size={20} color={COLORS.text} />
              </View>
              <View>
                <Text style={styles.deviceName}>Garmin</Text>
                <Text style={styles.deviceStatus}>VINCULAR CUENTA</Text>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.textDim} />
          </TouchableOpacity>
        </View>

        {/* ── Apple Health Data Card ── */}
        {watchIsConnected && (
          <View style={styles.healthCard}>
            <View style={styles.healthCardHeader}>
              <View style={styles.healthCardTitleRow}>
                <MaterialCommunityIcons name="heart-pulse" size={16} color={COLORS.primary} />
                <Text style={styles.healthCardTitle}>APPLE HEALTH</Text>
              </View>
              {lastSyncLabel && (
                <Text style={styles.healthSyncTime}>Actualizado {lastSyncLabel}</Text>
              )}
            </View>

            <View style={styles.healthMetricsRow}>
              {/* Steps */}
              <View style={styles.healthMetric}>
                <MaterialCommunityIcons name="walk" size={22} color={COLORS.primaryDim} />
                <Text style={styles.healthMetricValue}>{stepsDisplay}</Text>
                <Text style={styles.healthMetricLabel}>PASOS</Text>
              </View>

              <View style={styles.healthMetricDivider} />

              {/* Heart rate */}
              <View style={styles.healthMetric}>
                <MaterialCommunityIcons name="heart" size={22} color={COLORS.tertiary} />
                <View style={styles.healthMetricValueRow}>
                  <Text style={[styles.healthMetricValue, healthData.heartRate == null && styles.healthMetricDim]}>
                    {hrDisplay}
                  </Text>
                  {healthData.heartRate != null && (
                    <Text style={styles.healthMetricUnit}>bpm</Text>
                  )}
                </View>
                <Text style={styles.healthMetricLabel}>FRECUENCIA</Text>
              </View>

              <View style={styles.healthMetricDivider} />

              {/* Calories */}
              <View style={styles.healthMetric}>
                <MaterialCommunityIcons name="fire" size={22} color={COLORS.secondary} />
                <View style={styles.healthMetricValueRow}>
                  <Text style={[styles.healthMetricValue, healthData.calories == null && styles.healthMetricDim]}>
                    {calDisplay}
                  </Text>
                  {healthData.calories != null && (
                    <Text style={styles.healthMetricUnit}>kcal</Text>
                  )}
                </View>
                <Text style={styles.healthMetricLabel}>CALORÍAS</Text>
              </View>
            </View>
          </View>
        )}

        {/* ── Current Plan ── */}
        {profile?.plan_name ? (
          <View style={styles.planCard}>
            <Text style={styles.planTitle}>PLAN ACTUAL</Text>
            <Text style={styles.planDesc}>{profile.plan_name}</Text>
            <View style={styles.planStats}>
              {profile.plan_duration_weeks && (
                <View style={styles.planStat}>
                  <Text style={styles.planStatLabel}>DURACIÓN</Text>
                  <Text style={styles.planStatValue}>{profile.plan_duration_weeks} Semanas</Text>
                </View>
              )}
              <View style={styles.planStat}>
                <Text style={styles.planStatLabel}>PROGRESO</Text>
                <Text style={styles.planStatValue}>
                  Semana {profile.plan_current_week}{profile.plan_duration_weeks ? `/${profile.plan_duration_weeks}` : ''}
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.planBtn} activeOpacity={0.85}>
              <Text style={styles.planBtnText}>VER DETALLES</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.planCard}>
            <View style={styles.noPlanBadge}>
              <MaterialCommunityIcons name="lightning-bolt" size={12} color="#000" />
              <Text style={styles.noPlanBadgeText}>SIN PLAN ACTIVO</Text>
            </View>
            <Text style={styles.planTitle}>POTENCIÁ TU{'\n'}RENDIMIENTO</Text>
            <Text style={styles.noPlanDesc}>
              Accedé a protocolos de entrenamiento, nutrición y recuperación diseñados para tu objetivo.
            </Text>
            <TouchableOpacity style={styles.planBtn} activeOpacity={0.85}>
              <MaterialCommunityIcons name="arrow-right" size={14} color={COLORS.primary} />
              <Text style={styles.planBtnText}>VER PLANES</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Logout ── */}
        <TouchableOpacity style={styles.logoutBtn} onPress={() => logout()} activeOpacity={0.7}>
          <MaterialCommunityIcons name="logout" size={16} color={COLORS.tertiary} />
          <Text style={styles.logoutText}>CERRAR SESIÓN</Text>
        </TouchableOpacity>

        </>)}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  scrollContent: { paddingHorizontal: 24, paddingTop: 32 },

  // Profile header
  profileHeader: { alignItems: 'center', marginBottom: 32 },
  avatarWrapper: { position: 'relative', marginBottom: 16 },
  avatar: {
    width: 120, height: 120, borderRadius: radius.panel,
    borderWidth: 2, borderColor: 'rgba(209,255,38,0.3)',
  },
  avatarPlaceholder: {
    backgroundColor: COLORS.surfaceHighest,
    justifyContent: 'center', alignItems: 'center',
  },
  cameraBtn: {
    position: 'absolute', bottom: 4, right: 4,
    width: 32, height: 32, borderRadius: radius.lg,
    backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  profileName: { fontSize: 36, fontWeight: '900', color: COLORS.text, letterSpacing: -0.5, marginBottom: 6 },
  profileLevel: { fontSize: 11, fontWeight: '700', color: COLORS.secondary, letterSpacing: 1.5, opacity: 0.8 },

  // Quick actions
  actionsGrid: {
    flexDirection: 'row',
    gap: 8, marginBottom: 28,
  },
  actionCard: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: COLORS.surfaceLow,
    borderRadius: radius.md,
    borderWidth: 1, borderColor: 'rgba(209,255,38,0.18)',
    justifyContent: 'center', alignItems: 'center', gap: 6,
  },
  actionLabel: { fontSize: 8, fontWeight: '700', color: COLORS.primary, letterSpacing: 1 },

  // Composition card
  compositionCard: {
    backgroundColor: COLORS.surfaceLowest,
    borderRadius: radius.lg, padding: 24,
    marginBottom: 28, overflow: 'hidden',
  },
  silhouetteBox: {
    height: 240, position: 'relative',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 20,
  },
  silhouetteImage: { width: '100%', height: '100%', opacity: 0.4 },
  dot: {
    position: 'absolute', width: 14, height: 14, borderRadius: radius.avatarTight,
    shadowColor: COLORS.primary, shadowOpacity: 0.6, shadowRadius: 8,
  },
  compositionTitle: {
    fontSize: 22, fontWeight: '900', color: COLORS.text,
    letterSpacing: -0.5, lineHeight: 28, marginBottom: 14,
  },
  metricsRow: {
    flexDirection: 'row', gap: 8, marginBottom: 10,
  },
  metricCell: {
    flex: 1,
    paddingHorizontal: 10, paddingVertical: 10,
    backgroundColor: COLORS.surfaceHigh,
    borderRadius: radius.sm, borderLeftWidth: 2,
  },
  metricLabel: { fontSize: 8, fontWeight: '700', color: COLORS.textVariant, letterSpacing: 1, marginBottom: 4 },
  metricValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 3 },
  metricValue: { fontSize: 22, fontWeight: '700', color: COLORS.text },
  metricUnit: { fontSize: 10, color: COLORS.textDim, fontWeight: '600' },
  updateBtn: {
    marginTop: 8, paddingVertical: 14,
    backgroundColor: COLORS.primary, borderRadius: radius.input, alignItems: 'center',
  },
  updateBtnText: { fontSize: 12, fontWeight: '700', color: '#000', letterSpacing: 1.5 },

  // Devices
  devicesSection: { marginBottom: 28 },
  sectionLabel: { fontSize: 9, fontWeight: '700', color: COLORS.textDim, letterSpacing: 3, marginBottom: 14 },
  deviceCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 16,
    backgroundColor: COLORS.surface, borderRadius: radius.md, marginBottom: 10,
  },
  deviceLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  deviceIconBox: {
    width: 40, height: 40, borderRadius: radius.sm,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center', alignItems: 'center',
  },
  deviceIconBoxActive: {
    backgroundColor: 'rgba(209,255,38,0.12)',
  },
  deviceName: { fontSize: 13, fontWeight: '700', color: COLORS.text, marginBottom: 2 },
  deviceStatus: { fontSize: 9, fontWeight: '700', color: COLORS.textDim, letterSpacing: 1 },
  deviceStatusConnected: { color: COLORS.secondary },
  deviceStatusDenied:    { color: COLORS.tertiary },

  // Apple Health data card
  healthCard: {
    backgroundColor: COLORS.surface,
    borderRadius: radius.lg, padding: 20,
    marginBottom: 28,
    borderWidth: 1, borderColor: 'rgba(209,255,38,0.12)',
  },
  healthCardHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 20,
  },
  healthCardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  healthCardTitle: { fontSize: 11, fontWeight: '700', color: COLORS.primary, letterSpacing: 2 },
  healthSyncTime: { fontSize: 9, color: COLORS.textDim, letterSpacing: 0.5 },
  healthMetricsRow: {
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
  },
  healthMetric: { flex: 1, alignItems: 'center', gap: 6 },
  healthMetricDivider: {
    width: 1, height: 48,
    backgroundColor: COLORS.borderLight,
  },
  healthMetricValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 3 },
  healthMetricValue: { fontSize: 22, fontWeight: '700', color: COLORS.text },
  healthMetricDim: { color: COLORS.textDim },
  healthMetricUnit: { fontSize: 10, color: COLORS.textDim, fontWeight: '600' },
  healthMetricLabel: { fontSize: 8, fontWeight: '700', color: COLORS.textVariant, letterSpacing: 1.5 },

  // Plan card
  planCard: {
    backgroundColor: COLORS.primary,
    borderRadius: radius.lg, padding: 28,
    marginBottom: 24, overflow: 'hidden',
  },
  planTitle: { fontSize: 28, fontWeight: '900', color: '#000', letterSpacing: -0.5, fontStyle: 'italic', marginBottom: 8 },
  planDesc: { fontSize: 14, fontWeight: '700', color: '#000', marginBottom: 20, lineHeight: 20 },
  planStats: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  planStat: {
    paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: radius.sm,
  },
  planStatLabel: { fontSize: 8, fontWeight: '700', color: 'rgba(0,0,0,0.5)', letterSpacing: 1, marginBottom: 2 },
  planStatValue: { fontSize: 13, fontWeight: '700', color: '#000' },
  planBtn: {
    paddingVertical: 14, paddingHorizontal: 28,
    backgroundColor: '#000', borderRadius: radius.input, alignSelf: 'flex-start',
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  planBtnText: { fontSize: 11, fontWeight: '700', color: COLORS.primary, letterSpacing: 1.5 },
  noPlanBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(0,0,0,0.2)', alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.xl, marginBottom: 14,
  },
  noPlanBadgeText: { fontSize: 9, fontWeight: '700', color: '#000', letterSpacing: 1.5 },
  noPlanDesc: { fontSize: 13, color: 'rgba(0,0,0,0.7)', lineHeight: 20, marginBottom: 20 },

  // Logout
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 16,
    borderWidth: 1, borderColor: COLORS.tertiary, borderRadius: radius.md,
    marginBottom: 16,
  },
  logoutText: { fontSize: 12, fontWeight: '700', color: COLORS.tertiary, letterSpacing: 1.5 },
});

export default ProfileScreen;
