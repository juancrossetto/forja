import React from 'react';
import { View, Text } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

interface IconProps {
  name: string;
  size: number;
  color: string;
}

/**
 * Simple icon wrapper that uses Ionicons from Expo
 * Falls back to text if icon not available
 */
export const Icon: React.FC<IconProps> = ({ name, size, color }) => {
  try {
    return <Ionicons name={name as any} size={size} color={color} />;
  } catch (error) {
    return (
      <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color, fontSize: 10 }}>●</Text>
      </View>
    );
  }
};

export default Icon;
