import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://fyushkwhotqyihzuekhr.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5dXNoa3dob3RxeWloenVla2hyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNTIzNjMsImV4cCI6MjA5MDYyODM2M30.RPcHD2K5kEkypqB2f_v_lvgnN-Q3RndUlF67esYGfAY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
