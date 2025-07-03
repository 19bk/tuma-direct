import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'providers/auth_provider.dart';

class TumaDirectApp extends ConsumerWidget {
  const TumaDirectApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);

    return MaterialApp.router(
      title: 'TumaDirect',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF1E88E5),
        ),
        fontFamily: 'Poppins',
      ),
      routerConfig: GoRouter(
        initialLocation: '/',
        redirect: (context, state) {
          final isLoggedIn = authState.value != null;
          final isLoggingIn = state.matchedLocation == '/login';
          final isRegistering = state.matchedLocation == '/register';

          if (!isLoggedIn && !isLoggingIn && !isRegistering) {
            return '/login';
          }

          if (isLoggedIn && (isLoggingIn || isRegistering)) {
            return '/';
          }

          return null;
        },
        routes: [
          GoRoute(
            path: '/',
            builder: (context, state) => const HomePage(),
          ),
          GoRoute(
            path: '/login',
            builder: (context, state) => const LoginPage(),
          ),
          GoRoute(
            path: '/register',
            builder: (context, state) => const RegisterPage(),
          ),
          GoRoute(
            path: '/wallet',
            builder: (context, state) => const WalletPage(),
          ),
          GoRoute(
            path: '/send',
            builder: (context, state) => const SendPage(),
          ),
          GoRoute(
            path: '/onramp',
            builder: (context, state) => const OnrampPage(),
          ),
          GoRoute(
            path: '/profile',
            builder: (context, state) => const ProfilePage(),
          ),
        ],
      ),
    );
  }
} 