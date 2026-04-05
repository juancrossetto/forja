import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const COLORS = {
  bg: '#0e0e0e',
  surface: '#1a1a1a',
  surfaceHigh: '#20201f',
  surfaceHighest: '#262626',
  surfaceContainer: '#131313',
  primary: '#D1FF26',
  primaryDim: '#c1ed00',
  secondary: '#00e3fd',
  tertiary: '#ff734a',
  text: '#ffffff',
  textVariant: '#adaaaa',
  borderLight: 'rgba(255,255,255,0.05)',
};

interface PhotoSlot {
  id: string;
  position: 'frente' | 'perfil' | 'espalda';
  label: string;
  icon: string;
  image: string | null;
}

const INITIAL_SLOTS: PhotoSlot[] = [
  { id: '1', position: 'frente', label: 'Frente', icon: 'account', image: null },
  { id: '2', position: 'perfil', label: 'Perfil', icon: 'account-switch', image: null },
  { id: '3', position: 'espalda', label: 'Espalda', icon: 'account-multiple', image: null },
];

const CargarFotosScreen: React.FC = () => {
  const [photos, setPhotos] = useState<PhotoSlot[]>(INITIAL_SLOTS);
  const [week] = useState(12);
  const [loading, setLoading] = useState<string | null>(null);

  const requestPermission = async (type: 'camera' | 'gallery') => {
    if (type === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permisos necesarios', 'Necesitamos acceso a tu cámara para tomar fotos.');
        return false;
      }
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permisos necesarios', 'Necesitamos acceso a tu galería para seleccionar fotos.');
        return false;
      }
    }
    return true;
  };

  const handleTakePhoto = async (slotId: string) => {
    const hasPermission = await requestPermission('camera');
    if (!hasPermission) return;

    setLoading(slotId);
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setPhotos((prev) =>
          prev.map((p) => (p.id === slotId ? { ...p, image: result.assets[0].uri } : p))
        );
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo tomar la foto.');
    } finally {
      setLoading(null);
    }
  };

  const handleSelectFromGallery = async (slotId: string) => {
    const hasPermission = await requestPermission('gallery');
    if (!hasPermission) return;

    setLoading(slotId);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setPhotos((prev) =>
          prev.map((p) => (p.id === slotId ? { ...p, image: result.assets[0].uri } : p))
        );
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo seleccionar la foto.');
    } finally {
      setLoading(null);
    }
  };

  const handleRemovePhoto = (slotId: string) => {
    setPhotos((prev) =>
      prev.map((p) => (p.id === slotId ? { ...p, image: null } : p))
    );
  };

  const hasPhotos = photos.some((p) => p.image !== null);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.titleMain}>Cargar Fotos</Text>
          <Text style={[styles.titleMain, { color: COLORS.primaryDim }]}>de Progreso</Text>
          <Text style={styles.titleSubtitle}>Semana {week} · Tracking Visual</Text>
        </View>

        {/* Photo Grid */}
        <View style={styles.gridSection}>
          <View style={styles.photoGrid}>
            {photos.map((slot) => (
              <View key={slot.id} style={styles.photoSlot}>
                <View style={styles.photoFrame}>
                  {loading === slot.id ? (
                    <View style={styles.photoPlaceholder}>
                      <ActivityIndicator size="large" color={COLORS.primary} />
                    </View>
                  ) : slot.image ? (
                    <View style={{ flex: 1 }}>
                      <Image source={{ uri: slot.image }} style={styles.photoImage} />
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => handleRemovePhoto(slot.id)}
                      >
                        <MaterialCommunityIcons name="close-circle" size={24} color={COLORS.tertiary} />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.photoPlaceholder}>
                      <MaterialCommunityIcons name={slot.icon} size={32} color={COLORS.textVariant} />
                      <Text style={styles.photoPlaceholderLabel}>{slot.label}</Text>
                    </View>
                  )}
                </View>
                <View style={styles.photoActions}>
                  <TouchableOpacity
                    style={styles.photoButton}
                    onPress={() => handleTakePhoto(slot.id)}
                    disabled={loading !== null}
                  >
                    <MaterialCommunityIcons name="camera" size={14} color={COLORS.text} />
                    <Text style={styles.photoButtonText}>Cámara</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.photoButton, styles.photoButtonSecondary]}
                    onPress={() => handleSelectFromGallery(slot.id)}
                    disabled={loading !== null}
                  >
                    <MaterialCommunityIcons name="image" size={14} color={COLORS.primaryDim} />
                    <Text style={styles.photoButtonSecondaryText}>Galería</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Tips */}
        <View style={styles.tipsSection}>
          <View style={styles.tipCard}>
            <MaterialCommunityIcons name="lightbulb-outline" size={16} color={COLORS.primary} />
            <Text style={styles.tipText}>
              Usa la misma iluminación y posición cada semana para mejores comparaciones.
            </Text>
          </View>
        </View>

        {/* Save Button */}
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={[styles.saveButton, !hasPhotos && styles.saveButtonDisabled]}
            disabled={!hasPhotos}
          >
            <Text style={[styles.saveButtonText, !hasPhotos && styles.saveButtonTextDisabled]}>
              Guardar Registros
            </Text>
          </TouchableOpacity>
          <Text style={styles.encryptionNote}>Tus datos están encriptados y seguros</Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  titleSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  titleMain: {
    fontSize: 30,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.8,
    lineHeight: 34,
  },
  titleSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textVariant,
    letterSpacing: 0.5,
    marginTop: 12,
  },
  gridSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  photoGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  photoSlot: {
    flex: 1,
  },
  photoFrame: {
    aspectRatio: 3 / 4,
    backgroundColor: COLORS.surfaceHigh,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  photoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  photoPlaceholderLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textVariant,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
  },
  photoActions: {
    gap: 6,
  },
  photoButton: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: COLORS.surfaceHighest,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoButtonText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 0.3,
  },
  photoButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  photoButtonSecondaryText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primaryDim,
    letterSpacing: 0.3,
  },
  tipsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textVariant,
    lineHeight: 18,
  },
  actionSection: {
    paddingHorizontal: 20,
    gap: 12,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: COLORS.surfaceHighest,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    letterSpacing: -0.3,
  },
  saveButtonTextDisabled: {
    color: COLORS.textVariant,
  },
  encryptionNote: {
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '500',
    color: COLORS.textVariant,
    letterSpacing: 0.3,
  },
});

export default CargarFotosScreen;
