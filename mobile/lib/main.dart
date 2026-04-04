import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'config/supabase_config.dart';
import 'config/theme.dart';
import 'screens/role_selection_screen.dart';
import 'screens/auth/login_screen.dart';
import 'screens/auth/signup_screen.dart';
import 'screens/home/home_screen.dart';
import 'screens/urgent/urgent_screen.dart';
import 'screens/map/map_screen.dart';
import 'screens/profile/profile_screen.dart';
import 'screens/booking/booking_screen.dart';
import 'screens/booking/ticket_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await SupabaseConfig.initialize();
  runApp(const DamkApp());
}

class DamkApp extends StatelessWidget {
  const DamkApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'Damk 3alena',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      routerConfig: _router,
    );
  }
}

final _router = GoRouter(
  initialLocation: '/',
  routes: [
    GoRoute(
      path: '/',
      builder: (context, state) => const RoleSelectionScreen(),
    ),
    GoRoute(
      path: '/login',
      builder: (context, state) => const LoginScreen(),
    ),
    GoRoute(
      path: '/signup',
      builder: (context, state) => const SignupScreen(),
    ),
    // Main donor app with bottom navigation
    StatefulShellRoute.indexedStack(
      builder: (context, state, shell) => DonorShell(navigationShell: shell),
      branches: [
        StatefulShellBranch(routes: [
          GoRoute(
            path: '/home',
            builder: (context, state) => const HomeScreen(),
          ),
        ]),
        StatefulShellBranch(routes: [
          GoRoute(
            path: '/map',
            builder: (context, state) => const MapScreen(),
          ),
        ]),
        StatefulShellBranch(routes: [
          GoRoute(
            path: '/urgent',
            builder: (context, state) => const UrgentScreen(),
          ),
        ]),
        StatefulShellBranch(routes: [
          GoRoute(
            path: '/profile',
            builder: (context, state) => const ProfileScreen(),
          ),
        ]),
      ],
    ),
    GoRoute(
      path: '/booking/:requestId',
      builder: (context, state) => BookingScreen(
        requestId: state.pathParameters['requestId']!,
      ),
    ),
    GoRoute(
      path: '/ticket/:appointmentId',
      builder: (context, state) => TicketScreen(
        appointmentId: state.pathParameters['appointmentId']!,
      ),
    ),
  ],
);

/// Shell widget with bottom navigation bar for donor screens
class DonorShell extends StatelessWidget {
  final StatefulNavigationShell navigationShell;

  const DonorShell({super.key, required this.navigationShell});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: navigationShell,
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: Colors.white.withAlpha(179),
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          boxShadow: [
            BoxShadow(
              color: AppTheme.primary.withAlpha(20),
              blurRadius: 24,
              offset: const Offset(0, -4),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          child: NavigationBar(
            selectedIndex: navigationShell.currentIndex,
            onDestinationSelected: (index) => navigationShell.goBranch(index),
            backgroundColor: Colors.transparent,
            indicatorColor: AppTheme.primary,
            destinations: const [
              NavigationDestination(
                icon: Icon(Icons.home_outlined),
                selectedIcon: Icon(Icons.home, color: Colors.white),
                label: 'Home',
              ),
              NavigationDestination(
                icon: Icon(Icons.map_outlined),
                selectedIcon: Icon(Icons.map, color: Colors.white),
                label: 'Map',
              ),
              NavigationDestination(
                icon: Icon(Icons.emergency_outlined),
                selectedIcon: Icon(Icons.emergency, color: Colors.white),
                label: 'Urgent',
              ),
              NavigationDestination(
                icon: Icon(Icons.person_outline),
                selectedIcon: Icon(Icons.person, color: Colors.white),
                label: 'Profile',
              ),
            ],
          ),
        ),
      ),
    );
  }
}
