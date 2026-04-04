class BloodRequest {
  final String id;
  final String facilityId;
  final String bloodType;
  final int unitsNeeded;
  final String urgency;
  final String status;
  final String? patientName;
  final String? patientFileNo;
  final String? notes;
  final DateTime createdAt;
  // Joined facility data
  final String? facilityName;
  final double? facilityLat;
  final double? facilityLng;
  final String? facilityCity;
  final String? workingHours;

  BloodRequest({
    required this.id,
    required this.facilityId,
    required this.bloodType,
    required this.unitsNeeded,
    required this.urgency,
    required this.status,
    this.patientName,
    this.patientFileNo,
    this.notes,
    required this.createdAt,
    this.facilityName,
    this.facilityLat,
    this.facilityLng,
    this.facilityCity,
    this.workingHours,
  });

  factory BloodRequest.fromJson(Map<String, dynamic> json) {
    final facility = json['facilities'] as Map<String, dynamic>?;
    return BloodRequest(
      id: json['id'],
      facilityId: json['facility_id'],
      bloodType: json['blood_type'],
      unitsNeeded: json['units_needed'] ?? 1,
      urgency: json['urgency'] ?? 'normal',
      status: json['status'] ?? 'open',
      patientName: json['patient_name'],
      patientFileNo: json['patient_file_no'],
      notes: json['notes'],
      createdAt: DateTime.parse(json['created_at']),
      facilityName: facility?['name'],
      facilityLat: (facility?['latitude'] as num?)?.toDouble(),
      facilityLng: (facility?['longitude'] as num?)?.toDouble(),
      facilityCity: facility?['city'],
      workingHours: facility?['working_hours'],
    );
  }
}
