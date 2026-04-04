class Appointment {
  final String id;
  final String donorId;
  final String facilityId;
  final String? requestId;
  final DateTime appointmentDate;
  final String appointmentTime;
  final String status;
  final bool isWalkin;
  final String? ticketCode;
  // Joined data
  final String? facilityName;
  final String? patientFileNo;

  Appointment({
    required this.id,
    required this.donorId,
    required this.facilityId,
    this.requestId,
    required this.appointmentDate,
    required this.appointmentTime,
    required this.status,
    this.isWalkin = false,
    this.ticketCode,
    this.facilityName,
    this.patientFileNo,
  });

  factory Appointment.fromJson(Map<String, dynamic> json) {
    final facility = json['facilities'] as Map<String, dynamic>?;
    final request = json['blood_requests'] as Map<String, dynamic>?;
    return Appointment(
      id: json['id'],
      donorId: json['donor_id'],
      facilityId: json['facility_id'],
      requestId: json['request_id'],
      appointmentDate: DateTime.parse(json['appointment_date']),
      appointmentTime: json['appointment_time'],
      status: json['status'],
      isWalkin: json['is_walkin'] ?? false,
      ticketCode: json['ticket_code'],
      facilityName: facility?['name'],
      patientFileNo: request?['patient_file_no'],
    );
  }

  bool get isActive => status == 'booked';
}
