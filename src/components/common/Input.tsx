import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  Text,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  multiline?: boolean;
  numberOfLines?: number;
  disabled?: boolean;
  style?: ViewStyle;
  inputStyle?: TextStyle;
}

const colors = {
  primary: '#D1FF26',
  secondary: '#00e3fd',
  text: '#ffffff',
  textSecondary: '#a0a0a0',
  error: '#ff6b6b',
  border: 'rgba(255, 255, 255, 0.1)',
  background: '#0e0e0e',
};

const typography = {
  body: 'Manrope_400Regular',
  label: 'Lexend_500Medium',
};

const Input = React.forwardRef<TextInput, InputProps>(
  (
    {
      label,
      placeholder,
      value,
      onChangeText,
      error,
      secureTextEntry: initialSecureTextEntry = false,
      keyboardType = 'default',
      multiline = false,
      numberOfLines = 1,
      disabled = false,
      style,
      inputStyle,
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const [secureTextEntry, setSecureTextEntry] = useState(initialSecureTextEntry);

    const toggleSecureTextEntry = () => {
      setSecureTextEntry(!secureTextEntry);
    };

    return (
      <View style={[styles.container, style]}>
        {label && <Text style={styles.label}>{label}</Text>}
        <View
          style={[
            styles.inputWrapper,
            isFocused && styles.inputWrapperFocused,
            error && styles.inputWrapperError,
            disabled && styles.inputWrapperDisabled,
          ]}
        >
          <TextInput
            ref={ref}
            style={[styles.input, multiline && styles.multilineInput, inputStyle]}
            placeholder={placeholder}
            placeholderTextColor={colors.textSecondary}
            value={value}
            onChangeText={onChangeText}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            secureTextEntry={secureTextEntry}
            keyboardType={keyboardType}
            multiline={multiline}
            numberOfLines={numberOfLines}
            editable={!disabled}
            selectionColor={colors.primary}
          />
          {initialSecureTextEntry && (
            <TouchableOpacity
              onPress={toggleSecureTextEntry}
              style={styles.eyeIcon}
              disabled={disabled}
            >
              <Ionicons
                name={secureTextEntry ? 'eye-off' : 'eye'}
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  }
);

Input.displayName = 'Input';

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    fontSize: 12,
    fontFamily: typography.label,
    color: colors.text,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
    paddingBottom: 8,
  },
  inputWrapperFocused: {
    borderBottomColor: colors.primary,
  },
  inputWrapperError: {
    borderBottomColor: colors.error,
  },
  inputWrapperDisabled: {
    opacity: 0.5,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: typography.body,
    color: colors.text,
    paddingVertical: 8,
    paddingHorizontal: 0,
  },
  multilineInput: {
    paddingVertical: 12,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  eyeIcon: {
    padding: 8,
    marginLeft: 8,
  },
  errorText: {
    fontSize: 12,
    fontFamily: typography.body,
    color: colors.error,
    marginTop: 6,
  },
});

export default Input;
