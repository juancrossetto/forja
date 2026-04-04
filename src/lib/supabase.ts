import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

const SUPABASE_URL = 'https://nvgurlswapywigtsdkwp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52Z3VybHN3YXB5d2lndHNka3dwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzMTYwODQsImV4cCI6MjA5MDg5MjA4NH0.5X7EkuKwQbfS-pzXzGdxrR_9TztW0gAWsB8vrTXkEow';

// Adaptador de storage usando expo-secure-store (encriptado en el dispositivo)
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
