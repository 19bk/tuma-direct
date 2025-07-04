// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'wallet.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$WalletImpl _$$WalletImplFromJson(Map<String, dynamic> json) => _$WalletImpl(
      id: json['id'] as String,
      userId: json['userId'] as String,
      address: json['address'] as String,
      type: $enumDecode(_$WalletTypeEnumMap, json['type']),
      network: json['network'] as String,
      balance: (json['balance'] as num).toDouble(),
      currency: json['currency'] as String,
      privateKey: json['privateKey'] as String?,
      mnemonic: json['mnemonic'] as String?,
      isActive: json['isActive'] as bool,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
      isDeleted: json['isDeleted'] as bool? ?? false,
    );

Map<String, dynamic> _$$WalletImplToJson(_$WalletImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'userId': instance.userId,
      'address': instance.address,
      'type': _$WalletTypeEnumMap[instance.type]!,
      'network': instance.network,
      'balance': instance.balance,
      'currency': instance.currency,
      'privateKey': instance.privateKey,
      'mnemonic': instance.mnemonic,
      'isActive': instance.isActive,
      'createdAt': instance.createdAt.toIso8601String(),
      'updatedAt': instance.updatedAt.toIso8601String(),
      'isDeleted': instance.isDeleted,
    };

const _$WalletTypeEnumMap = {
  WalletType.ethereum: 'ethereum',
  WalletType.polygon: 'polygon',
  WalletType.aleo: 'aleo',
};
