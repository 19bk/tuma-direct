import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:logger/logger.dart';
import 'package:web3dart/web3dart.dart';
import 'package:bip39/bip39.dart' as bip39;

import '../models/wallet.dart';
import '../config/supabase_config.dart';

class WalletService {
  final _supabase = Supabase.instance.client;
  final _logger = Logger();

  Future<List<Wallet>> getUserWallets() async {
    try {
      final session = _supabase.auth.currentSession;
      if (session == null) throw Exception('User not authenticated');

      final walletsData = await _supabase
          .from(SupabaseConfig.walletsTable)
          .select()
          .eq('user_id', session.user.id)
          .eq('is_deleted', false)
          .order('created_at', ascending: false);

      return walletsData.map((data) => Wallet.fromJson(data)).toList();
    } catch (e) {
      _logger.e('Error getting user wallets: $e');
      rethrow;
    }
  }

  Future<Wallet> createWallet({
    required WalletType type,
    required String network,
  }) async {
    try {
      final session = _supabase.auth.currentSession;
      if (session == null) throw Exception('User not authenticated');

      // Generate mnemonic and private key
      final mnemonic = bip39.generateMnemonic();
      final privateKey = _generatePrivateKey(mnemonic);
      final address = _generateAddress(privateKey, type);

      final wallet = Wallet(
        id: _generateWalletId(),
        userId: session.user.id,
        address: address,
        type: type,
        network: network,
        balance: 0.0,
        currency: _getCurrencyForType(type),
        privateKey: privateKey,
        mnemonic: mnemonic,
        isActive: true,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );

      await _supabase
          .from(SupabaseConfig.walletsTable)
          .insert(wallet.toJson());

      return wallet;
    } catch (e) {
      _logger.e('Error creating wallet: $e');
      rethrow;
    }
  }

  Future<Wallet> importWallet({
    required String privateKey,
    required WalletType type,
    required String network,
  }) async {
    try {
      final session = _supabase.auth.currentSession;
      if (session == null) throw Exception('User not authenticated');

      final address = _generateAddress(privateKey, type);

      final wallet = Wallet(
        id: _generateWalletId(),
        userId: session.user.id,
        address: address,
        type: type,
        network: network,
        balance: 0.0,
        currency: _getCurrencyForType(type),
        privateKey: privateKey,
        isActive: true,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );

      await _supabase
          .from(SupabaseConfig.walletsTable)
          .insert(wallet.toJson());

      return wallet;
    } catch (e) {
      _logger.e('Error importing wallet: $e');
      rethrow;
    }
  }

  Future<Wallet> getWalletBalance(String walletId) async {
    try {
      final walletData = await _supabase
          .from(SupabaseConfig.walletsTable)
          .select()
          .eq('id', walletId)
          .eq('is_deleted', false)
          .single();

      final wallet = Wallet.fromJson(walletData);
      
      // In a real implementation, you would fetch the actual balance
      // from the blockchain here
      final balance = await _fetchBalanceFromBlockchain(wallet);
      
      final updatedWallet = wallet.copyWith(
        balance: balance,
        updatedAt: DateTime.now(),
      );

      await _supabase
          .from(SupabaseConfig.walletsTable)
          .update(updatedWallet.toJson())
          .eq('id', walletId);

      return updatedWallet;
    } catch (e) {
      _logger.e('Error getting wallet balance: $e');
      rethrow;
    }
  }

  Future<void> deleteWallet(String walletId) async {
    try {
      await _supabase
          .from(SupabaseConfig.walletsTable)
          .update({'is_deleted': true})
          .eq('id', walletId);
    } catch (e) {
      _logger.e('Error deleting wallet: $e');
      rethrow;
    }
  }

  Future<Wallet?> getWalletById(String walletId) async {
    try {
      final walletData = await _supabase
          .from(SupabaseConfig.walletsTable)
          .select()
          .eq('id', walletId)
          .eq('is_deleted', false)
          .single();

      return Wallet.fromJson(walletData);
    } catch (e) {
      _logger.e('Error getting wallet by ID: $e');
      return null;
    }
  }

  // Helper methods
  String _generateWalletId() {
    return DateTime.now().millisecondsSinceEpoch.toString();
  }

  String _generatePrivateKey(String mnemonic) {
    // In a real implementation, you would use proper key derivation
    return '0x${mnemonic.hashCode.toRadixString(16)}';
  }

  String _generateAddress(String privateKey, WalletType type) {
    // In a real implementation, you would generate proper addresses
    // based on the wallet type
    return '0x${privateKey.hashCode.toRadixString(16)}';
  }

  String _getCurrencyForType(WalletType type) {
    switch (type) {
      case WalletType.ethereum:
        return 'ETH';
      case WalletType.polygon:
        return 'MATIC';
      case WalletType.aleo:
        return 'ALEO';
    }
  }

  Future<double> _fetchBalanceFromBlockchain(Wallet wallet) async {
    // In a real implementation, you would fetch the actual balance
    // from the blockchain using web3dart or similar
    await Future.delayed(const Duration(milliseconds: 500));
    return 0.0;
  }
} 