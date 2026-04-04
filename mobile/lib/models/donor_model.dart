class Donor {
  final String id;
  final String userId;
  final String nationalId;
  final String bloodType;
  final String gender;
  final DateTime birthDate;
  final double? latitude;
  final double? longitude;
  final String? locationName;
  final bool isEligible;
  final DateTime? nextEligible;
  final int totalDonations;
  final DateTime? lastDonation;

  Donor({
    required this.id,
    required this.userId,
    required this.nationalId,
    required this.bloodType,
    required this.gender,
    required this.birthDate,
    this.latitude,
    this.longitude,
    this.locationName,
    this.isEligible = true,
    this.nextEligible,
    this.totalDonations = 0,
    this.lastDonation,
  });

  factory Donor.fromJson(Map<String, dynamic> json) {
    return Donor(
      id: json['id'],
      userId: json['user_id'],
      nationalId: json['national_id'],
      bloodType: json['blood_type'],
      gender: json['gender'],
      birthDate: DateTime.parse(json['birth_date']),
      latitude: (json['latitude'] as num?)?.toDouble(),
      longitude: (json['longitude'] as num?)?.toDouble(),
      locationName: json['location_name'],
      isEligible: json['is_eligible'] ?? true,
      nextEligible: json['next_eligible'] != null
          ? DateTime.parse(json['next_eligible'])
          : null,
      totalDonations: json['total_donations'] ?? 0,
      lastDonation: json['last_donation'] != null
          ? DateTime.parse(json['last_donation'])
          : null,
    );
  }

  int get daysUntilEligible {
    if (nextEligible == null) return 0;
    final diff = nextEligible!.difference(DateTime.now()).inDays;
    return diff > 0 ? diff : 0;
  }
}
