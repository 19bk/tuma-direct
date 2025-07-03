import 'package:freezed_annotation/freezed_annotation.dart';

part 'wallet.freezed.dart';
part 'wallet.g.dart';

@freezed
class Wallet with _$Wallet {
  const factory Wallet({
    required String id,
    required String userId,
    required String address,
    required WalletType type,
    required String network,
    required double balance,
    required String currency,
    String? privateKey,
    String? mnemonic,
    required bool isActive,
    required DateTime createdAt,
    required DateTime updatedAt,
    @Default(false) bool isDeleted,
  }) = _Wallet;

  factory Wallet.fromJson(Map<String, dynamic> json) => _$WalletFromJson(json);
}

@JsonEnum()
enum WalletType {
  @JsonValue('ethereum')
  ethereum,
  @JsonValue('polygon')
  polygon,
  @JsonValue('aleo')
  aleo,
}

@JsonEnum()
enum WalletNetwork {
  @JsonValue('mainnet')
  mainnet,
  @JsonValue('testnet')
  testnet,
  @JsonValue('goerli')
  goerli,
  @JsonValue('mumbai')
  mumbai,
} 