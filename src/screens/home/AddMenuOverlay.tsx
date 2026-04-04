import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  TouchableWithoutFeedback,
  Animated,
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
  secondaryFixed: '#26e6ff',
  tertiary: '#ff734a',
  tertiaryFixed: '#ff9475',
  text: '#ffffff',
  textVariant: '#adaaaa',
};

interface MenuAction {
  id: string;
  label: string;
  sublabel: string;
  icon: string;
  color: string;
  onPress: () => void;
}

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
  const [fadeAnim] = React.useState(new Animated.Value(0));
  const [slideAnim] = React.useState(new Animated.Value(100));

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 100,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const mainActions: MenuAction[] = [
    {
      id: 'training',
      label: 'Entrenamiento',
      sublabel: 'Iniciar rutina de pesas',
      icon: '🏋️',
      color: COLORS.primary,
      onPress: () => {
        onSelectTraining();
        onClose();
      },
    },
    {
      id: 'cardio',
      label: 'Cardio',
      sublabel: 'Pasos, Running o HIIT',
      icon: '🏃',
      color: COLORS.secondary,
      onPress: () => {
        onSelectCardio();
        onClose();
      },
    },
  ];

  const secondaryActions: MenuAction[] = [
    {
      id: 'food',
      label: 'Comida',
      sublabel: 'Log de macros',
      icon: '🍽️',
      color: COLORS.tertiary,
      onPress: () => {
        onSelectFood();
        onClose();
      },
    },
    {
      id: 'water',
      label: 'Agua',
      sublabel: 'Añadir 250ml',
      icon: '💧',
      color: '#4dd0e1',
      onPress: () => {
        onSelectWater();
        onClose();
      },
    },
  ];

  const tertiaryActions: MenuAction[] = [
    {
      id: 'session',
      label: 'Sesión 1-1',
      sublabel: '',
      icon: '📅',
      color: COLORS.primary,
      onPress: () => {
        onSelectSession();
        onClose();
      },
    },
    {
      id: 'photos',
      label: 'Fotos',
      sublabel: '',
      icon: '📷',
      color: COLORS.secondaryFixed,
      onPress: () => {
        onSelectPhotos();
        onClose();
      },
    },
    {
      id: 'measurements',
      label: 'Peso',
      sublabel: '',
      icon: '📏',
      color: COLORS.tertiaryFixed,
      onPress: () => {
        onSelectMeasurements();
        onClose();
      },
    },
  ];

  const renderMainAction = (action: MenuAction) => (
    <TouchableOpacity
      key={action.id}
      style={styles.mainAction}
      onPress={action.onPress}
    >
      <View style={styles.mainActionContent}>
        <View style={[styles.mainActionIcon, { backgroundColor: `${action.color}20` }]}>
          <Text style={styles.mainActionIconText}>{action.icon}</Text>
        </View>
        <View style={styles.mainActionText}>
          <Text style={styles.mainActionLabel}>{action.label}</Text>
          <Text style={styles.mainActionSublabel}>{action.sublabel}</Text>
        </View>
      </View>
      <Text style={styles.mainActionChevron}>→</Text>
    </TouchableOpacity>
  );

  const renderSecondaryAction = (action: MenuAction) => (
    <TouchableOpacity
      key={action.id}
      style={styles.secondaryAction}
      onPress={action.onPress}
    >
      <View style={[styles.secondaryActionIcon, { backgroundColor: `${action.color}20` }]}>
        <Text style={styles.secondaryActionIconText}>{action.icon}</Text>
      </View>
      <View style={styles.secondaryActionText}>
        <Text style={styles.secondaryActionLabel}>{action.label}</Text>
        <Text style={styles.secondaryActionSublabel}>{action.sublabel}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderTertiaryAction = (action: MenuAction) => (
    <TouchableOpacity
      key={action.id}
      style={styles.tertiaryAction}
      onPress={action.onPress}
    >
      <Text style={styles.tertiaryActionIcon}>{action.icon}</Text>
      <Text style={styles.tertiaryActionLabel}>{action.label}</Text>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdropTouchable} />
        </TouchableWithoutFeedback>
      </Animated.View>

      <Animated.View
        style={[
          styles.menuContainer,
          {
            transform: [{ translateY: slideAnim }],
            opacity: fadeAnim,
          },
        ]}
      >
        {/* Header */}
        <View style={styles.menuHeader}>
          <View>
            <Text style={styles.menuTitle}>NUEVO</Text>
            <Text style={[styles.menuTitle, { color: COLORS.secondary }]}>
              REGISTRO
            </Text>
          </View>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
          >
            <Text style={styles.closeButtonIcon}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Main Actions */}
        <View style={styles.mainActionsContainer}>
          {mainActions.map(renderMainAction)}
        </View>

        {/* Secondary Actions Grid */}
        <View style={styles.secondaryActionsContainer}>
          {secondaryActions.map(renderSecondaryAction)}
        </View>

        {/* Tertiary Actions Grid */}
        <View style={styles.tertiaryActionsContainer}>
          {tertiaryActions.map(renderTertiaryAction)}
        </View>

        {/* Footer */}
        <Text style={styles.footer}>Toque fuera para cerrar</Text>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: `${COLORS.bg}CC`,
    backdropFilter: 'blur(20px)',
  },
  backdropTouchable: {
    flex: 1,
  },
  menuContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: `${COLORS.bg}E6`,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 32,
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  menuTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.6,
    lineHeight: 32,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceHighest,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonIcon: {
    fontSize: 18,
    color: COLORS.text,
    fontWeight: '700',
  },
  mainActionsContainer: {
    gap: 12,
    marginBottom: 16,
  },
  mainAction: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: `${COLORS.surface}99`,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${COLORS.text}08`,
  },
  mainActionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  mainActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainActionIconText: {
    fontSize: 24,
  },
  mainActionText: {
    flex: 1,
  },
  mainActionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  mainActionSublabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textVariant,
    letterSpacing: 0.3,
  },
  mainActionChevron: {
    fontSize: 16,
    color: `${COLORS.text}33`,
    fontWeight: '700',
  },
  secondaryActionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  secondaryAction: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 14,
    backgroundColor: `${COLORS.surface}99`,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${COLORS.text}08`,
    alignItems: 'flex-start',
    gap: 10,
  },
  secondaryActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryActionIconText: {
    fontSize: 20,
  },
  secondaryActionText: {
    flex: 1,
  },
  secondaryActionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  secondaryActionSublabel: {
    fontSize: 9,
    fontWeight: '600',
    color: COLORS.textVariant,
    letterSpacing: 0.2,
  },
  tertiaryActionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  tertiaryAction: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: `${COLORS.surface}99`,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${COLORS.text}08`,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  tertiaryActionIcon: {
    fontSize: 20,
  },
  tertiaryActionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 0.3,
  },
  footer: {
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textVariant,
    letterSpacing: 0.3,
    marginTop: 16,
  },
});

export { AddMenuOverlay };
export default AddMenuOverlay;
