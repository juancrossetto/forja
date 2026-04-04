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
  Linking,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '../../store/authStore';

type SignUpScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

const SignUpScreen: React.FC<SignUpScreenProps> = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const signup = useAuthStore((state) => state.signup);

  const handleSignUp = async () => {
    if (!username || !email || !password) {
      setError('Por favor completa todos los campos');
      return;
    }

    if (!termsAccepted) {
      setError('Debes aceptar los términos y condiciones');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await signup(email, password, username);
      // Navigation will be handled by the auth store
    } catch (err: any) {
      setError(err.message || 'Error al crear la cuenta');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialSignUp = (provider: 'apple' | 'google') => {
    // TODO: Implement social signup
    console.log(`Sign up with ${provider}`);
  };

  const openTermsOfService = () => {
    Linking.openURL('https://metodor3set.com/terms');
  };

  const openPrivacyPolicy = () => {
    Linking.openURL('https://metodor3set.com/privacy');
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
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>EVOLVE</Text>
          <Text style={styles.heroTitle}>YOUR</Text>
          <Text style={styles.heroTitle}>SYSTEM</Text>
          <Text style={styles.heroSubtitle}>
            Join the premium sanctuary of high-performance habits. Nutrition, Psychology, and Training
            integrated into one kinetic experience.
          </Text>
          <View style={styles.progressIndicators}>
            <View style={[styles.indicator, styles.indicatorActive]} />
            <View style={styles.indicator} />
            <View style={styles.indicator} />
          </View>
        </View>

        {/* Main Content */}
        <View style={styles.contentContainer}>
          {/* Header */}
          <View style={styles.headerSection}>
            <Text style={styles.stepLabel}>Step 01 / Registration</Text>
            <Text style={styles.pageTitle}>Create Account</Text>
          </View>

          {/* Social Signup Buttons */}
          <View style={styles.socialButtonsContainer}>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => handleSocialSignUp('google')}
              disabled={loading}
            >
              <Text style={styles.socialButtonIcon}>G</Text>
              <Text style={styles.socialButtonText}>Google</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => handleSocialSignUp('apple')}
              disabled={loading}
            >
              <Text style={styles.socialButtonIcon}>🍎</Text>
              <Text style={styles.socialButtonText}>Apple</Text>
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or with email</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Error Message */}
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Signup Form */}
          <View style={styles.formContainer}>
            {/* Username Field */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Username</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.textInput}
                  placeholder="R3SETTER_01"
                  placeholderTextColor="rgba(255, 255, 255, 0.2)"
                  value={username}
                  onChangeText={setUsername}
                  editable={!loading}
                  autoCapitalize="none"
                  textContentType="username"
                />
                <Text style={styles.inputIcon}>👤</Text>
              </View>
            </View>

            {/* Email Field */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Email Address</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.textInput}
                  placeholder="coach@metodor3set.com"
                  placeholderTextColor="rgba(255, 255, 255, 0.2)"
                  value={email}
                  onChangeText={setEmail}
                  editable={!loading}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  textContentType="emailAddress"
                />
                <Text style={styles.inputIcon}>✉</Text>
              </View>
            </View>

            {/* Password Field */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Password</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.textInput}
                  placeholder="••••••••••••"
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
                    {showPassword ? '👁' : '🔒'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Terms Checkbox */}
            <TouchableOpacity
              style={styles.termsContainer}
              onPress={() => setTermsAccepted(!termsAccepted)}
              disabled={loading}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}>
                {termsAccepted && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <View style={styles.termsTextContainer}>
                <Text style={styles.termsText}>
                  I accept the{' '}
                  <Text
                    style={styles.termsLink}
                    onPress={openTermsOfService}
                  >
                    Terms of Service
                  </Text>
                  {' '}and{' '}
                  <Text
                    style={styles.termsLink}
                    onPress={openPrivacyPolicy}
                  >
                    Privacy Policy
                  </Text>
                  . I understand my data will be used to personalize my R3SET journey.
                </Text>
              </View>
            </TouchableOpacity>

            {/* Sign Up Button */}
            <TouchableOpacity
              style={[styles.signUpButton, loading && styles.signUpButtonDisabled]}
              onPress={handleSignUp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#3b4a00" />
              ) : (
                <Text style={styles.signUpButtonText}>Initialize System</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Login Link */}
          <View style={styles.loginLinkContainer}>
            <Text style={styles.loginLinkText}>Already part of the monolith? </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Login')}
              disabled={loading}
            >
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    paddingBottom: 40,
  },
  heroSection: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
    backgroundColor: '#0e0e0e',
  },
  heroTitle: {
    fontSize: 40,
    fontWeight: '700',
    color: '#c1ed00',
    fontFamily: 'Space Grotesk',
    letterSpacing: -1,
    lineHeight: 44,
  },
  heroSubtitle: {
    fontSize: 15,
    color: 'rgba(173, 170, 170, 1)',
    marginTop: 20,
    marginBottom: 24,
    lineHeight: 22,
    fontFamily: 'Manrope',
  },
  progressIndicators: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  indicator: {
    width: 12,
    height: 2,
    backgroundColor: 'rgba(118, 117, 117, 1)',
    borderRadius: 1,
  },
  indicatorActive: {
    backgroundColor: '#c1ed00',
    width: 48,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  headerSection: {
    marginBottom: 28,
  },
  stepLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
    color: '#00e3fd',
    textTransform: 'uppercase',
    fontFamily: 'Lexend',
    marginBottom: 8,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Space Grotesk',
    letterSpacing: -0.5,
    textTransform: 'uppercase',
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#20201f',
    borderWidth: 1,
    borderColor: 'rgba(72, 72, 71, 0.2)',
    paddingVertical: 12,
    gap: 8,
    borderRadius: 8,
  },
  socialButtonIcon: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  socialButtonText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#FFFFFF',
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
    backgroundColor: 'rgba(72, 72, 71, 0.2)',
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    color: 'rgba(118, 117, 117, 1)',
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
    gap: 20,
  },
  fieldContainer: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    color: 'rgba(118, 117, 117, 1)',
    textTransform: 'uppercase',
    fontFamily: 'Lexend',
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#131313',
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(72, 72, 71, 0.3)',
    borderRadius: 8,
  },
  textInput: {
    flex: 1,
    color: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: 'Manrope',
  },
  inputIcon: {
    paddingRight: 12,
    fontSize: 16,
  },
  visibilityToggle: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  visibilityIcon: {
    fontSize: 16,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: 'rgba(72, 72, 71, 0.6)',
    borderRadius: 4,
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  checkboxChecked: {
    backgroundColor: '#D1FF26',
    borderColor: '#D1FF26',
  },
  checkmark: {
    color: '#0e0e0e',
    fontSize: 12,
    fontWeight: '900',
  },
  termsTextContainer: {
    flex: 1,
  },
  termsText: {
    fontSize: 13,
    color: 'rgba(173, 170, 170, 1)',
    lineHeight: 18,
    fontFamily: 'Manrope',
  },
  termsLink: {
    color: '#00e3fd',
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  signUpButton: {
    backgroundColor: '#cefc22',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#cefc22',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  signUpButtonDisabled: {
    opacity: 0.7,
  },
  signUpButtonText: {
    color: '#3b4a00',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
    fontFamily: 'Space Grotesk',
  },
  loginLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 28,
  },
  loginLinkText: {
    fontSize: 13,
    color: 'rgba(173, 170, 170, 1)',
    fontFamily: 'Manrope',
  },
  loginLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#c1ed00',
    fontFamily: 'Space Grotesk',
  },
});

export default SignUpScreen;
