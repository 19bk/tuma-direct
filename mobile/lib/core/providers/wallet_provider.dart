import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../models/wallet.dart' as app_models;
import '../services/wallet_service.dart';

part 'wallet_provider.g.dart';

@riverpod
class WalletNotifier extends _$WalletNotifier {
  @override
  Future<List<app_models.AppWallet>> build() async {
    final walletService = ref.read(walletServiceProvider);
    return walletService.getUserWallets();
  }

  Future<void> createWallet({
    required WalletType type,
    required String network,
  }) async {
    try {
      final walletService = ref.read(walletServiceProvider);
      final newWallet = await walletService.createWallet(
        type: type,
        network: network,
      );
      
      final currentWallets = state.value ?? [];
      state = AsyncValue.data([...currentWallets, newWallet]);
    } catch (error, stackTrace) {
      state = AsyncValue.error(error, stackTrace);
    }
  }

  Future<void> importWallet({
    required String privateKey,
    required WalletType type,
    required String network,
  }) async {
    try {
      final walletService = ref.read(walletServiceProvider);
      final importedWallet = await walletService.importWallet(
        privateKey: privateKey,
        type: type,
        network: network,
      );
      
      final currentWallets = state.value ?? [];
      state = AsyncValue.data([...currentWallets, importedWallet]);
    } catch (error, stackTrace) {
      state = AsyncValue.error(error, stackTrace);
    }
  }

  Future<void> updateWalletBalance(String walletId) async {
    try {
      final walletService = ref.read(walletServiceProvider);
      final updatedWallet = await walletService.getWalletBalance(walletId);
      
      final currentWallets = state.value ?? [];
      final updatedWallets = currentWallets.map((wallet) {
        return wallet.id == walletId ? updatedWallet : wallet;
      }).toList();
      
      state = AsyncValue.data(updatedWallets);
    } catch (error, stackTrace) {
      state = AsyncValue.error(error, stackTrace);
    }
  }

  Future<void> deleteWallet(String walletId) async {
    try {
      final walletService = ref.read(walletServiceProvider);
      await walletService.deleteWallet(walletId);
      
      final currentWallets = state.value ?? [];
      final updatedWallets = currentWallets
          .where((wallet) => wallet.id != walletId)
          .toList();
      
      state = AsyncValue.data(updatedWallets);
    } catch (error, stackTrace) {
      state = AsyncValue.error(error, stackTrace);
    }
  }

  Future<void> refreshWallets() async {
    state = const AsyncValue.loading();
    try {
      final walletService = ref.read(walletServiceProvider);
      final wallets = await walletService.getUserWallets();
      state = AsyncValue.data(wallets);
    } catch (error, stackTrace) {
      state = AsyncValue.error(error, stackTrace);
    }
  }
}

@riverpod
WalletService walletService(WalletServiceRef ref) {
  return WalletService();
} 