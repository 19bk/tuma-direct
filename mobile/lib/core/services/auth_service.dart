import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:logger/logger.dart';

import '../models/user.dart' as app_models;
import '../config/supabase_config.dart';

class AuthService {
  final _supabase = Supabase.instance.client;
  final _logger = Logger();

  Future<app_models.AppUser?> getCurrentUser() async {
    try {
      final session = _supabase.auth.currentSession;
      if (session == null) return null;

      final userData = await _supabase
          .from(SupabaseConfig.usersTable)
          .select()
          .eq('id', session.user.id)
          .eq('is_deleted', false)
          .single();

      return app_models.AppUser.fromJson(userData);
    } catch (e) {
      _logger.e('Error getting current user: $e');
      return null;
    }
  }

  Future<User> signIn({
    required String email,
    required String password,
  }) async {
    try {
      final response = await _supabase.auth.signInWithPassword(
        email: email,
        password: password,
      );

      if (response.user == null) {
        throw Exception('Sign in failed');
      }

      final userData = await _supabase
          .from(SupabaseConfig.usersTable)
          .select()
          .eq('id', response.user!.id)
          .eq('is_deleted', false)
          .single();

      return app_models.AppUser.fromJson(userData);
    } catch (e) {
      _logger.e('Error signing in: $e');
      rethrow;
    }
  }

  Future<User> signUp({
    required String email,
    required String password,
    required String phoneNumber,
    required String firstName,
    required String lastName,
  }) async {
    try {
      final response = await _supabase.auth.signUp(
        email: email,
        password: password,
      );

      if (response.user == null) {
        throw Exception('Sign up failed');
      }

      final user = app_models.AppUser(
        id: response.user!.id,
        email: email,
        phoneNumber: phoneNumber,
        firstName: firstName,
        lastName: lastName,
        isEmailVerified: false,
        isPhoneVerified: false,
        isKycCompleted: false,
        status: app_models.UserStatus.pending,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );

      await _supabase
          .from(SupabaseConfig.usersTable)
          .insert(user.toJson());

      return user;
    } catch (e) {
      _logger.e('Error signing up: $e');
      rethrow;
    }
  }

  Future<void> signOut() async {
    try {
      await _supabase.auth.signOut();
    } catch (e) {
      _logger.e('Error signing out: $e');
      rethrow;
    }
  }

  Future<app_models.AppUser> updateProfile({
    required String userId,
    String? firstName,
    String? lastName,
    String? phoneNumber,
  }) async {
    try {
      final updates = <String, dynamic>{
        'updated_at': DateTime.now().toIso8601String(),
      };

      if (firstName != null) updates['first_name'] = firstName;
      if (lastName != null) updates['last_name'] = lastName;
      if (phoneNumber != null) updates['phone_number'] = phoneNumber;

      final userData = await _supabase
          .from(SupabaseConfig.usersTable)
          .update(updates)
          .eq('id', userId)
          .eq('is_deleted', false)
          .select()
          .single();

      return app_models.AppUser.fromJson(userData);
    } catch (e) {
      _logger.e('Error updating profile: $e');
      rethrow;
    }
  }

  Future<app_models.AppUser> verifyPhoneNumber({
    required String userId,
    required String code,
  }) async {
    try {
      // In a real implementation, you would verify the SMS code here
      // For now, we'll just update the user record
      final userData = await _supabase
          .from(SupabaseConfig.usersTable)
          .update({
            'is_phone_verified': true,
            'updated_at': DateTime.now().toIso8601String(),
          })
          .eq('id', userId)
          .eq('is_deleted', false)
          .select()
          .single();

      return app_models.AppUser.fromJson(userData);
    } catch (e) {
      _logger.e('Error verifying phone number: $e');
      rethrow;
    }
  }

  Future<void> sendPasswordResetEmail(String email) async {
    try {
      await _supabase.auth.resetPasswordForEmail(email);
    } catch (e) {
      _logger.e('Error sending password reset email: $e');
      rethrow;
    }
  }

  Future<void> updatePassword(String newPassword) async {
    try {
      await _supabase.auth.updateUser(
        UserAttributes(password: newPassword),
      );
    } catch (e) {
      _logger.e('Error updating password: $e');
      rethrow;
    }
  }
} 