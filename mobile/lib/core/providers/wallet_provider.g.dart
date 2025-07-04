// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'wallet_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$walletServiceHash() => r'0896612f75ca43743e426a176bf55e3686f1cc00';

/// See also [walletService].
@ProviderFor(walletService)
final walletServiceProvider = AutoDisposeProvider<WalletService>.internal(
  walletService,
  name: r'walletServiceProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$walletServiceHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

@Deprecated('Will be removed in 3.0. Use Ref instead')
// ignore: unused_element
typedef WalletServiceRef = AutoDisposeProviderRef<WalletService>;
String _$walletNotifierHash() => r'a612a8825b5618aaf0181caba138fe32a5f59253';

/// See also [WalletNotifier].
@ProviderFor(WalletNotifier)
final walletNotifierProvider =
    AutoDisposeAsyncNotifierProvider<WalletNotifier, List<Wallet>>.internal(
  WalletNotifier.new,
  name: r'walletNotifierProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$walletNotifierHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef _$WalletNotifier = AutoDisposeAsyncNotifier<List<Wallet>>;
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member, deprecated_member_use_from_same_package
