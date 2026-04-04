import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../config/theme.dart';

class RoleSelectionScreen extends StatefulWidget {
  const RoleSelectionScreen({super.key});

  @override
  State<RoleSelectionScreen> createState() => _RoleSelectionScreenState();
}

class _RoleSelectionScreenState extends State<RoleSelectionScreen>
    with TickerProviderStateMixin {
  late AnimationController _pulseController;
  late AnimationController _floatController;
  late AnimationController _fadeController;

  late Animation<double> _pulseAnimation;
  late Animation<double> _floatAnimation;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();

    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat(reverse: true);
    _pulseAnimation = Tween<double>(begin: 0.95, end: 1.05).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );

    _floatController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2000),
    )..repeat(reverse: true);
    _floatAnimation = Tween<double>(begin: -8.0, end: 8.0).animate(
      CurvedAnimation(parent: _floatController, curve: Curves.easeInOut),
    );

    _fadeController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    )..forward();
    _fadeAnimation = CurvedAnimation(
      parent: _fadeController,
      curve: Curves.easeOut,
    );
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _floatController.dispose();
    _fadeController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;

    return Scaffold(
      backgroundColor: AppTheme.background,
      body: Stack(
        children: [
          Positioned.fill(
            child: DecoratedBox(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Color(0xFFFFF0F2),
                    Color(0xFFF8F9FE),
                  ],
                  stops: [0.0, 0.55],
                ),
              ),
            ),
          ),
          Positioned(
            top: -size.width * 0.45,
            left: -size.width * 0.2,
            child: _DecorativeCircle(
              diameter: size.width * 1.1,
              color: AppTheme.primary.withAlpha(10),
            ),
          ),
          Positioned(
            top: -size.width * 0.25,
            right: -size.width * 0.35,
            child: _DecorativeCircle(
              diameter: size.width * 0.85,
              color: AppTheme.primaryContainer.withAlpha(8),
            ),
          ),
          SafeArea(
            child: FadeTransition(
              opacity: _fadeAnimation,
              child: Column(
                children: [
                  const SizedBox(height: 20),
                  _TopPill(),
                  Expanded(
                    child: Stack(
                      alignment: Alignment.center,
                      children: [
                        AnimatedBuilder(
                          animation: _pulseAnimation,
                          builder: (_, __) => Transform.scale(
                            scale: _pulseAnimation.value,
                            child: const _BloodDropHero(),
                          ),
                        ),
                        AnimatedBuilder(
                          animation: _floatAnimation,
                          builder: (_, __) => Transform.translate(
                            offset: Offset(0, _floatAnimation.value),
                            child: Align(
                              alignment: const Alignment(-0.88, -0.55),
                              child: _StatCard(
                                icon: Icons.people_alt_rounded,
                                value: '2,847',
                                label: 'Donors',
                                iconColor: AppTheme.primary,
                              ),
                            ),
                          ),
                        ),
                        AnimatedBuilder(
                          animation: _floatAnimation,
                          builder: (_, __) => Transform.translate(
                            offset: Offset(0, -_floatAnimation.value),
                            child: Align(
                              alignment: const Alignment(0.88, -0.3),
                              child: _StatCard(
                                icon: Icons.favorite_rounded,
                                value: '1,203',
                                label: 'Lives Saved',
                                iconColor: AppTheme.secondary,
                              ),
                            ),
                          ),
                        ),
                        AnimatedBuilder(
                          animation: _floatAnimation,
                          builder: (_, __) => Transform.translate(
                            offset: Offset(0, _floatAnimation.value * 0.6),
                            child: Align(
                              alignment: const Alignment(0.75, 0.72),
                              child: _StatCard(
                                icon: Icons.local_hospital_rounded,
                                value: '15',
                                label: 'Hospitals',
                                iconColor: AppTheme.primaryContainer,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 32),
                    child: Column(
                      children: [
                        Text(
                          'دمك علينا',
                          textDirection: TextDirection.rtl,
                          style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                                color: AppTheme.primary,
                                fontWeight: FontWeight.w800,
                                fontSize: 36,
                                letterSpacing: 0.5,
                              ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Damk 3alena',
                          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                                color: AppTheme.onSurface,
                                fontWeight: FontWeight.w700,
                              ),
                        ),
                        const SizedBox(height: 12),
                        Text(
                          'Predicting blood needs.\nSaving lives in Jordan.',
                          textAlign: TextAlign.center,
                          style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                                color: AppTheme.onSurfaceVariant,
                                height: 1.55,
                              ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 32),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    child: Column(
                      children: [
                        _GradientButton(
                          label: "I'm a Donor",
                          icon: Icons.water_drop_rounded,
                          onTap: () => context.go('/login'),
                        ),
                        const SizedBox(height: 12),
                        _OutlinedSecondaryButton(
                          label: 'I represent a Hospital',
                          icon: Icons.local_hospital_outlined,
                          onTap: () {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                backgroundColor: AppTheme.secondary,
                                behavior: SnackBarBehavior.floating,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(14),
                                ),
                                content: Row(
                                  children: [
                                    const Icon(Icons.open_in_browser_rounded,
                                        color: Colors.white, size: 20),
                                    const SizedBox(width: 10),
                                    Expanded(
                                      child: Text(
                                        'Hospital staff: visit dashboard.damk3alena.app',
                                        style: Theme.of(context)
                                            .textTheme
                                            .bodySmall
                                            ?.copyWith(color: Colors.white),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),
                  Padding(
                    padding: const EdgeInsets.only(bottom: 28),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.shield_rounded,
                          size: 13,
                          color: AppTheme.outline.withAlpha(140),
                        ),
                        const SizedBox(width: 5),
                        Text(
                          'Secure & Private Healthcare Network',
                          style: Theme.of(context).textTheme.labelSmall?.copyWith(
                                color: AppTheme.outline.withAlpha(140),
                                letterSpacing: 0.8,
                              ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _BloodDropHero extends StatelessWidget {
  const _BloodDropHero();

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 220,
      height: 220,
      child: Stack(
        alignment: Alignment.center,
        children: [
          CustomPaint(
            size: const Size(220, 220),
            painter: _GlowRingPainter(
              color: AppTheme.primary.withAlpha(18),
              strokeWidth: 28,
            ),
          ),
          CustomPaint(
            size: const Size(170, 170),
            painter: _GlowRingPainter(
              color: AppTheme.primary.withAlpha(28),
              strokeWidth: 18,
            ),
          ),
          CustomPaint(
            size: const Size(100, 118),
            painter: _BloodDropPainter(),
          ),
          Positioned(
            bottom: 28,
            right: 22,
            child: _BloodTypeBadge(),
          ),
        ],
      ),
    );
  }
}

class _BloodDropPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;

    final gradient = const RadialGradient(
      center: Alignment(0, 0.2),
      radius: 0.7,
      colors: [Color(0xFFB4173C), Color(0xFF8D0029)],
    );
    final paint = Paint()
      ..shader = gradient.createShader(Rect.fromLTWH(0, 0, w, h))
      ..style = PaintingStyle.fill;

    final highlightPaint = Paint()
      ..color = Colors.white.withAlpha(38)
      ..style = PaintingStyle.fill;

    final path = _buildDropPath(w, h);
    canvas.drawShadow(path, AppTheme.primary.withAlpha(90), 12, true);
    canvas.drawPath(path, paint);

    final highlightPath = Path()
      ..addOval(Rect.fromCenter(
        center: Offset(w * 0.38, h * 0.42),
        width: w * 0.2,
        height: h * 0.13,
      ));
    canvas.drawPath(highlightPath, highlightPaint);
  }

  Path _buildDropPath(double w, double h) {
    final path = Path();
    path.moveTo(w / 2, 0);
    path.cubicTo(w * 0.9, h * 0.38, w, h * 0.62, w / 2, h);
    path.cubicTo(0, h * 0.62, w * 0.1, h * 0.38, w / 2, 0);
    path.close();
    return path;
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class _GlowRingPainter extends CustomPainter {
  final Color color;
  final double strokeWidth;

  const _GlowRingPainter({required this.color, required this.strokeWidth});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth;
    canvas.drawCircle(
      Offset(size.width / 2, size.height / 2),
      (size.width - strokeWidth) / 2,
      paint,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class _BloodTypeBadge extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: AppTheme.primary.withAlpha(30),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.water_drop_rounded, size: 12, color: AppTheme.primary),
          const SizedBox(width: 4),
          Text(
            'A+',
            style: TextStyle(
              fontWeight: FontWeight.w800,
              fontSize: 13,
              color: AppTheme.primary,
              letterSpacing: 0.5,
            ),
          ),
        ],
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final IconData icon;
  final String value;
  final String label;
  final Color iconColor;

  const _StatCard({
    required this.icon,
    required this.value,
    required this.label,
    required this.iconColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
              color: Colors.black.withAlpha(14),
              blurRadius: 16,
              offset: const Offset(0, 6)),
          BoxShadow(
              color: iconColor.withAlpha(18),
              blurRadius: 24,
              offset: const Offset(0, 4)),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 34,
            height: 34,
            decoration: BoxDecoration(
              color: iconColor.withAlpha(20),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, size: 18, color: iconColor),
          ),
          const SizedBox(width: 8),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(value,
                  style: TextStyle(
                      fontWeight: FontWeight.w800,
                      fontSize: 14,
                      color: AppTheme.onSurface,
                      height: 1.1)),
              Text(label,
                  style: const TextStyle(
                      fontWeight: FontWeight.w500,
                      fontSize: 10,
                      color: AppTheme.onSurfaceVariant)),
            ],
          ),
        ],
      ),
    );
  }
}

class _TopPill extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
      decoration: BoxDecoration(
        color: AppTheme.primary.withAlpha(14),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppTheme.primary.withAlpha(30)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 7,
            height: 7,
            decoration: const BoxDecoration(
              color: AppTheme.primary,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 6),
          Text(
            "Jordan's Blood Intelligence Network",
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              color: AppTheme.primary,
              letterSpacing: 0.3,
            ),
          ),
        ],
      ),
    );
  }
}

class _GradientButton extends StatefulWidget {
  final String label;
  final IconData icon;
  final VoidCallback onTap;

  const _GradientButton(
      {required this.label, required this.icon, required this.onTap});

  @override
  State<_GradientButton> createState() => _GradientButtonState();
}

class _GradientButtonState extends State<_GradientButton> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => setState(() => _pressed = true),
      onTapUp: (_) {
        setState(() => _pressed = false);
        widget.onTap();
      },
      onTapCancel: () => setState(() => _pressed = false),
      child: AnimatedScale(
        scale: _pressed ? 0.97 : 1.0,
        duration: const Duration(milliseconds: 100),
        child: Container(
          width: double.infinity,
          height: 58,
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFFB4173C), Color(0xFF8D0029)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(18),
            boxShadow: [
              BoxShadow(
                color: AppTheme.primary.withAlpha(70),
                blurRadius: 20,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(widget.icon, color: Colors.white, size: 22),
              const SizedBox(width: 10),
              Text(widget.label,
                  style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w700,
                      fontSize: 16,
                      letterSpacing: 0.2)),
              const SizedBox(width: 10),
              Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: Colors.white.withAlpha(35),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(Icons.arrow_forward_rounded,
                    color: Colors.white, size: 16),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _OutlinedSecondaryButton extends StatefulWidget {
  final String label;
  final IconData icon;
  final VoidCallback onTap;

  const _OutlinedSecondaryButton(
      {required this.label, required this.icon, required this.onTap});

  @override
  State<_OutlinedSecondaryButton> createState() =>
      _OutlinedSecondaryButtonState();
}

class _OutlinedSecondaryButtonState extends State<_OutlinedSecondaryButton> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => setState(() => _pressed = true),
      onTapUp: (_) {
        setState(() => _pressed = false);
        widget.onTap();
      },
      onTapCancel: () => setState(() => _pressed = false),
      child: AnimatedScale(
        scale: _pressed ? 0.97 : 1.0,
        duration: const Duration(milliseconds: 100),
        child: Container(
          width: double.infinity,
          height: 58,
          decoration: BoxDecoration(
            color: _pressed ? AppTheme.secondary.withAlpha(12) : Colors.white,
            borderRadius: BorderRadius.circular(18),
            border:
                Border.all(color: AppTheme.secondary.withAlpha(80), width: 1.5),
            boxShadow: [
              BoxShadow(
                  color: Colors.black.withAlpha(6),
                  blurRadius: 12,
                  offset: const Offset(0, 4)),
            ],
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(widget.icon, color: AppTheme.secondary, size: 22),
              const SizedBox(width: 10),
              Text(widget.label,
                  style: const TextStyle(
                      color: AppTheme.secondary,
                      fontWeight: FontWeight.w700,
                      fontSize: 16,
                      letterSpacing: 0.2)),
            ],
          ),
        ),
      ),
    );
  }
}

class _DecorativeCircle extends StatelessWidget {
  final double diameter;
  final Color color;

  const _DecorativeCircle({required this.diameter, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: diameter,
      height: diameter,
      decoration: BoxDecoration(shape: BoxShape.circle, color: color),
    );
  }
}
