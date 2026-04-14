import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width, height: SCREEN_HEIGHT } = Dimensions.get('window');

const COLORS = {
  bg: '#0e0e0e',
  surface: '#1a1a1a',
  surfaceHigh: '#20201f',
  surfaceHighest: '#262626',
  primary: '#D1FF26',
  primaryDim: '#c1ed00',
  primaryContainer: '#cefc22',
  secondary: '#00e3fd',
  secondaryContainer: '#006875',
  secondaryFixed: '#26e6ff',
  tertiary: '#ff734a',
  tertiaryContainer: '#ff5722',
  tertiaryFixed: '#ff9475',
  text: '#ffffff',
  textVariant: '#adaaaa',
};

interface AddMenuOverlayProps {
  visible: boolean;
  onClose: () => void;
  onSelectTraining?: () => void;
  onSelectCardio?: () => void;
  onSelectFood?: () => void;
  onSelectWater?: () => void;
  onSelectSession?: () => void;
  onSelectPhotos?: () => void;
  onSelectMeasurements?: () => void;
}

const AddMenuOverlay: React.FC<AddMenuOverlayProps> = ({
  visible,
  onClose,
  onSelectTraining = () => {},
  onSelectCardio = () => {},
  onSelectFood = () => {},
  onSelectWater = () => {},
  onSelectSession = () => {},
  onSelectPhotos = () => {},
  onSelectMeasurements = () => {},
}) => {
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          damping: 22,
          stiffness: 220,
          mass: 0.8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const doAction = (cb: () => void) => () => {
    cb();
    onClose();
  };

  return (
    <>
      {/* Backdrop with blur effect */}
      <Animated.View
        style={[styles.backdrop, { opacity: backdropAnim }]}
        pointerEvents={visible ? 'auto' : 'none'}
      >
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>
      </Animated.View>

      {/* Menu Container */}
      <Animated.View
        style={[
          styles.menuContainer,
          { transform: [{ translateY: slideAnim }] },
        ]}
        pointerEvents={visible ? 'auto' : 'none'}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            NUEVO <Text style={styles.headerTitleAccent}>REGISTRO</Text>
          </Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.7}>
            <MaterialCommunityIcons name="close" size={22} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        {/* Main Options */}
        <View style={styles.mainOptions}>
          {/* Entrenamiento */}
          <TouchableOpacity
            style={styles.mainCard}
            onPress={doAction(onSelectTraining)}
            activeOpacity={0.85}
          >
            <View style={styles.mainCardInner}>
              <View style={[styles.mainCardIcon, { backgroundColor: 'rgba(206,252,34,0.1)' }]}>
                <MaterialCommunityIcons name="dumbbell" size={26} color={COLORS.primaryDim} />
              </View>
              <View style={styles.mainCardText}>
                <Text style={styles.mainCardLabel}>Entrenamiento</Text>
                <Text style={styles.mainCardSublabel}>INICIAR RUTINA DE PESAS</Text>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color="rgba(255,255,255,0.15)" />
          </TouchableOpacity>

          {/* Cardio */}
          <TouchableOpacity
            style={styles.mainCard}
            onPress={doAction(onSelectCardio)}
            activeOpacity={0.85}
          >
            <View style={styles.mainCardInner}>
              <View style={[styles.mainCardIcon, { backgroundColor: 'rgba(0,104,117,0.2)' }]}>
                <MaterialCommunityIcons name="run-fast" size={26} color={COLORS.secondary} />
              </View>
              <View style={styles.mainCardText}>
                <Text style={styles.mainCardLabel}>Cardio</Text>
                <Text style={styles.mainCardSublabel}>PASOS, RUNNING O HIIT</Text>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color="rgba(255,255,255,0.15)" />
          </TouchableOpacity>
        </View>

        {/* Secondary Options Grid (2x2) */}
        <View style={styles.gridContainer}>
          <View style={styles.gridRow}>
            {/* Comida */}
            <TouchableOpacity
              style={styles.gridCard}
              onPress={doAction(onSelectFood)}
              activeOpacity={0.85}
            >
              <View style={[styles.gridCardIcon, { backgroundColor: 'rgba(255,87,34,0.15)' }]}>
                <MaterialCommunityIcons name="silverware-fork-knife" size={22} color={COLORS.tertiary} />
              </View>
              <View style={styles.gridCardText}>
                <Text style={styles.gridCardLabel}>Alimentación</Text>
                <Text style={styles.gridCardSublabel}>LOG DE MACROS</Text>
              </View>
            </TouchableOpacity>

            {/* Hidratación */}
            <TouchableOpacity
              style={styles.gridCard}
              onPress={doAction(onSelectWater)}
              activeOpacity={0.85}
            >
              <View style={[styles.gridCardIcon, { backgroundColor: 'rgba(59,130,246,0.1)' }]}>
                <MaterialCommunityIcons name="water" size={22} color="#60a5fa" />
              </View>
              <View style={styles.gridCardText}>
                <Text style={styles.gridCardLabel}>Hidratación</Text>
                <Text style={styles.gridCardSublabel}>LOG DE AGUA</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.gridRow}>
            {/* Fotos */}
            <TouchableOpacity
              style={styles.gridCard}
              onPress={doAction(onSelectPhotos)}
              activeOpacity={0.85}
            >
              <View style={[styles.gridCardIcon, { backgroundColor: 'rgba(38,230,255,0.1)' }]}>
                <MaterialCommunityIcons name="camera" size={22} color={COLORS.secondaryFixed} />
              </View>
              <View style={styles.gridCardText}>
                <Text style={styles.gridCardLabel}>Fotos</Text>
                <Text style={styles.gridCardSublabel}>PROGRESO VISUAL</Text>
              </View>
            </TouchableOpacity>

            {/* Peso */}
            <TouchableOpacity
              style={styles.gridCard}
              onPress={doAction(onSelectMeasurements)}
              activeOpacity={0.85}
            >
              <View style={[styles.gridCardIcon, { backgroundColor: 'rgba(255,148,117,0.1)' }]}>
                <MaterialCommunityIcons name="ruler" size={22} color={COLORS.tertiaryFixed} />
              </View>
              <View style={styles.gridCardText}>
                <Text style={styles.gridCardLabel}>Peso</Text>
                <Text style={styles.gridCardSublabel}>MEDICIONES</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(14,14,14,0.80)',
  },
  menuContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 48 : 32,
    paddingTop: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontFamily: 'Space Grotesk',
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -1,
  },
  headerTitleAccent: {
    color: COLORS.secondary,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceHighest,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainOptions: {
    gap: 12,
    marginBottom: 12,
  },
  mainCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(14,14,14,0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  mainCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  mainCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainCardText: {
    flex: 1,
  },
  mainCardLabel: {
    fontFamily: 'Space Grotesk',
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  mainCardSublabel: {
    fontFamily: 'Lexend',
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textVariant,
    letterSpacing: 0.5,
  },
  gridContainer: {
    gap: 12,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
  },
  gridCard: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(14,14,14,0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    gap: 12,
  },
  gridCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridCardText: {
    gap: 2,
  },
  gridCardLabel: {
    fontFamily: 'Space Grotesk',
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  gridCardSublabel: {
    fontFamily: 'Lexend',
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textVariant,
    letterSpacing: 0.3,
  },
});

export { AddMenuOverlay };
export default AddMenuOverlay;
