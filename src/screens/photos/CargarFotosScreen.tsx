import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  FlatList,
} from 'react-native';

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
  secondaryFixed: '#26e6ff',
  tertiary: '#ff734a',
  text: '#ffffff',
  textVariant: '#adaaaa',
};

interface PhotoSlot {
  id: string;
  position: 'frente' | 'perfil' | 'espalda';
  label: string;
  icon: string;
  image: string | null;
}

const PhotoSlots: PhotoSlot[] = [
  { id: '1', position: 'frente', label: 'Frente', icon: '👤', image: null },
  { id: '2', position: 'perfil', label: 'Perfil', icon: '🔄', image: null },
  { id: '3', position: 'espalda', label: 'Espalda', icon: '👥', image: null },
];

const CargarFotosScreen: React.FC = () => {
  const [photos, setPhotos] = useState<PhotoSlot[]>(PhotoSlots);
  const [week, setWeek] = useState(12);

  const handleTakePhoto = (slotId: string) => {
    // Camera logic would go here
    console.log('Take photo:', slotId);
  };

  const handleSelectFromGallery = (slotId: string) => {
    // Gallery picker logic would go here
    console.log('Select from gallery:', slotId);
  };

  const renderPhotoGrid = () => {
    return (
      <View style={styles.photoGrid}>
        {photos.map((slot) => (
          <View key={slot.id} style={styles.photoSlot}>
            <View style={styles.photoFrame}>
              {slot.image ? (
                <Image
                  source={{ uri: slot.image }}
                  style={styles.photoImage}
                />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Text style={styles.photoPlaceholderIcon}>{slot.icon}</Text>
                  <Text style={styles.photoPlaceholderLabel}>{slot.label}</Text>
                </View>
              )}
            </View>
            <View style={styles.photoActions}>
              <TouchableOpacity
                style={styles.photoButton}
                onPress={() => handleTakePhoto(slot.id)}
              >
                <Text style={styles.photoButtonText}>Tomar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.photoButton, styles.photoButtonSecondary]}
                onPress={() => handleSelectFromGallery(slot.id)}
              >
                <Text style={styles.photoButtonSecondaryText}>Galería</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.titleMain}>Cargar Fotos</Text>
          <Text style={[styles.titleMain, { color: COLORS.primaryDim }]}>
            de Progreso
          </Text>
          <Text style={styles.titleSubtitle}>Tracking Mental y Físico</Text>
        </View>

        {/* Before/After Comparison */}
        <View style={styles.comparisonSection}>
          <View style={styles.comparisonHeader}>
            <Text style={styles.comparisonLabel}>Vista Comparativa</Text>
            <View style={styles.weekBadge}>
              <Text style={styles.weekBadgeText}>Semana {week}</Text>
            </View>
          </View>
          <View style={styles.comparisonContainer}>
            {/* Before Image */}
            <View style={styles.comparisonImage}>
              <Image
                source={{ uri: 'https://via.placeholder.com/150x200' }}
                style={styles.comparisonImageContent}
              />
              <View style={styles.comparisonLabel}>
                <Text style={styles.comparisonLabelText}>Inicio</Text>
              </View>
            </View>

            {/* Comparison Slider */}
            <View style={styles.comparisonSlider}>
              <View style={styles.sliderHandle} />
            </View>

            {/* After Placeholder */}
            <View style={styles.comparisonImage}>
              <View style={styles.comparisonImagePlaceholder}>
                <Text style={styles.placeholderIcon}>📷</Text>
                <Text style={styles.placeholderText}>Subir Ahora</Text>
              </View>
              <View style={[styles.comparisonLabel, styles.comparisonLabelCurrent]}>
                <Text style={styles.comparisonLabelTextCurrent}>Hoy</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Photo Grid */}
        <View style={styles.gridSection}>
          {renderPhotoGrid()}
        </View>

        {/* Save Button */}
        <View style={styles.actionSection}>
          <TouchableOpacity style={styles.saveButton}>
            <Text style={styles.saveButtonText}>Guardar Registros</Text>
          </TouchableOpacity>
          <Text style={styles.encryptionNote}>
            Tus datos están encriptados y seguros
          </Text>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Floating Buttons */}
      <View style={styles.floatingButtonsContainer}>
        <TouchableOpacity style={styles.floatingButtonChat}>
          <Text style={styles.floatingButtonIcon}>💬</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.floatingButtonAdd}>
          <Text style={styles.floatingButtonAddIcon}>➕</Text>
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
  titleSection: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
  },
  titleMain: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.8,
    lineHeight: 36,
  },
  titleSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textVariant,
    letterSpacing: 0.5,
    marginTop: 12,
  },
  comparisonSection: {
    marginHorizontal: 16,
    marginBottom: 24,
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: `${COLORS.text}08`,
  },
  comparisonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  comparisonLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textVariant,
    letterSpacing: 0.3,
  },
  weekBadge: {
    backgroundColor: `${COLORS.primary}20`,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  weekBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primaryDim,
    letterSpacing: 0.5,
  },
  comparisonContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'stretch',
    height: 250,
    position: 'relative',
  },
  comparisonImage: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: COLORS.surfaceHigh,
    position: 'relative',
  },
  comparisonImageContent: {
    width: '100%',
    height: '100%',
    opacity: 0.6,
  },
  comparisonImagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceHighest,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: `${COLORS.primaryDim}80`,
  },
  placeholderIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  placeholderText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primaryDim,
    letterSpacing: 0.3,
  },
  comparisonLabel: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  comparisonLabelText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 0.3,
  },
  comparisonLabelCurrent: {
    backgroundColor: COLORS.primary,
  },
  comparisonLabelTextCurrent: {
    color: '#000000',
  },
  comparisonSlider: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: `${COLORS.primaryDim}80`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sliderHandle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
  },
  gridSection: {
    paddingHorizontal: 16,
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
    aspectRatio: 2 / 3,
    backgroundColor: COLORS.surfaceHigh,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: `${COLORS.text}0F`,
  },
  photoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  photoPlaceholderIcon: {
    fontSize: 28,
  },
  photoPlaceholderLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: COLORS.textVariant,
    letterSpacing: 0.3,
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoActions: {
    gap: 6,
  },
  photoButton: {
    paddingVertical: 10,
    backgroundColor: COLORS.surfaceHighest,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoButtonText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 0.5,
  },
  photoButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: `${COLORS.text}1A`,
  },
  photoButtonSecondaryText: {
    fontSize: 9,
    fontWeight: '600',
    color: COLORS.textVariant,
    letterSpacing: 0.5,
  },
  actionSection: {
    paddingHorizontal: 16,
    gap: 12,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: -0.3,
  },
  encryptionNote: {
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '500',
    color: COLORS.textVariant,
    letterSpacing: 0.3,
    marginBottom: 24,
  },
  bottomSpacer: {
    height: 60,
  },
  floatingButtonsContainer: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  floatingButtonChat: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.surfaceHighest,
    borderWidth: 1,
    borderColor: `${COLORS.text}1A`,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  floatingButtonAdd: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  floatingButtonIcon: {
    fontSize: 24,
  },
  floatingButtonAddIcon: {
    fontSize: 28,
    color: '#000000',
    fontWeight: '700',
  },
});

export default CargarFotosScreen;
