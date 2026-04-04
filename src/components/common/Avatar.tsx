import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Image,
  ImageSourcePropType,
  ViewStyle,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AvatarProps {
  source?: ImageSourcePropType | string;
  initials?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  active?: boolean;
  editable?: boolean;
  onEditPress?: () => void;
  style?: ViewStyle;
}

const colors = {
  primary: '#D1FF26',
  background: '#1a1a1a',
  text: '#ffffff',
};

const sizeMap = {
  sm: { size: 40, fontSize: 14 },
  md: { size: 56, fontSize: 18 },
  lg: { size: 80, fontSize: 24 },
  xl: { size: 120, fontSize: 32 },
};

const Avatar = React.forwardRef<View, AvatarProps>(
  (
    {
      source,
      initials,
      size = 'md',
      active = false,
      editable = false,
      onEditPress,
      style,
    },
    ref
  ) => {
    const [imageError, setImageError] = useState(false);
    const sizeConfig = sizeMap[size];
    const borderWidth = size === 'sm' ? 1.5 : size === 'md' ? 2 : 2.5;

    const handleImageError = () => {
      setImageError(true);
    };

    return (
      <View ref={ref} style={[style]}>
        <View
          style={[
            styles.avatarContainer,
            {
              width: sizeConfig.size,
              height: sizeConfig.size,
              borderRadius: sizeConfig.size / 2,
              borderWidth: active ? borderWidth : 0,
            },
          ]}
        >
          {source && !imageError ? (
            <Image
              source={typeof source === 'string' ? { uri: source } : source}
              style={{
                width: '100%',
                height: '100%',
                borderRadius: sizeConfig.size / 2,
              }}
              onError={handleImageError}
            />
          ) : (
            <View
              style={[
                styles.initialsContainer,
                {
                  width: '100%',
                  height: '100%',
                },
              ]}
            >
              <Text
                style={[
                  styles.initialsText,
                  {
                    fontSize: sizeConfig.fontSize,
                  },
                ]}
              >
                {initials || '?'}
              </Text>
            </View>
          )}

          {editable && (
            <TouchableOpacity
              onPress={onEditPress}
              style={[
                styles.editButton,
                {
                  width: sizeConfig.size * 0.35,
                  height: sizeConfig.size * 0.35,
                  borderRadius: (sizeConfig.size * 0.35) / 2,
                },
              ]}
            >
              <Ionicons name="camera" size={sizeConfig.size * 0.16} color={colors.background} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }
);

Avatar.displayName = 'Avatar';

const Text = ({ children, style }: any) => {
  const RNText = require('react-native').Text;
  return <RNText style={style}>{children}</RNText>;
};

const styles = StyleSheet.create({
  avatarContainer: {
    backgroundColor: colors.background,
    borderColor: colors.primary,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsContainer: {
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    fontWeight: '700',
    color: colors.text,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  editButton: {
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderWidth: 2,
    borderColor: colors.background,
  },
});

export default Avatar;
