import 'package:freezed_annotation/freezed_annotation.dart';

part 'user.freezed.dart';
part 'user.g.dart';

@freezed
class AppUser with _$AppUser {
  const factory AppUser({
    required String id,
    required String email,
    required String phoneNumber,
    required String firstName,
    required String lastName,
    String? profileImageUrl,
    required bool isEmailVerified,
    required bool isPhoneVerified,
    required bool isKycCompleted,
    required UserStatus status,
    required DateTime createdAt,
    required DateTime updatedAt,
    @Default(false) bool isDeleted,
  }) = _User;

  factory AppUser.fromJson(Map<String, dynamic> json) => _$AppUserFromJson(json);
}

@JsonEnum()
enum UserStatus {
  @JsonValue('active')
  active,
  @JsonValue('pending')
  pending,
  @JsonValue('suspended')
  suspended,
  @JsonValue('blocked')
  blocked,
} 