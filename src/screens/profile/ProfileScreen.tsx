import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const COLORS = {
  bg: '#0e0e0e',
  surface: '#1a1a1a',
  surfaceHigh: '#20201f',
  surfaceHighest: '#262626',
  surfaceLow: '#131313',
  surfaceLowest: '#000000',
  primary: '#D1FF26',
  primaryDim: '#c1ed00',
  secondary: '#00e3fd',
  tertiary: '#ff734a',
  textPrimary: '#FFF',
  textSecondary: 'rgba(255,255,255,0.70)',
  textTertiary: 'rgba(255,255,255,0.45)',
  borderLight: 'rgba(255,255,255,0.05)',
};

interface Device {
  name: string;
  icon: string;
  status: 'connected' | 'pending';
  statusText: string;
}

const ProfileScreen: React.FC = () => {
  const devices: Device[] = [
    { name: 'Apple Watch', icon: 'watch', status: 'connected', statusText: 'Conectado' },
    { name: 'Fitbit', icon: 'heart-pulse', status: 'pending', statusText: 'Vincular cuenta' },
    { name: 'Garmin', icon: 'navigation', status: 'pending', statusText: 'Vincular cuenta' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity>
          <MaterialCommunityIcons name="menu" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>MÉTODO R3SET</Text>
        <TouchableOpacity>
          <Image
            source={{
              uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAGpBqIxkUjq5DxlCaibXFQg3owN-fPKESibk_P9KaNliXJKbJUtQKfMkebf45EVzg0649JQYuyOTrPjwsP-8HebbW0AD3Z2jZ5mKyPTFiZ3ZzGeSm_pToJHbbU94lP7SLz1FGPiBpvy_tdQm1tqlw51VBu9RiUNhEwdJhje_7wp5sjGT9NC3AiHqojgrJLyuVDOJZItnPDFwJ7ps-9yQS2acOx-VQigYKQ0R_69dFWwa_jGix5dMrf7Wc7XhCzGV4VetnSJXezgsNR',
            }}
            style={styles.headerAvatar}
          />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} scrollIndicatorInsets={{ bottom: 80 }}>
        {/* Profile Header Section */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Image
              source={{
                uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA24FIP9xG9RtmzbgJ5j6jIB2Dg3t-sBlHcTDElFK5D5vgUSZBUm6OuAYdyN6XkHMB4WcbaDGZv7SNvnVFLkHXyxHvWvqybBbTF-8t2GbM_IPc1_PdaXhDEX9FO49FKf2hrDHQexSrrWybOFfpuzZSFk3eqUB52-SSXSQT-DMYAjQ-MfMFfmE-8jNWaj2u6wj47LXcqQE-BFPHhXoUyYEXJf-YJCPllRaa2B1R3Sp9UOiLywkXGmL36fScIkj1tTvrW5QKk2y0ysuWi',
              }}
              style={styles.profileAvatar}
            />
            <TouchableOpacity style={styles.cameraButton}>
              <MaterialCommunityIcons name="camera" size={14} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>VALENTINA R.</Text>
            <Text style={styles.profileLevel}>Nivel Pro • Miembro desde 2023</Text>
          </View>
        </View>

        {/* Quick Actions Grid */}
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity style={styles.actionButton}>
            <MaterialCommunityIcons name="analytics" size={28} color={COLORS.primaryDim} />
            <Text style={styles.actionButtonText}>Estadísticas</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <MaterialCommunityIcons name="chat-bubble" size={28} color={COLORS.secondary} />
            <Text style={styles.actionButtonText}>Mensajes</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <MaterialCommunityIcons name="phone" size={28} color={COLORS.tertiary} />
            <Text style={styles.actionButtonText}>Llamada</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <MaterialCommunityIcons name="share-variant" size={28} color={COLORS.textPrimary} />
            <Text style={styles.actionButtonText}>Compartir</Text>
          </TouchableOpacity>
        </View>

        {/* Body Composition Section */}
        <View style={styles.compositionContainer}>
          <View style={styles.compositionImageSection}>
            <Image
              source={{
                uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCWHXsYXnDZ8d83QuAQtF3p01zCCyADhIWspMTj2Lu0H4IoR1nUV4_G6b8NNgrhk7gfh5XxArX8cyswqK1MY09uX2FXoFAVeNDyTkI3Gbkt6tng7sJA16P9rkpC6fUJKDYLoBAcbh7scfGV14lBARtFwB2meJZbzEXul0Wk7_4pBpHfwUbSDUv67cZugrjX1nyo7GSqfsEmmJKmL5EDUD0f-u0jn50BcfqecqhlLD7fBQEEx-KM36GVX0-jrHI30gm2JuY-2Kh6XNun',
              }}
              style={styles.compositionImage}
            />
            {/* Selection Points */}
            <View style={[styles.selectionPoint, { top: '25%', left: '30%' }]}>
              <View style={[styles.selectionDot, { backgroundColor: COLORS.primaryDim }]} />
            </View>
            <View style={[styles.selectionPoint, { top: '35%', left: '50%' }]}>
              <View style={[styles.selectionDot, { backgroundColor: COLORS.secondary }]} />
            </View>
            <View style={[styles.selectionPoint, { top: '45%', left: '50%' }]}>
              <View style={[styles.selectionDot, { backgroundColor: COLORS.primaryDim }]} />
            </View>
            <View style={[styles.selectionPoint, { top: '65%', left: '40%' }]}>
              <View style={[styles.selectionDot, { backgroundColor: COLORS.secondary }]} />
            </View>
          </View>

          <View style={styles.compositionMetrics}>
            <Text style={styles.compositionTitle}>
              Composición <Text style={{ color: COLORS.primaryDim }}>Corporal</Text>
            </Text>

            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>PESO ACTUAL</Text>
              <View style={styles.metricValue}>
                <Text style={styles.metricValueMain}>68.5</Text>
                <Text style={styles.metricValueUnit}>KG</Text>
              </View>
            </View>

            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>GRASA CORPORAL</Text>
              <View style={styles.metricValue}>
                <Text style={styles.metricValueMain}>18.2</Text>
                <Text style={styles.metricValueUnit}>%</Text>
              </View>
            </View>

            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>CINTURA</Text>
              <View style={styles.metricValue}>
                <Text style={styles.metricValueMain}>72</Text>
                <Text style={styles.metricValueUnit}>CM</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.updateButton}>
              <Text style={styles.updateButtonText}>ACTUALIZAR MEDIDAS</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Connected Devices Section */}
        <View style={styles.devicesSection}>
          <Text style={styles.devicesSectionTitle}>DISPOSITIVOS VINCULADOS</Text>
          {devices.map((device, index) => (
            <TouchableOpacity key={index} style={styles.deviceCard}>
              <View style={styles.deviceInfo}>
                <View style={styles.deviceIconContainer}>
                  <MaterialCommunityIcons name={device.icon} size={20} color={COLORS.textPrimary} />
                </View>
                <View style={styles.deviceTextContainer}>
                  <Text style={styles.deviceName}>{device.name}</Text>
                  <Text
                    style={[
                      styles.deviceStatus,
                      device.status === 'connected' && styles.deviceStatusConnected,
                    ]}
                  >
                    {device.statusText}
                  </Text>
                </View>
              </View>
              {device.status === 'connected' ? (
                <MaterialCommunityIcons name="check-circle" size={20} color={COLORS.primaryDim} />
              ) : (
                <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.textTertiary} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Current Plan Section */}
        <View style={styles.planSection}>
          <View style={styles.planContent}>
            <Text style={styles.planTitle}>Plan Actual</Text>
            <Text style={styles.planDescription}>
              Protocolo Hipertrofia Pro: Fase 2 - Recomposición Metabólica
            </Text>
            <View style={styles.planStats}>
              <View style={styles.planStat}>
                <Text style={styles.planStatLabel}>Duración</Text>
                <Text style={styles.planStatValue}>12 Semanas</Text>
              </View>
              <View style={styles.planStat}>
                <Text style={styles.planStatLabel}>Progreso</Text>
                <Text style={styles.planStatValue}>Semana 5/12</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity style={styles.planButton}>
            <Text style={styles.planButtonText}>Ver Detalles</Text>
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton}>
          <MaterialCommunityIcons name="logout" size={18} color={COLORS.tertiary} />
          <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Action Buttons */}
      <View style={styles.fabContainer}>
        <TouchableOpacity style={styles.fabSecondary}>
          <MaterialCommunityIcons name="email" size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.fabPrimary}>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 1.5,
    flex: 1,
    textAlign: 'center',
  },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 24,
    paddingVertical: 32,
    gap: 24,
  },
  avatarContainer: {
    position: 'relative',
  },
  profileAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: 'rgba(209, 255, 38, 0.3)',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  profileInfo: {
    flex: 1,
    marginBottom: 4,
  },
  profileName: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  profileLevel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.secondary,
    letterSpacing: 0.5,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 24,
    gap: 16,
    marginBottom: 32,
  },
  actionButton: {
    width: '48%',
    height: 112,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: COLORS.surfaceLow,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  actionButtonText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: 1,
  },
  compositionContainer: {
    marginHorizontal: 24,
    marginBottom: 32,
    paddingVertical: 32,
    paddingHorizontal: 32,
    backgroundColor: COLORS.surfaceLowest,
    borderRadius: 12,
    overflow: 'hidden',
  },
  compositionImageSection: {
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    position: 'relative',
  },
  compositionImage: {
    width: '100%',
    height: '100%',
    opacity: 0.4,
  },
  selectionPoint: {
    position: 'absolute',
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  compositionMetrics: {
    gap: 16,
  },
  compositionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  metricCard: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.surfaceHigh,
    borderRadius: 6,
    borderLeftWidth: 2,
    borderLeftColor: COLORS.primaryDim,
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textTertiary,
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  metricValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  metricValueMain: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  metricValueUnit: {
    fontSize: 10,
    color: COLORS.textTertiary,
    opacity: 0.6,
  },
  updateButton: {
    marginTop: 12,
    paddingVertical: 12,
    backgroundColor: COLORS.primary,
    borderRadius: 6,
    alignItems: 'center',
  },
  updateButtonText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.bg,
    letterSpacing: 1.2,
  },
  devicesSection: {
    marginHorizontal: 24,
    marginBottom: 32,
    gap: 12,
  },
  devicesSectionTitle: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textTertiary,
    letterSpacing: 2,
    marginBottom: 12,
  },
  deviceCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
  },
  deviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  deviceIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deviceTextContainer: {
    flex: 1,
  },
  deviceName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  deviceStatus: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textTertiary,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  deviceStatusConnected: {
    color: COLORS.secondary,
  },
  planSection: {
    marginHorizontal: 24,
    marginBottom: 32,
    paddingHorizontal: 32,
    paddingVertical: 32,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planContent: {
    flex: 1,
  },
  planTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.bg,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  planDescription: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.bg,
    marginBottom: 16,
  },
  planStats: {
    flexDirection: 'row',
    gap: 12,
  },
  planStat: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 4,
  },
  planStatLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: 'rgba(0,0,0,0.6)',
    letterSpacing: 1,
    marginBottom: 2,
  },
  planStatValue: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.bg,
  },
  planButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: COLORS.bg,
    borderRadius: 20,
    marginLeft: 16,
  },
  planButtonText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 1,
  },
  logoutButton: {
    marginHorizontal: 24,
    marginBottom: 24,
    paddingHorizontal: 24,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.tertiary,
    borderRadius: 8,
  },
  logoutButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.tertiary,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 80,
    right: 24,
    gap: 16,
  },
  fabSecondary: {
    width: 56,
    height: 56,
    borderRadius: 28,
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
    width: 64,
    height: 64,
    borderRadius: 32,
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

export default ProfileScreen;
