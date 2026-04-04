import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../config/theme.dart';
import '../../services/auth_service.dart';
import '../../services/appointment_service.dart';
import '../../models/user_model.dart';
import '../../models/donor_model.dart';
import '../../models/appointment_model.dart';
import '../../utils/helpers.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final _authService = AuthService();
  final _appointmentService = AppointmentService();

  AppUser? _user;
  Donor? _donor;
  Appointment? _activeAppointment;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final user = await _authService.getCurrentUser();
      final donor = await _authService.getCurrentDonor();

      Appointment? active;
      if (donor != null) {
        active = await _appointmentService.getActiveAppointment(donor.id);
      }

      if (mounted) {
        setState(() {
          _user = user;
          _donor = donor;
          _activeAppointment = active;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString().replaceAll('Exception: ', '');
          _loading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: _loading
            ? const Center(
                child: CircularProgressIndicator(color: AppTheme.primary))
            : _error != null
                ? _buildErrorState()
                : RefreshIndicator(
                    color: AppTheme.primary,
                    onRefresh: _loadData,
                    child: SingleChildScrollView(
                      physics: const AlwaysScrollableScrollPhysics(),
                      padding: const EdgeInsets.all(20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _buildTopBar(),
                          const SizedBox(height: 24),
                          _buildHeroCard(),
                          const SizedBox(height: 20),
                          _buildEligibilitySection(),
                          const SizedBox(height: 20),
                          _buildAppointmentSection(),
                          const SizedBox(height: 20),
                          _buildQuickActions(),
                        ],
                      ),
                    ),
                  ),
      ),
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline,
                size: 64, color: AppTheme.error.withAlpha(128)),
            const SizedBox(height: 16),
            Text(
              'Something went wrong',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            Text(
              _error ?? 'Unknown error',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: _loadData,
              icon: const Icon(Icons.refresh),
              label: const Text('Try Again'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTopBar() {
    return Row(
      children: [
        // Profile avatar
        GestureDetector(
          onTap: () => context.go('/profile'),
          child: Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: AppTheme.primaryContainer.withAlpha(26),
              shape: BoxShape.circle,
              border: Border.all(
                color: AppTheme.primary.withAlpha(51),
                width: 2,
              ),
            ),
            child: Center(
              child: Text(
                _user != null
                    ? '${_user!.firstName[0]}${_user!.lastName[0]}'
                    : '?',
                style: const TextStyle(
                  color: AppTheme.primary,
                  fontWeight: FontWeight.w800,
                  fontSize: 16,
                ),
              ),
            ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Welcome back,',
                style: Theme.of(context).textTheme.bodySmall,
              ),
              Text(
                _user?.firstName ?? 'Donor',
                style: Theme.of(context).textTheme.titleLarge,
              ),
            ],
          ),
        ),
        // Location chip
        if (_donor?.locationName != null)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: AppTheme.surfaceContainerLow,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: AppTheme.outlineVariant.withAlpha(51),
              ),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.location_on,
                    size: 14, color: AppTheme.primary),
                const SizedBox(width: 4),
                Text(
                  _donor!.locationName!,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppTheme.onSurface,
                      ),
                ),
              ],
            ),
          ),
      ],
    );
  }

  Widget _buildHeroCard() {
    final donations = _donor?.totalDonations ?? 0;
    final livesImpacted = donations * 3;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [AppTheme.primary, AppTheme.primaryContainer],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: AppTheme.primary.withAlpha(51),
            blurRadius: 32,
            offset: const Offset(0, 12),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Your Impact',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          color: Colors.white.withAlpha(204),
                        ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        '$donations',
                        style: Theme.of(context)
                            .textTheme
                            .displayLarge
                            ?.copyWith(
                              color: Colors.white,
                              fontSize: 48,
                            ),
                      ),
                      const SizedBox(width: 8),
                      Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: Text(
                          donations == 1 ? 'donation' : 'donations',
                          style: Theme.of(context)
                              .textTheme
                              .titleMedium
                              ?.copyWith(
                                color: Colors.white.withAlpha(179),
                              ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              // Blood type badge
              Container(
                width: 64,
                height: 64,
                decoration: BoxDecoration(
                  color: Colors.white.withAlpha(38),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Center(
                  child: Text(
                    _donor?.bloodType ?? '?',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 22,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            decoration: BoxDecoration(
              color: Colors.white.withAlpha(26),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.favorite, color: Colors.white, size: 16),
                const SizedBox(width: 8),
                Text(
                  '$livesImpacted lives potentially saved',
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w600,
                    fontSize: 13,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEligibilitySection() {
    final daysLeft = _donor?.daysUntilEligible ?? 0;
    final isEligible = _donor?.isEligible ?? true;
    final progress = isEligible ? 1.0 : 1.0 - (daysLeft / 56).clamp(0.0, 1.0);

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppTheme.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: AppTheme.outlineVariant.withAlpha(26),
        ),
      ),
      child: Row(
        children: [
          // Circular progress
          SizedBox(
            width: 72,
            height: 72,
            child: Stack(
              alignment: Alignment.center,
              children: [
                SizedBox(
                  width: 72,
                  height: 72,
                  child: CircularProgressIndicator(
                    value: progress,
                    strokeWidth: 6,
                    backgroundColor: AppTheme.surfaceContainerHigh,
                    color: isEligible ? AppTheme.tertiary : AppTheme.primary,
                    strokeCap: StrokeCap.round,
                  ),
                ),
                isEligible
                    ? const Icon(Icons.check_circle,
                        color: AppTheme.tertiary, size: 28)
                    : Text(
                        '$daysLeft',
                        style:
                            Theme.of(context).textTheme.headlineSmall?.copyWith(
                                  color: AppTheme.primary,
                                  fontWeight: FontWeight.w800,
                                ),
                      ),
              ],
            ),
          ),
          const SizedBox(width: 20),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  isEligible ? 'You\'re Eligible!' : 'Eligibility Status',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: isEligible
                            ? AppTheme.tertiary
                            : AppTheme.onSurface,
                      ),
                ),
                const SizedBox(height: 4),
                Text(
                  isEligible
                      ? 'You can donate blood now. Find an urgent request or book an appointment.'
                      : '$daysLeft days until you\'re eligible to donate again.',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
                if (_donor?.nextEligible != null && !isEligible) ...[
                  const SizedBox(height: 4),
                  Text(
                    'Eligible on ${formatDate(_donor!.nextEligible!)}',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppTheme.primary,
                          fontWeight: FontWeight.w600,
                        ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAppointmentSection() {
    if (_activeAppointment != null) {
      return _buildActiveAppointmentCard();
    }
    return _buildNoAppointmentCard();
  }

  Widget _buildActiveAppointmentCard() {
    final appt = _activeAppointment!;
    return GestureDetector(
      onTap: () => context.push('/ticket/${appt.id}'),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: AppTheme.secondaryFixed,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: AppTheme.secondary.withAlpha(38),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: AppTheme.secondary.withAlpha(26),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.confirmation_number,
                      color: AppTheme.secondary, size: 24),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Upcoming Appointment',
                        style:
                            Theme.of(context).textTheme.titleMedium?.copyWith(
                                  color: AppTheme.secondary,
                                ),
                      ),
                      Text(
                        appt.facilityName ?? 'Hospital',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ],
                  ),
                ),
                const Icon(Icons.chevron_right, color: AppTheme.secondary),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                _buildInfoChip(
                    Icons.calendar_today, formatDate(appt.appointmentDate)),
                const SizedBox(width: 12),
                _buildInfoChip(Icons.access_time, appt.appointmentTime),
                if (appt.ticketCode != null) ...[
                  const SizedBox(width: 12),
                  _buildInfoChip(Icons.qr_code, appt.ticketCode!),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoChip(IconData icon, String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.white.withAlpha(179),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: AppTheme.secondary),
          const SizedBox(width: 4),
          Text(
            text,
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: AppTheme.onSurface,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNoAppointmentCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppTheme.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: AppTheme.outlineVariant.withAlpha(26),
        ),
      ),
      child: Column(
        children: [
          Icon(
            Icons.calendar_today,
            size: 40,
            color: AppTheme.onSurfaceVariant.withAlpha(102),
          ),
          const SizedBox(height: 12),
          Text(
            'No Upcoming Appointments',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 4),
          Text(
            'Respond to an urgent request or book an appointment.',
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodySmall,
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: Container(
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [AppTheme.primary, AppTheme.primaryContainer],
                ),
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: AppTheme.primary.withAlpha(38),
                    blurRadius: 16,
                    offset: const Offset(0, 6),
                  ),
                ],
              ),
              child: ElevatedButton.icon(
                onPressed: () => context.go('/urgent'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.transparent,
                  shadowColor: Colors.transparent,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
                icon: const Icon(Icons.emergency, size: 20),
                label: const Text('Book Urgent Appointment'),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickActions() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Quick Actions',
          style: Theme.of(context).textTheme.titleMedium,
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _buildActionCard(
                icon: Icons.emergency,
                label: 'Urgent\nRequests',
                color: AppTheme.primary,
                onTap: () => context.go('/urgent'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildActionCard(
                icon: Icons.map_outlined,
                label: 'Find\nFacilities',
                color: AppTheme.secondary,
                onTap: () => context.go('/map'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildActionCard(
                icon: Icons.history,
                label: 'Donation\nHistory',
                color: AppTheme.tertiary,
                onTap: () => context.go('/profile'),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildActionCard({
    required IconData icon,
    required String label,
    required Color color,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppTheme.surfaceContainerLowest,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppTheme.outlineVariant.withAlpha(26)),
        ),
        child: Column(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: color.withAlpha(26),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: color, size: 22),
            ),
            const SizedBox(height: 10),
            Text(
              label,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    fontWeight: FontWeight.w600,
                    color: AppTheme.onSurface,
                  ),
            ),
          ],
        ),
      ),
    );
  }
}
