import { useEffect } from 'react';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { ENV } from '../../config/env';

WebBrowser.maybeCompleteAuthSession();

export function useGoogleAuth({
  onSuccess,
  onError,
}: {
  onSuccess: (idToken: string) => void;
  onError: (err: Error) => void;
}) {
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: ENV.GOOGLE_WEB_CLIENT_ID,
    iosClientId: ENV.GOOGLE_IOS_CLIENT_ID,
    androidClientId: ENV.GOOGLE_ANDROID_CLIENT_ID,
  });

  useEffect(() => {
    if (!response) return;

    if (response.type === 'success') {
      const idToken = response.params?.id_token;
      if (idToken) {
        onSuccess(idToken);
      } else {
        onError(new Error('Google no devolvió un ID token válido'));
      }
    } else if (response.type === 'error') {
      onError(new Error(response.error?.message ?? 'Error al iniciar sesión con Google'));
    }
  }, [response]);

  return {
    promptGoogleSignIn: () => promptAsync(),
    isReady: !!request,
  };
}
