class Facility {
  final String id;
  final String name;
  final String type;
  final String? address;
  final String? city;
  final String? region;
  final double latitude;
  final double longitude;
  final String? phone;
  final String? workingHours;

  Facility({
    required this.id,
    required this.name,
    required this.type,
    this.address,
    this.city,
    this.region,
    required this.latitude,
    required this.longitude,
    this.phone,
    this.workingHours,
  });

  factory Facility.fromJson(Map<String, dynamic> json) {
    return Facility(
      id: json['id'],
      name: json['name'],
      type: json['type'],
      address: json['address'],
      city: json['city'],
      region: json['region'],
      latitude: (json['latitude'] as num).toDouble(),
      longitude: (json['longitude'] as num).toDouble(),
      phone: json['phone'],
      workingHours: json['working_hours'],
    );
  }
}
