import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Damk 3alena design system — "Clinical Sanctuary" theme
/// Colors extracted from Google Stitch DESIGN.md
class AppTheme {
  // Primary colors (Vital Red)
  static const Color primary = Color(0xFF8D0029);
  static const Color primaryContainer = Color(0xFFB4173C);
  static const Color onPrimary = Color(0xFFFFFFFF);
  static const Color onPrimaryContainer = Color(0xFFFFC7C9);
  static const Color primaryFixed = Color(0xFFFFDADB);

  // Secondary colors (Clinical Purple)
  static const Color secondary = Color(0xFF5E588B);
  static const Color secondaryContainer = Color(0xFFCDC5FF);
  static const Color onSecondary = Color(0xFFFFFFFF);
  static const Color secondaryFixed = Color(0xFFE5DEFF);

  // Tertiary colors (Success Green)
  static const Color tertiary = Color(0xFF005012);
  static const Color tertiaryContainer = Color(0xFF006B1B);
  static const Color onTertiaryContainer = Color(0xFF8DE989);

  // Error
  static const Color error = Color(0xFFBA1A1A);
  static const Color errorContainer = Color(0xFFFFDAD6);

  // Surface & Background
  static const Color background = Color(0xFFF8F9FE);
  static const Color surface = Color(0xFFF8F9FE);
  static const Color onSurface = Color(0xFF191C1F);
  static const Color onSurfaceVariant = Color(0xFF5A4042);
  static const Color surfaceContainerLowest = Color(0xFFFFFFFF);
  static const Color surfaceContainerLow = Color(0xFFF2F3F8);
  static const Color surfaceContainerHigh = Color(0xFFE7E8ED);
  static const Color surfaceContainer = Color(0xFFECEEF3);

  // Outline
  static const Color outline = Color(0xFF8E7071);
  static const Color outlineVariant = Color(0xFFE2BEBF);

  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      colorScheme: const ColorScheme.light(
        primary: primary,
        primaryContainer: primaryContainer,
        onPrimary: onPrimary,
        onPrimaryContainer: onPrimaryContainer,
        secondary: secondary,
        secondaryContainer: secondaryContainer,
        onSecondary: onSecondary,
        tertiary: tertiary,
        tertiaryContainer: tertiaryContainer,
        error: error,
        errorContainer: errorContainer,
        surface: surface,
        onSurface: onSurface,
        onSurfaceVariant: onSurfaceVariant,
        outline: outline,
        outlineVariant: outlineVariant,
      ),
      scaffoldBackgroundColor: background,
      textTheme: GoogleFonts.manropeTextTheme().copyWith(
        displayLarge: GoogleFonts.plusJakartaSans(
          fontWeight: FontWeight.w800,
          fontSize: 56,
          letterSpacing: -1.68,
          color: onSurface,
        ),
        headlineLarge: GoogleFonts.plusJakartaSans(
          fontWeight: FontWeight.w800,
          fontSize: 32,
          letterSpacing: -0.5,
          color: onSurface,
        ),
        headlineMedium: GoogleFonts.plusJakartaSans(
          fontWeight: FontWeight.w700,
          fontSize: 24,
          color: onSurface,
        ),
        headlineSmall: GoogleFonts.plusJakartaSans(
          fontWeight: FontWeight.w700,
          fontSize: 20,
          color: onSurface,
        ),
        titleLarge: GoogleFonts.plusJakartaSans(
          fontWeight: FontWeight.w700,
          fontSize: 18,
          color: onSurface,
        ),
        titleMedium: GoogleFonts.manrope(
          fontWeight: FontWeight.w600,
          fontSize: 16,
          color: onSurface,
        ),
        bodyLarge: GoogleFonts.manrope(
          fontWeight: FontWeight.w400,
          fontSize: 16,
          color: onSurface,
        ),
        bodyMedium: GoogleFonts.manrope(
          fontWeight: FontWeight.w400,
          fontSize: 14,
          color: onSurfaceVariant,
        ),
        bodySmall: GoogleFonts.manrope(
          fontWeight: FontWeight.w500,
          fontSize: 12,
          color: onSurfaceVariant,
        ),
        labelLarge: GoogleFonts.manrope(
          fontWeight: FontWeight.w700,
          fontSize: 14,
          color: onSurface,
        ),
        labelSmall: GoogleFonts.manrope(
          fontWeight: FontWeight.w700,
          fontSize: 10,
          letterSpacing: 1.5,
          color: onSurfaceVariant,
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primary,
          foregroundColor: onPrimary,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          textStyle: GoogleFonts.plusJakartaSans(
            fontWeight: FontWeight.w700,
            fontSize: 16,
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: surfaceContainerLow,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: primary.withAlpha(51), width: 2),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      ),
      cardTheme: CardThemeData(
        color: surfaceContainerLowest,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        elevation: 0,
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: Colors.white,
        selectedItemColor: primary,
        unselectedItemColor: onSurfaceVariant,
        type: BottomNavigationBarType.fixed,
      ),
    );
  }
}
