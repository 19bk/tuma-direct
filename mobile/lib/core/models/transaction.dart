import 'package:freezed_annotation/freezed_annotation.dart';

part 'transaction.freezed.dart';
part 'transaction.g.dart';

@freezed
class Transaction with _$Transaction {
  const factory Transaction({
    required String id,
    required String userId,
    required TransactionType type,
    required TransactionStatus status,
    required double amount,
    required String currency,
    required String fromAddress,
    required String toAddress,
    String? reference,
    String? description,
    double? fee,
    String? failureReason,
    required DateTime createdAt,
    required DateTime updatedAt,
    @Default(false) bool isDeleted,
  }) = _Transaction;

  factory Transaction.fromJson(Map<String, dynamic> json) =>
      _$TransactionFromJson(json);
}

@JsonEnum()
enum TransactionType {
  @JsonValue('mpesa_to_crypto')
  mpesaToCrypto,
  @JsonValue('crypto_to_mpesa')
  cryptoToMpesa,
  @JsonValue('crypto_to_crypto')
  cryptoCrypto,
  @JsonValue('mpesa_to_mpesa')
  mpesaToMpesa,
}

@JsonEnum()
enum TransactionStatus {
  @JsonValue('pending')
  pending,
  @JsonValue('processing')
  processing,
  @JsonValue('completed')
  completed,
  @JsonValue('failed')
  failed,
  @JsonValue('cancelled')
  cancelled,
} 