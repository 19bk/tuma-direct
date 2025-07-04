// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'transaction.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$TransactionImpl _$$TransactionImplFromJson(Map<String, dynamic> json) =>
    _$TransactionImpl(
      id: json['id'] as String,
      userId: json['userId'] as String,
      type: $enumDecode(_$TransactionTypeEnumMap, json['type']),
      status: $enumDecode(_$TransactionStatusEnumMap, json['status']),
      amount: (json['amount'] as num).toDouble(),
      currency: json['currency'] as String,
      fromAddress: json['fromAddress'] as String,
      toAddress: json['toAddress'] as String,
      reference: json['reference'] as String?,
      description: json['description'] as String?,
      fee: (json['fee'] as num?)?.toDouble(),
      failureReason: json['failureReason'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
      isDeleted: json['isDeleted'] as bool? ?? false,
    );

Map<String, dynamic> _$$TransactionImplToJson(_$TransactionImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'userId': instance.userId,
      'type': _$TransactionTypeEnumMap[instance.type]!,
      'status': _$TransactionStatusEnumMap[instance.status]!,
      'amount': instance.amount,
      'currency': instance.currency,
      'fromAddress': instance.fromAddress,
      'toAddress': instance.toAddress,
      'reference': instance.reference,
      'description': instance.description,
      'fee': instance.fee,
      'failureReason': instance.failureReason,
      'createdAt': instance.createdAt.toIso8601String(),
      'updatedAt': instance.updatedAt.toIso8601String(),
      'isDeleted': instance.isDeleted,
    };

const _$TransactionTypeEnumMap = {
  TransactionType.mpesaToCrypto: 'mpesa_to_crypto',
  TransactionType.cryptoToMpesa: 'crypto_to_mpesa',
  TransactionType.cryptoCrypto: 'crypto_to_crypto',
  TransactionType.mpesaToMpesa: 'mpesa_to_mpesa',
};

const _$TransactionStatusEnumMap = {
  TransactionStatus.pending: 'pending',
  TransactionStatus.processing: 'processing',
  TransactionStatus.completed: 'completed',
  TransactionStatus.failed: 'failed',
  TransactionStatus.cancelled: 'cancelled',
};
