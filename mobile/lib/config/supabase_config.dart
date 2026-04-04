import 'package:supabase_flutter/supabase_flutter.dart';

class SupabaseConfig {
  // Replace these with your actual Supabase project credentials
  static const String supabaseUrl = 'https://llmsozcbogckiwpazvkv.supabase.co';
  static const String supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxsbXNvemNib2dja2l3cGF6dmt2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4NzE4MjMsImV4cCI6MjA5MDQ0NzgyM30.HFtL8Hf6zOMkBC0HoDn7ZWbQIIsEynUkpVgaVPEpJH8';

  static Future<void> initialize() async {
    await Supabase.initialize(
      url: supabaseUrl,
      anonKey: supabaseAnonKey,
    );
  }

  static SupabaseClient get client => Supabase.instance.client;
}
