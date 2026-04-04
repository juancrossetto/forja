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
import Svg, { Path } from 'react-native-svg';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '../../store/authStore';
import { useGoogleAuth } from '../../lib/auth/googleAuth';
import { signInWithApple, isAppleAuthAvailable } from '../../lib/auth/appleAuth';

type LoginScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

const AppleLogo = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.3.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"
      fill="rgba(255,255,255,0.85)"
    />
  </Svg>
);

const GoogleLogo = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <Path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <Path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <Path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </Svg>
);

const EyeOpen = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
      stroke="rgba(255,255,255,0.5)"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"
      stroke="rgba(255,255,255,0.5)"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const EyeClosed = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22"
      stroke="rgba(255,255,255,0.5)"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const login = useAuthStore((state) => state.login);
  const loginWithGoogle = useAuthStore((state) => state.loginWithGoogle);
  const loginWithApple = useAuthStore((state) => state.loginWithApple);

  const { promptGoogleSignIn, isReady: isGoogleReady } = useGoogleAuth({
    onSuccess: async (idToken) => {
      setError('');
      await loginWithGoogle(idToken);
    },
    onError: (err) => setError(err.message),
  });

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Por favor completa todos los campos');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await login(email, password, rememberMe);
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const { identityToken, email: appleEmail, fullName } = await signInWithApple();
      await loginWithApple(identityToken, appleEmail, fullName);
    } catch (err: any) {
      if (err.code !== 'ERR_REQUEST_CANCELED') {
        setError(err.message || 'Error al iniciar sesión con Apple');
      }
    } finally {
      setLoading(false);
    }
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
        {/* Brand Header */}
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
              onPress={handleAppleLogin}
              disabled={loading || Platform.OS !== 'ios'}
            >
              <AppleLogo />
              <Text style={styles.socialButtonText}>Apple</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.socialButton, !isGoogleReady && styles.socialButtonDisabled]}
              onPress={promptGoogleSignIn}
              disabled={loading || !isGoogleReady}
            >
              <GoogleLogo />
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
                  {showPassword ? <EyeOpen /> : <EyeClosed />}
                </TouchableOpacity>
              </View>
            </View>

            {/* Remember Me */}
            <TouchableOpacity
              style={styles.rememberMeContainer}
              onPress={() => setRememberMe(!rememberMe)}
              disabled={loading}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                {rememberMe && <Text style={styles.checkboxTick}>✓</Text>}
              </View>
              <Text style={styles.rememberMeText}>Recordarme</Text>
            </TouchableOpacity>

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
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 14,
    gap: 8,
    borderRadius: 10,
  },
  socialButtonDisabled: {
    opacity: 0.4,
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
    borderRadius: 8,
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
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: 10,
    color: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 13,
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
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: 10,
  },
  passwordTextInput: {
    flex: 1,
    color: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 14,
    fontFamily: 'Manrope',
  },
  visibilityToggle: {
    paddingHorizontal: 14,
    paddingVertical: 13,
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
    borderRadius: 10,
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
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: -8,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#D1FF26',
    borderColor: '#D1FF26',
  },
  checkboxTick: {
    fontSize: 11,
    fontWeight: '900',
    color: '#0e0e0e',
    lineHeight: 14,
  },
  rememberMeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    color: 'rgba(173, 170, 170, 1)',
    textTransform: 'uppercase',
    fontFamily: 'Lexend',
  },
});

export default LoginScreen;
