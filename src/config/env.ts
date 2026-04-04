/**
 * Configuración centralizada de variables de entorno.
 * Todas las API keys y configuraciones externas deben leerse desde aquí.
 *
 * Variables con EXPO_PUBLIC_ son inlineadas en build time por Expo (SDK 49+).
 * Nunca incluir secretos server-side aquí — solo claves públicas.
 */

function required(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `[Config] Variable de entorno requerida no encontrada: ${key}\n` +
      `Asegurate de tener un archivo .env con esa variable definida.`
    );
  }
  return value;
}

export const ENV = {
  // Supabase
  SUPABASE_URL: required('EXPO_PUBLIC_SUPABASE_URL'),
  SUPABASE_ANON_KEY: required('EXPO_PUBLIC_SUPABASE_ANON_KEY'),

  // Google OAuth (vacíos hasta configurar en Google Cloud Console)
  GOOGLE_WEB_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '',
  GOOGLE_IOS_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '',
  GOOGLE_ANDROID_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? '',
} as const;
