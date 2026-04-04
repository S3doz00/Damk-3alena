import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../config/theme.dart';
import '../../services/appointment_service.dart';
import '../../services/auth_service.dart';
import '../../models/appointment_model.dart';
import '../../utils/helpers.dart';

class TicketScreen extends StatefulWidget {
  final String appointmentId;

  const TicketScreen({super.key, required this.appointmentId});

  @override
  State<TicketScreen> createState() => _TicketScreenState();
}

class _TicketScreenState extends State<TicketScreen> {
  final _appointmentService = AppointmentService();
  final _authService = AuthService();

  Appointment? _appointment;
  bool _loading = true;
  bool _cancelling = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadAppointment();
  }

  Future<void> _loadAppointment() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final donor = await _authService.getCurrentDonor();
      if (donor == null) throw Exception('Donor profile not found');

      final appointments =
          await _appointmentService.getMyAppointments(donor.id);
      final match = appointments
          .where((a) => a.id == widget.appointmentId)
          .toList();

      if (mounted) {
        setState(() {
          _appointment = match.isNotEmpty ? match.first : null;
          _loading = false;
          if (_appointment == null) {
            _error = 'Appointment not found.';
          }
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

  Future<void> _handleCancel() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Cancel Appointment'),
        content: const Text(
            'Are you sure you want to cancel this appointment? The patient may still need blood.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Keep It'),
          ),
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            style: TextButton.styleFrom(foregroundColor: AppTheme.error),
            child: const Text('Cancel Appointment'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    setState(() => _cancelling = true);

    try {
      await _appointmentService.cancelAppointment(widget.appointmentId);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Appointment cancelled')),
        );
        context.go('/home');
      }
    } catch (e) {
      if (mounted) {
        setState(() => _cancelling = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content: Text(
                  'Failed to cancel: ${e.toString().replaceAll('Exception: ', '')}')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppTheme.primary),
          onPressed: () => context.go('/home'),
        ),
        title: Text(
          'Your Ticket',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                color: AppTheme.primary,
              ),
        ),
        centerTitle: true,
      ),
      body: _loading
          ? const Center(
              child: CircularProgressIndicator(color: AppTheme.primary))
          : _error != null && _appointment == null
              ? _buildErrorState()
              : SingleChildScrollView(
                  padding: const EdgeInsets.fromLTRB(20, 8, 20, 40),
                  child: Column(
                    children: [
                      _buildTicketCard(),
                      const SizedBox(height: 24),
                      if (_appointment?.isActive == true)
                        _buildCancelButton(),
                      const SizedBox(height: 16),
                      _buildBackToHomeButton(),
                    ],
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
            Text(_error ?? 'Something went wrong',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () => context.go('/home'),
              child: const Text('Go Home'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTicketCard() {
    final appt = _appointment!;

    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: AppTheme.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(13),
            blurRadius: 32,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        children: [
          // Header with gradient
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(24),
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [AppTheme.primary, AppTheme.primaryContainer],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
            ),
            child: Column(
              children: [
                const Icon(Icons.check_circle, color: Colors.white, size: 48),
                const SizedBox(height: 12),
                Text(
                  appt.isActive ? 'Appointment Booked!' : 'Appointment ${appt.status.toUpperCase()}',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                        color: Colors.white,
                      ),
                ),
                const SizedBox(height: 4),
                Text(
                  appt.facilityName ?? 'Hospital',
                  style: TextStyle(
                    color: Colors.white.withAlpha(204),
                    fontSize: 15,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),

          // Dashed divider illusion
          Container(
            width: double.infinity,
            height: 1,
            color: AppTheme.outlineVariant.withAlpha(38),
          ),

          // Ticket details
          Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              children: [
                // Ticket code (large)
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(vertical: 20),
                  decoration: BoxDecoration(
                    color: AppTheme.surfaceContainerLow,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: AppTheme.primary.withAlpha(26),
                      width: 2,
                    ),
                  ),
                  child: Column(
                    children: [
                      Text(
                        'TICKET CODE',
                        style:
                            Theme.of(context).textTheme.labelSmall?.copyWith(
                                  letterSpacing: 2,
                                  color: AppTheme.onSurfaceVariant,
                                ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        appt.ticketCode ?? '---',
                        style: Theme.of(context)
                            .textTheme
                            .headlineLarge
                            ?.copyWith(
                              color: AppTheme.primary,
                              letterSpacing: 2,
                            ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 20),

                // Date & Time row
                Row(
                  children: [
                    Expanded(
                      child: _buildDetailItem(
                        icon: Icons.calendar_today,
                        label: 'Date',
                        value: formatDate(appt.appointmentDate),
                      ),
                    ),
                    Container(
                      width: 1,
                      height: 48,
                      color: AppTheme.outlineVariant.withAlpha(51),
                    ),
                    Expanded(
                      child: _buildDetailItem(
                        icon: Icons.access_time,
                        label: 'Time',
                        value: appt.appointmentTime,
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 16),

                // Status & Type row
                Row(
                  children: [
                    Expanded(
                      child: _buildDetailItem(
                        icon: Icons.info_outline,
                        label: 'Status',
                        value: appt.status.toUpperCase(),
                      ),
                    ),
                    Container(
                      width: 1,
                      height: 48,
                      color: AppTheme.outlineVariant.withAlpha(51),
                    ),
                    Expanded(
                      child: _buildDetailItem(
                        icon: Icons.directions_walk,
                        label: 'Type',
                        value: appt.isWalkin ? 'Walk-in' : 'Scheduled',
                      ),
                    ),
                  ],
                ),

                // Patient file number
                if (appt.patientFileNo != null) ...[
                  const SizedBox(height: 16),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: AppTheme.secondaryFixed,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.folder_outlined,
                            size: 18, color: AppTheme.secondary),
                        const SizedBox(width: 10),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Patient File No.',
                              style: Theme.of(context)
                                  .textTheme
                                  .bodySmall
                                  ?.copyWith(fontSize: 11),
                            ),
                            Text(
                              appt.patientFileNo!,
                              style: Theme.of(context)
                                  .textTheme
                                  .titleMedium
                                  ?.copyWith(
                                    color: AppTheme.secondary,
                                  ),
                            ),
                          ],
                        ),
                      ],
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

  Widget _buildDetailItem({
    required IconData icon,
    required String label,
    required String value,
  }) {
    return Column(
      children: [
        Icon(icon, size: 20, color: AppTheme.onSurfaceVariant),
        const SizedBox(height: 6),
        Text(
          label,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                fontSize: 11,
              ),
        ),
        const SizedBox(height: 2),
        Text(
          value,
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontSize: 14,
              ),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }

  Widget _buildCancelButton() {
    return SizedBox(
      width: double.infinity,
      child: OutlinedButton.icon(
        onPressed: _cancelling ? null : _handleCancel,
        icon: _cancelling
            ? const SizedBox(
                width: 18,
                height: 18,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: AppTheme.error,
                ),
              )
            : const Icon(Icons.cancel_outlined),
        label: Text(_cancelling ? 'Cancelling...' : 'Cancel Appointment'),
        style: OutlinedButton.styleFrom(
          foregroundColor: AppTheme.error,
          side: BorderSide(color: AppTheme.error.withAlpha(77)),
          padding: const EdgeInsets.symmetric(vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
        ),
      ),
    );
  }

  Widget _buildBackToHomeButton() {
    return SizedBox(
      width: double.infinity,
      child: TextButton.icon(
        onPressed: () => context.go('/home'),
        icon: const Icon(Icons.home_outlined),
        label: const Text('Back to Home'),
        style: TextButton.styleFrom(
          foregroundColor: AppTheme.secondary,
          padding: const EdgeInsets.symmetric(vertical: 14),
        ),
      ),
    );
  }
}
