import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '../../stores/authStore';

type LoginScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const login = useAuthStore((state) => state.login);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Por favor completa todos los campos');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await login(email, password);
      // Navigation will be handled by the auth store
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider: 'apple' | 'google') => {
    // TODO: Implement social login
    console.log(`Login with ${provider}`);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Brand Header - Mobile Only */}
        <View style={styles.brandHeader}>
          <Text style={styles.brandText}>METODO</Text>
          <View style={styles.r3setContainer}>
            <Text style={styles.r3setText}>R3</Text>
            <Text style={styles.r3setText}>SET</Text>
          </View>
        </View>

        {/* Main Content */}
        <View style={styles.contentContainer}>
          {/* Welcome Header */}
          <View style={styles.headerSection}>
            <Text style={styles.welcomeTitle}>Bienvenido</Text>
            <Text style={styles.welcomeSubtitle}>Ingresa tus credenciales para continuar</Text>
          </View>

          {/* Social Login Buttons */}
          <View style={styles.socialButtonsContainer}>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => handleSocialLogin('apple')}
              disabled={loading}
            >
              <Text style={styles.socialButtonIcon}>􀀶</Text>
              <Text style={styles.socialButtonText}>Apple</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => handleSocialLogin('google')}
              disabled={loading}
            >
              <Text style={styles.socialButtonIcon}>􀀷</Text>
              <Text style={styles.socialButtonText}>Google</Text>
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>o continúa con correo</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Error Message */}
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Login Form */}
          <View style={styles.formContainer}>
            {/* Email Field */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Email</Text>
              <TextInput
                style={styles.textInput}
                placeholder="nombre@ejemplo.com"
                placeholderTextColor="rgba(255, 255, 255, 0.2)"
                value={email}
                onChangeText={setEmail}
                editable={!loading}
                autoCapitalize="none"
                keyboardType="email-address"
                textContentType="emailAddress"
              />
            </View>

            {/* Password Field */}
            <View style={styles.fieldContainer}>
              <View style={styles.passwordLabelContainer}>
                <Text style={styles.fieldLabel}>Password</Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('ForgotPassword')}
                  disabled={loading}
                >
                  <Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={styles.passwordTextInput}
                  placeholder="••••••••"
                  placeholderTextColor="rgba(255, 255, 255, 0.2)"
                  value={password}
                  onChangeText={setPassword}
                  editable={!loading}
                  secureTextEntry={!showPassword}
                  textContentType="password"
                />
                <TouchableOpacity
                  style={styles.visibilityToggle}
                  onPress={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  <Text style={styles.visibilityIcon}>
                    {showPassword ? '􀁟' : '􀁞'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#0e0e0e" />
              ) : (
                <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Sign Up Link */}
          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>¿No tenés cuenta? </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('SignUp')}
              disabled={loading}
            >
              <Text style={styles.signUpLink}>Registrate</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Gradient Accents (Simulated with spacers) */}
        <View style={styles.accentBottom} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0e0e0e',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  brandHeader: {
    marginBottom: 40,
    alignItems: 'flex-start',
  },
  brandText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: 'Lexend',
  },
  r3setContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  r3setText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#D1FF26',
    fontFamily: 'Space Grotesk',
    letterSpacing: -1,
  },
  contentContainer: {
    width: '100%',
  },
  headerSection: {
    marginBottom: 32,
  },
  welcomeTitle: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    fontFamily: 'Space Grotesk',
    letterSpacing: -0.5,
  },
  welcomeSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    color: 'rgba(173, 170, 170, 1)',
    textTransform: 'uppercase',
    fontFamily: 'Lexend',
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 16,
    gap: 8,
    borderRadius: 4,
  },
  socialButtonIcon: {
    fontSize: 20,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  socialButtonText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: 'rgba(255, 255, 255, 0.7)',
    textTransform: 'uppercase',
    fontFamily: 'Lexend',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.3,
    color: 'rgba(173, 170, 170, 0.5)',
    textTransform: 'uppercase',
    fontFamily: 'Lexend',
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 115, 81, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: '#ff7351',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    borderRadius: 2,
  },
  errorText: {
    color: '#ff7351',
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Manrope',
  },
  formContainer: {
    gap: 24,
  },
  fieldContainer: {
    gap: 4,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    color: 'rgba(173, 170, 170, 1)',
    textTransform: 'uppercase',
    fontFamily: 'Lexend',
    marginLeft: 4,
  },
  textInput: {
    backgroundColor: '#131313',
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    color: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: 'Manrope',
  },
  passwordLabelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#131313',
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  passwordTextInput: {
    flex: 1,
    color: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: 'Manrope',
  },
  visibilityToggle: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  visibilityIcon: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  forgotPasswordText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#00e3fd',
    textTransform: 'uppercase',
    fontFamily: 'Lexend',
  },
  loginButton: {
    backgroundColor: '#D1FF26',
    paddingVertical: 16,
    borderRadius: 2,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#D1FF26',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 12,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#0e0e0e',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.5,
    textTransform: 'uppercase',
    fontFamily: 'Space Grotesk',
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },
  footerText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    color: 'rgba(173, 170, 170, 1)',
    textTransform: 'uppercase',
    fontFamily: 'Lexend',
  },
  signUpLink: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#D1FF26',
    textTransform: 'uppercase',
    fontFamily: 'Lexend',
  },
  accentBottom: {
    height: 1,
  },
});

export default LoginScreen;
