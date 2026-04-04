class AppUser {
  final String id;
  final String authId;
  final String role;
  final String firstName;
  final String lastName;
  final String? phone;
  final String? email;
  final DateTime createdAt;

  AppUser({
    required this.id,
    required this.authId,
    required this.role,
    required this.firstName,
    required this.lastName,
    this.phone,
    this.email,
    required this.createdAt,
  });

  factory AppUser.fromJson(Map<String, dynamic> json) {
    return AppUser(
      id: json['id'],
      authId: json['auth_id'],
      role: json['role'],
      firstName: json['first_name'],
      lastName: json['last_name'],
      phone: json['phone'],
      email: json['email'],
      createdAt: DateTime.parse(json['created_at'] ?? DateTime.now().toIso8601String()),
    );
  }

  String get fullName => '$firstName $lastName';
}
