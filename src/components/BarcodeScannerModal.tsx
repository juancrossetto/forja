import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { radius } from '../theme/radius';

const COLORS = {
  bg: '#0e0e0e',
  surface: '#1a1a1a',
  primary: '#D1FF26',
  text: '#ffffff',
  textVariant: '#adaaaa',
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onCode: (code: string) => void;
};

export function BarcodeScannerModal({ visible, onClose, onCode }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const locked = useRef(false);

  useEffect(() => {
    if (visible) locked.current = false;
  }, [visible]);

  const handleBarcode = useCallback(
    (result: BarcodeScanningResult) => {
      if (locked.current) return;
      const data = result.data?.trim();
      if (!data) return;
      locked.current = true;
      onCode(data);
      onClose();
    },
    [onCode, onClose],
  );

  if (Platform.OS === 'web') {
    return (
      <Modal visible={visible} animationType="slide" transparent>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <Text style={styles.hint}>El escaneo de código de barras no está disponible en web.</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <MaterialCommunityIcons name="close" size={22} color="#000" />
          </TouchableOpacity>
          <Text style={styles.title}>Escanear código</Text>
          <View style={{ width: 40 }} />
        </View>

        {!permission?.granted ? (
          <View style={styles.centerBox}>
            <Text style={styles.hint}>Necesitamos acceso a la cámara para leer el código de barras.</Text>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => {
                void requestPermission().then((r) => {
                  if (!r.granted) Alert.alert('Permisos', 'No se concedió acceso a la cámara.');
                });
              }}
            >
              <Text style={styles.primaryBtnText}>Permitir cámara</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <CameraView
            style={styles.camera}
            facing="back"
            barcodeScannerSettings={{
              barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'],
            }}
            onBarcodeScanned={handleBarcode}
          />
        )}

        <View style={styles.footerHint}>
          <Text style={styles.footerText}>Enfocá el código de barras del envase</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 24,
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderRadius: radius.mdL,
    padding: 20,
  },
  topBar: {
    position: 'absolute',
    top: 48,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.input,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: 1,
  },
  centerBox: { flex: 1, justifyContent: 'center', padding: 24 },
  hint: { color: COLORS.textVariant, fontSize: 14, lineHeight: 20, textAlign: 'center' },
  primaryBtn: {
    marginTop: 20,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  primaryBtnText: { fontWeight: '900', color: '#000', letterSpacing: 1 },
  footerHint: {
    position: 'absolute',
    bottom: 48,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  footerText: { color: COLORS.textVariant, fontSize: 12, textAlign: 'center' },
  closeBtn: { marginTop: 16, alignItems: 'center' },
  closeBtnText: { color: COLORS.primary, fontWeight: '700' },
});
