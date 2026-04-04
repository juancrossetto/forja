import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';

/**
 * Inicia el flujo nativo de Sign in with Apple.
 * Solo disponible en iOS. Lanza error en otras plataformas.
 *
 * Retorna el identityToken JWT para validar con Supabase.
 */
export async function signInWithApple(): Promise<{
  identityToken: string;
  email: string | null;
  fullName: string | null;
}> {
  if (Platform.OS !== 'ios') {
    throw new Error('Sign in with Apple solo está disponible en iOS');
  }

  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });

  if (!credential.identityToken) {
    throw new Error('Apple no devolvió un identity token válido');
  }

  const fullName = [credential.fullName?.givenName, credential.fullName?.familyName]
    .filter(Boolean)
    .join(' ') || null;

  return {
    identityToken: credential.identityToken,
    email: credential.email,
    fullName,
  };
}

/** Verificar si Apple Sign In está disponible en el dispositivo */
export const isAppleAuthAvailable = async () => {
  if (Platform.OS !== 'ios') return false;
  return AppleAuthentication.isAvailableAsync();
};
