import React, { useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../../navigation/types';
import { AppProgressiveHeader, HEADER_ROW_HEIGHT } from '../../components/AppProgressiveHeader';
import { radius } from '../../theme/radius';

type Nav = NativeStackNavigationProp<HomeStackParamList>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const COLORS = {
  bg: '#0E0E0E',
  surface: '#131313',
  surfaceHigh: '#1F1F1F',
  surfaceHighest: '#262626',
  primary: '#D1FF26',
  primaryDim: '#c1ed00',
  primaryContainer: '#DAF900',
  secondary: '#00e3fd',
  tertiary: '#ff734a',
  errorContainer: '#b92902',
  text: '#FFFFFF',
  textVariant: 'rgba(255,255,255,0.55)',
  border: 'rgba(255,255,255,0.05)',
};

// ─── Static mock data ────────────────────────────────────────────────────────

interface TeamMember {
  id: string;
  initials?: string;
  color?: string;
}

interface MyTeam {
  name: string;
  subtitle: string;
  progress: number;
  memberCount: number;
  members: TeamMember[];
}

interface Group {
  id: string;
  flag: string;
  name: string;
  tags: string[];
  membersCurrent: number;
  membersMax: number;
  statusLabel: string;
  statusUrgent: boolean;
}

interface Coach {
  id: string;
  name: string;
  specialty: string;
  initials: string;
  color: string;
  active: boolean;
}

const MY_TEAM: MyTeam = {
  name: 'GUERILLEROS DE HIERRO',
  subtitle: 'LIGA DE ÉLITE · TEMPORADA 4',
  progress: 84,
  memberCount: 16,
  members: [
    { id: '1', initials: 'MR', color: '#3b82f6' },
    { id: '2', initials: 'AP', color: '#8b5cf6' },
    { id: '3', initials: 'LG', color: '#ec4899' },
    { id: '4', initials: 'KT', color: '#f59e0b' },
  ],
};

const GROUPS: Group[] = [
  {
    id: '1',
    flag: '🇦🇷',
    name: 'ENANOS EN DÉFICIT',
    tags: ['Pérdida de Peso', 'Cardio'],
    membersCurrent: 19,
    membersMax: 30,
    statusLabel: 'Empieza mañana',
    statusUrgent: true,
  },
  {
    id: '2',
    flag: '🇲🇽',
    name: 'FUERZA BRUTA',
    tags: ['Hipertrofia', 'Pesas'],
    membersCurrent: 28,
    membersMax: 30,
    statusLabel: 'En curso',
    statusUrgent: false,
  },
  {
    id: '3',
    flag: '🇨🇱',
    name: 'CARDIO EXTREMO',
    tags: ['Resistencia', 'HIIT'],
    membersCurrent: 12,
    membersMax: 25,
    statusLabel: 'Abierto',
    statusUrgent: false,
  },
  {
    id: '4',
    flag: '🇨🇴',
    name: 'VOLUMEN MÁXIMO',
    tags: ['Hipertrofia', 'Fuerza'],
    membersCurrent: 8,
    membersMax: 20,
    statusLabel: 'Nuevo',
    statusUrgent: false,
  },
];

const COACHES: Coach[] = [
  { id: '1', name: 'COACH ALEX', specialty: 'POWERLIFTING', initials: 'CA', color: '#D1FF26', active: true },
  { id: '2', name: 'COACH ELENA', specialty: 'CROSSFIT', initials: 'CE', color: '#00e3fd', active: false },
  { id: '3', name: 'COACH MARCO', specialty: 'ESTRATEGIA', initials: 'CM', color: '#ff734a', active: false },
  { id: '4', name: 'COACH SARA', specialty: 'MOVILIDAD', initials: 'CS', color: '#8b5cf6', active: false },
  { id: '5', name: 'COACH DIEGO', specialty: 'NUTRICIÓN', initials: 'CD', color: '#f59e0b', active: false },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

const TeamMemberAvatar: React.FC<{ member: TeamMember; size?: number }> = ({
  member,
  size = 36,
}) => (
  <View
    style={[
      styles.memberAvatar,
      {
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: member.color ?? COLORS.surfaceHighest,
        borderWidth: 2,
        borderColor: COLORS.surfaceHigh,
      },
    ]}
  >
    <Text style={[styles.memberAvatarText, { fontSize: size * 0.33 }]}>
      {member.initials ?? '?'}
    </Text>
  </View>
);

const GroupCard: React.FC<{ group: Group; onPress: () => void }> = ({ group, onPress }) => (
  <View style={styles.groupCard}>
    <View style={styles.groupCardHead}>
      <Text style={styles.groupFlag}>{group.flag}</Text>
      <View
        style={[
          styles.groupStatusBadge,
          group.statusUrgent
            ? { backgroundColor: COLORS.errorContainer }
            : { backgroundColor: COLORS.surfaceHighest },
        ]}
      >
        <Text
          style={[
            styles.groupStatusText,
            group.statusUrgent ? { color: '#fff' } : { color: COLORS.textVariant },
          ]}
        >
          {group.statusLabel}
        </Text>
      </View>
    </View>
    <Text style={styles.groupName}>{group.name}</Text>
    <View style={styles.groupTags}>
      {group.tags.map((tag) => (
        <View key={tag} style={styles.groupTag}>
          <Text style={styles.groupTagText}>{tag}</Text>
        </View>
      ))}
    </View>
    <View style={styles.groupMembersRow}>
      <MaterialCommunityIcons name="account-group" size={14} color={COLORS.textVariant} />
      <Text style={styles.groupMembersText}>
        {group.membersCurrent} / {group.membersMax} MIEMBROS
      </Text>
    </View>
    <TouchableOpacity style={styles.joinButton} onPress={onPress} activeOpacity={0.8}>
      <Text style={styles.joinButtonText}>UNIRSE</Text>
    </TouchableOpacity>
  </View>
);

const CoachBubble: React.FC<{ coach: Coach }> = ({ coach }) => (
  <TouchableOpacity style={styles.coachItem} activeOpacity={0.75}>
    <View
      style={[
        styles.coachAvatarRing,
        { borderColor: coach.active ? COLORS.primaryContainer : 'rgba(218,249,0,0.3)' },
        !coach.active && { opacity: 0.65 },
      ]}
    >
      <View style={[styles.coachAvatar, { backgroundColor: `${coach.color}22` }]}>
        <Text style={[styles.coachInitials, { color: coach.color }]}>{coach.initials}</Text>
      </View>
    </View>
    <Text style={styles.coachName}>{coach.name}</Text>
    <Text style={styles.coachSpecialty}>{coach.specialty}</Text>
  </TouchableOpacity>
);

// ─── Main screen ─────────────────────────────────────────────────────────────

const ComunidadScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const scrollY = useRef(new Animated.Value(0)).current;

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: false },
  );

  const contentPaddingTop = insets.top + HEADER_ROW_HEIGHT + 16;

  return (
    <View style={styles.root}>
      <AppProgressiveHeader
        scrollY={scrollY}
        topInset={insets.top}
        onHomePress={() => navigation.navigate('Inicio')}
        onAvatarPress={() => navigation.navigate('Perfil')}
      />

      <Animated.ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingTop: contentPaddingTop, paddingBottom: insets.bottom + 100 },
        ]}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Page title ── */}
        <Text style={styles.pageTitle}>COMUNIDAD</Text>

        {/* ── Search bar ── */}
        <View style={styles.searchWrap}>
          <MaterialCommunityIcons
            name="magnify"
            size={20}
            color={COLORS.primaryContainer}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar equipos, rutinas o coaches..."
            placeholderTextColor={COLORS.textVariant}
            returnKeyType="search"
          />
        </View>

        {/* ── CREAR GRUPO CTA ── */}
        <TouchableOpacity activeOpacity={0.85} style={styles.ctaWrapper}>
          <LinearGradient
            colors={['#F6FFC0', '#DAF900']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.ctaButton}
          >
            <MaterialCommunityIcons name="plus-circle" size={22} color="#3F4900" />
            <Text style={styles.ctaText}>CREAR GRUPO</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* ── TUS EQUIPOS ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>TUS EQUIPOS</Text>
            <Text style={styles.sectionBadge}>ACTIVO AHORA</Text>
          </View>

          <View style={styles.teamCard}>
            <View style={styles.teamCardTop}>
              <View style={styles.teamCardHeading}>
                <Text style={styles.teamName}>{MY_TEAM.name}</Text>
                <Text style={styles.teamSubtitle}>{MY_TEAM.subtitle}</Text>
              </View>
              <MaterialCommunityIcons name="shield-star" size={32} color={COLORS.primaryContainer} />
            </View>

            {/* Member avatars */}
            <View style={styles.teamAvatars}>
              {MY_TEAM.members.map((m) => (
                <View key={m.id} style={styles.teamAvatarOffset}>
                  <TeamMemberAvatar member={m} size={36} />
                </View>
              ))}
              <View style={[styles.teamAvatarOffset, styles.teamAvatarExtra]}>
                <Text style={styles.teamAvatarExtraText}>
                  +{MY_TEAM.memberCount - MY_TEAM.members.length}
                </Text>
              </View>
            </View>

            {/* Progress bar */}
            <View style={styles.progressSection}>
              <View style={styles.progressLabelRow}>
                <Text style={styles.progressLabel}>PROGRESO SEMANAL</Text>
                <Text style={styles.progressValue}>{MY_TEAM.progress}%</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${MY_TEAM.progress}%` }]} />
              </View>
            </View>
          </View>
        </View>

        {/* ── GRUPOS DISPONIBLES ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>GRUPOS DISPONIBLES</Text>
          <View style={styles.groupGrid}>
            {GROUPS.map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                onPress={() => {}}
              />
            ))}
          </View>
        </View>

        {/* ── COACHES DESTACADOS ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>COACHES DESTACADOS</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.coachesList}
          >
            {COACHES.map((coach) => (
              <CoachBubble key={coach.id} coach={coach} />
            ))}
          </ScrollView>
        </View>
      </Animated.ScrollView>
    </View>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const GROUP_CARD_WIDTH = (SCREEN_WIDTH - 48 - 12) / 2; // 24px side padding × 2, 12px gap

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
  },

  // ── Page title ──────────────────────────────────────────────────────────
  pageTitle: {
    fontFamily: 'Space Grotesk',
    fontSize: 40,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: -1.5,
    textTransform: 'uppercase',
    marginBottom: 20,
    lineHeight: 44,
  },

  // ── Search ──────────────────────────────────────────────────────────────
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceHigh,
    borderRadius: radius.surface.input,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter',
    fontSize: 14,
    color: COLORS.text,
  },

  // ── CTA ─────────────────────────────────────────────────────────────────
  ctaWrapper: {
    marginBottom: 36,
    borderRadius: radius.button.default,
    overflow: 'hidden',
    shadowColor: COLORS.primaryContainer,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 8,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: radius.button.default,
  },
  ctaText: {
    fontFamily: 'Space Grotesk',
    fontSize: 17,
    fontWeight: '700',
    color: '#3F4900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // ── Sections ────────────────────────────────────────────────────────────
  section: {
    marginBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'Space Grotesk',
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textVariant,
    textTransform: 'uppercase',
    letterSpacing: 2.5,
    marginBottom: 16,
  },
  sectionBadge: {
    fontFamily: 'Inter',
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.primaryContainer,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },

  // ── Team card ───────────────────────────────────────────────────────────
  teamCard: {
    backgroundColor: COLORS.surfaceHigh,
    borderRadius: radius.surface.card,
    padding: 24,
  },
  teamCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  teamCardHeading: {
    flex: 1,
    paddingRight: 12,
  },
  teamName: {
    fontFamily: 'Space Grotesk',
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    textTransform: 'uppercase',
    letterSpacing: -0.5,
    lineHeight: 26,
  },
  teamSubtitle: {
    fontFamily: 'Inter',
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textVariant,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginTop: 6,
  },
  teamAvatars: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  teamAvatarOffset: {
    marginLeft: -8,
  },
  memberAvatar: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberAvatarText: {
    fontFamily: 'Inter',
    fontWeight: '700',
    color: COLORS.text,
  },
  teamAvatarExtra: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.surfaceHigh,
  },
  teamAvatarExtraText: {
    fontFamily: 'Inter',
    fontSize: 10,
    fontWeight: '900',
    color: '#3F4900',
  },
  progressSection: {
    gap: 8,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontFamily: 'Inter',
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textVariant,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  progressValue: {
    fontFamily: 'Inter',
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primaryContainer,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  progressTrack: {
    height: 10,
    backgroundColor: COLORS.surfaceHighest,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primaryContainer,
    borderRadius: radius.full,
  },

  // ── Groups grid ─────────────────────────────────────────────────────────
  groupGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  groupCard: {
    width: GROUP_CARD_WIDTH,
    backgroundColor: COLORS.surface,
    borderRadius: radius.surface.card,
    padding: 20,
  },
  groupCardHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  groupFlag: {
    fontSize: 24,
  },
  groupStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  groupStatusText: {
    fontFamily: 'Inter',
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  groupName: {
    fontFamily: 'Space Grotesk',
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.text,
    textTransform: 'uppercase',
    letterSpacing: -0.3,
    lineHeight: 20,
    marginBottom: 12,
  },
  groupTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  groupTag: {
    backgroundColor: COLORS.surfaceHighest,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  groupTagText: {
    fontFamily: 'Inter',
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  groupMembersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 16,
  },
  groupMembersText: {
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  joinButton: {
    borderWidth: 2,
    borderColor: COLORS.primaryContainer,
    borderRadius: radius.button.default,
    paddingVertical: 10,
    alignItems: 'center',
  },
  joinButtonText: {
    fontFamily: 'Space Grotesk',
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primaryContainer,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },

  // ── Coaches ─────────────────────────────────────────────────────────────
  coachesList: {
    gap: 24,
    paddingRight: 8,
  },
  coachItem: {
    alignItems: 'center',
    gap: 6,
  },
  coachAvatarRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    padding: 3,
    marginBottom: 4,
  },
  coachAvatar: {
    flex: 1,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coachInitials: {
    fontFamily: 'Space Grotesk',
    fontSize: 18,
    fontWeight: '700',
  },
  coachName: {
    fontFamily: 'Space Grotesk',
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.text,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  coachSpecialty: {
    fontFamily: 'Inter',
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textVariant,
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'center',
  },
});

export default ComunidadScreen;
