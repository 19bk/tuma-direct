// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'user.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$UserImpl _$$UserImplFromJson(Map<String, dynamic> json) => _$UserImpl(
      id: json['id'] as String,
      email: json['email'] as String,
      phoneNumber: json['phoneNumber'] as String,
      firstName: json['firstName'] as String,
      lastName: json['lastName'] as String,
      profileImageUrl: json['profileImageUrl'] as String?,
      isEmailVerified: json['isEmailVerified'] as bool,
      isPhoneVerified: json['isPhoneVerified'] as bool,
      isKycCompleted: json['isKycCompleted'] as bool,
      status: $enumDecode(_$UserStatusEnumMap, json['status']),
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
      isDeleted: json['isDeleted'] as bool? ?? false,
    );

Map<String, dynamic> _$$UserImplToJson(_$UserImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'email': instance.email,
      'phoneNumber': instance.phoneNumber,
      'firstName': instance.firstName,
      'lastName': instance.lastName,
      'profileImageUrl': instance.profileImageUrl,
      'isEmailVerified': instance.isEmailVerified,
      'isPhoneVerified': instance.isPhoneVerified,
      'isKycCompleted': instance.isKycCompleted,
      'status': _$UserStatusEnumMap[instance.status]!,
      'createdAt': instance.createdAt.toIso8601String(),
      'updatedAt': instance.updatedAt.toIso8601String(),
      'isDeleted': instance.isDeleted,
    };

const _$UserStatusEnumMap = {
  UserStatus.active: 'active',
  UserStatus.pending: 'pending',
  UserStatus.suspended: 'suspended',
  UserStatus.blocked: 'blocked',
};
