import 'package:supabase_flutter/supabase_flutter.dart';
import '../config/supabase_config.dart';
import '../models/user_model.dart';
import '../models/donor_model.dart';

class AuthService {
  final SupabaseClient _client = SupabaseConfig.client;

  User? get currentAuthUser => _client.auth.currentUser;

  Stream<AuthState> get authStateChanges => _client.auth.onAuthStateChange;

  Future<AppUser?> getCurrentUser() async {
    final authUser = currentAuthUser;
    if (authUser == null) return null;

    final response = await _client
        .from('users')
        .select()
        .eq('auth_id', authUser.id)
        .maybeSingle();

    if (response == null) return null;
    return AppUser.fromJson(response);
  }

  Future<Donor?> getCurrentDonor() async {
    final user = await getCurrentUser();
    if (user == null) return null;

    final response = await _client
        .from('donors')
        .select()
        .eq('user_id', user.id)
        .maybeSingle();

    if (response == null) return null;
    return Donor.fromJson(response);
  }

  Future<void> signIn({required String phone, required String password}) async {
    // Use phone as email identifier for simplicity
    final email = 'donor_${phone.replaceAll(RegExp(r'[^0-9]'), '')}@damk3alena.app';
    await _client.auth.signInWithPassword(email: email, password: password);
  }

  Future<void> signUp({
    required String firstName,
    required String lastName,
    required String phone,
    required String password,
    required String nationalId,
    required String bloodType,
    required String gender,
    required DateTime birthDate,
  }) async {
    // Use phone as email identifier
    final email = 'donor_${phone.replaceAll(RegExp(r'[^0-9]'), '')}@damk3alena.app';

    final authResponse = await _client.auth.signUp(
      email: email,
      password: password,
    );

    if (authResponse.user == null) {
      throw Exception('Sign up failed');
    }

    // Create user record
    final userResponse = await _client.from('users').insert({
      'auth_id': authResponse.user!.id,
      'role': 'donor',
      'first_name': firstName,
      'last_name': lastName,
      'phone': phone,
      'email': email,
    }).select().single();

    // Create donor record
    await _client.from('donors').insert({
      'user_id': userResponse['id'],
      'national_id': nationalId,
      'blood_type': bloodType,
      'gender': gender,
      'birth_date': birthDate.toIso8601String().split('T')[0],
    });
  }

  Future<void> signOut() async {
    await _client.auth.signOut();
  }

  Future<void> updateDonorLocation(double lat, double lng, String? name) async {
    final donor = await getCurrentDonor();
    if (donor == null) return;

    await _client.from('donors').update({
      'latitude': lat,
      'longitude': lng,
      'location_name': name,
    }).eq('id', donor.id);
  }
}
