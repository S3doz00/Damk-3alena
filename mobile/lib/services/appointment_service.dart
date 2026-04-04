import 'package:uuid/uuid.dart';
import '../config/supabase_config.dart';
import '../models/appointment_model.dart';

class AppointmentService {
  final _client = SupabaseConfig.client;

  Future<List<Appointment>> getMyAppointments(String donorId) async {
    final response = await _client
        .from('appointments')
        .select('*, facilities(*), blood_requests(*)')
        .eq('donor_id', donorId)
        .order('appointment_date', ascending: false);

    return (response as List)
        .map((json) => Appointment.fromJson(json))
        .toList();
  }

  Future<Appointment?> getActiveAppointment(String donorId) async {
    final response = await _client
        .from('appointments')
        .select('*, facilities(*), blood_requests(*)')
        .eq('donor_id', donorId)
        .eq('status', 'booked')
        .order('appointment_date')
        .limit(1)
        .maybeSingle();

    if (response == null) return null;
    return Appointment.fromJson(response);
  }

  Future<Appointment> bookAppointment({
    required String donorId,
    required String facilityId,
    required String requestId,
    required DateTime date,
    required String time,
    bool isWalkin = false,
  }) async {
    final ticketCode = 'DMK-${const Uuid().v4().substring(0, 8).toUpperCase()}';

    final response = await _client.from('appointments').insert({
      'donor_id': donorId,
      'facility_id': facilityId,
      'request_id': requestId,
      'appointment_date': date.toIso8601String().split('T')[0],
      'appointment_time': time,
      'status': 'booked',
      'is_walkin': isWalkin,
      'ticket_code': ticketCode,
    }).select('*, facilities(*), blood_requests(*)').single();

    return Appointment.fromJson(response);
  }

  Future<void> cancelAppointment(String appointmentId) async {
    await _client.from('appointments').update({
      'status': 'cancelled',
    }).eq('id', appointmentId);
  }
}
