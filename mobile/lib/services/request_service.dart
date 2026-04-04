import '../config/supabase_config.dart';
import '../models/blood_request_model.dart';

class RequestService {
  final _client = SupabaseConfig.client;

  Future<List<BloodRequest>> getOpenRequests() async {
    final response = await _client
        .from('blood_requests')
        .select('*, facilities(*)')
        .inFilter('status', ['open', 'in_progress'])
        .order('created_at', ascending: false);

    return (response as List)
        .map((json) => BloodRequest.fromJson(json))
        .toList();
  }

  Future<List<BloodRequest>> getRequestsByBloodType(String bloodType) async {
    final response = await _client
        .from('blood_requests')
        .select('*, facilities(*)')
        .eq('blood_type', bloodType)
        .inFilter('status', ['open', 'in_progress'])
        .order('created_at', ascending: false);

    return (response as List)
        .map((json) => BloodRequest.fromJson(json))
        .toList();
  }
}
