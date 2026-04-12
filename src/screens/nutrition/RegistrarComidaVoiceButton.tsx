import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, Platform, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';

const COLORS = {
  secondary: '#00e3fd',
  text: '#ffffff',
};

type Props = {
  onTranscript: (text: string) => void;
  onListeningChange: (listening: boolean) => void;
};

/**
 * Solo se importa vía React.lazy cuando NO es Expo Go — así Expo Go no carga el nativo.
 */
export default function RegistrarComidaVoiceButton({ onTranscript, onListeningChange }: Props) {
  const [listening, setListening] = useState(false);

  useSpeechRecognitionEvent('start', () => {
    setListening(true);
    onListeningChange(true);
  });
  useSpeechRecognitionEvent('end', () => {
    setListening(false);
    onListeningChange(false);
  });
  useSpeechRecognitionEvent('result', (event) => {
    const t = event.results[0]?.transcript?.trim() ?? '';
    if (t) onTranscript(t);
  });
  useSpeechRecognitionEvent('error', (event) => {
    console.warn('speech error', event.error, event.message);
  });

  const startVoice = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('No disponible', 'El dictado por voz no está disponible en web.');
      return;
    }
    const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permisos', 'Necesitamos acceso al micrófono y al reconocimiento de voz.');
      return;
    }
    ExpoSpeechRecognitionModule.start({
      lang: 'es-AR',
      interimResults: true,
      continuous: false,
    });
  };

  const stopVoice = () => {
    ExpoSpeechRecognitionModule.stop();
  };

  return (
    <TouchableOpacity
      style={[styles.actionBtn, styles.actionBtnVoice]}
      onPress={listening ? stopVoice : startVoice}
      activeOpacity={0.85}
    >
      <MaterialCommunityIcons name={listening ? 'stop' : 'microphone'} size={20} color="#000" />
      <Text style={styles.actionBtnText}>{listening ? 'Parar' : 'Voz'}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.secondary,
    paddingVertical: 12,
    borderRadius: 10,
  },
  actionBtnVoice: {},
  actionBtnText: { fontSize: 11, fontWeight: '800', color: '#000', letterSpacing: 0.5 },
});
