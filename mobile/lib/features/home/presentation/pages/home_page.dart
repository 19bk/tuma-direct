import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/providers/auth_provider.dart';
import '../../../../core/providers/wallet_provider.dart';

class HomePage extends ConsumerWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final walletState = ref.watch(walletNotifierProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('TumaDirect'),
        actions: [
          IconButton(
            icon: const Icon(Icons.account_circle),
            onPressed: () => context.go('/profile'),
          ),
        ],
      ),
      body: authState.when(
        data: (user) => user == null
            ? const _UnauthenticatedView()
            : _AuthenticatedView(walletState: walletState),
        loading: () => const Center(
          child: CircularProgressIndicator(),
        ),
        error: (error, stack) => Center(
          child: SelectableText.rich(
            TextSpan(
              text: 'Error: ',
              style: const TextStyle(
                color: Colors.red,
                fontWeight: FontWeight.bold,
              ),
              children: [
                TextSpan(
                  text: error.toString(),
                  style: const TextStyle(
                    color: Colors.red,
                    fontWeight: FontWeight.normal,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _UnauthenticatedView extends StatelessWidget {
  const _UnauthenticatedView();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.account_balance_wallet,
            size: 100,
            color: Theme.of(context).colorScheme.primary,
          ),
          const SizedBox(height: 24),
          Text(
            'Welcome to TumaDirect',
            style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
          ),
          const SizedBox(height: 8),
          Text(
            'Bridging Mobile Money with Crypto',
            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  color: Colors.grey[600],
                ),
          ),
          const SizedBox(height: 32),
          ElevatedButton(
            onPressed: () => context.go('/login'),
            child: const Text('Get Started'),
          ),
        ],
      ),
    );
  }
}

class _AuthenticatedView extends ConsumerWidget {
  const _AuthenticatedView({required this.walletState});

  final AsyncValue<List<Wallet>> walletState;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return RefreshIndicator(
      onRefresh: () => ref.read(walletNotifierProvider.notifier).refreshWallets(),
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildWelcomeSection(),
            const SizedBox(height: 24),
            _buildQuickActions(context),
            const SizedBox(height: 24),
            _buildWalletSection(context),
            const SizedBox(height: 24),
            _buildRecentTransactions(context),
          ],
        ),
      ),
    );
  }

  Widget _buildWelcomeSection() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Welcome back!',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(height: 8),
            Text(
              'Ready to bridge mobile money with crypto?',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Colors.grey[600],
                  ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildQuickActions(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Quick Actions',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: _ActionCard(
                icon: Icons.send,
                title: 'Send',
                subtitle: 'Send money',
                color: Colors.blue,
                onTap: () => context.go('/send'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _ActionCard(
                icon: Icons.account_balance_wallet,
                title: 'Onramp',
                subtitle: 'Buy crypto',
                color: Colors.green,
                onTap: () => context.go('/onramp'),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _ActionCard(
                icon: Icons.account_balance_wallet,
                title: 'Wallet',
                subtitle: 'Manage wallets',
                color: Colors.orange,
                onTap: () => context.go('/wallet'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _ActionCard(
                icon: Icons.qr_code_scanner,
                title: 'Receive',
                subtitle: 'Get money',
                color: Colors.purple,
                onTap: () => context.go('/receive'),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildWalletSection(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Your Wallets',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
            TextButton(
              onPressed: () => context.go('/wallet'),
              child: const Text('View All'),
            ),
          ],
        ),
        const SizedBox(height: 16),
        walletState.when(
          data: (wallets) => wallets.isEmpty
              ? _buildEmptyWalletState(context)
              : _buildWalletList(wallets),
          loading: () => const Center(
            child: CircularProgressIndicator(),
          ),
          error: (error, stack) => Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: SelectableText.rich(
                TextSpan(
                  text: 'Error loading wallets: ',
                  style: const TextStyle(
                    color: Colors.red,
                    fontWeight: FontWeight.bold,
                  ),
                  children: [
                    TextSpan(
                      text: error.toString(),
                      style: const TextStyle(
                        color: Colors.red,
                        fontWeight: FontWeight.normal,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildEmptyWalletState(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            Icon(
              Icons.account_balance_wallet_outlined,
              size: 48,
              color: Colors.grey[400],
            ),
            const SizedBox(height: 16),
            Text(
              'No wallets yet',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(height: 8),
            Text(
              'Create your first wallet to get started',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Colors.grey[600],
                  ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => context.go('/wallet'),
              child: const Text('Create Wallet'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildWalletList(List<Wallet> wallets) {
    return Column(
      children: wallets.take(3).map((wallet) {
        return Card(
          margin: const EdgeInsets.only(bottom: 8),
          child: ListTile(
            leading: CircleAvatar(
              backgroundColor: _getWalletColor(wallet.type),
              child: Icon(
                _getWalletIcon(wallet.type),
                color: Colors.white,
              ),
            ),
            title: Text(wallet.currency),
            subtitle: Text(
              '${wallet.balance.toStringAsFixed(4)} ${wallet.currency}',
              style: const TextStyle(
                fontWeight: FontWeight.bold,
              ),
            ),
            trailing: Text(
              wallet.network,
              style: TextStyle(
                color: Colors.grey[600],
                fontSize: 12,
              ),
            ),
            onTap: () => context.go('/wallet'),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildRecentTransactions(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Recent Transactions',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
        ),
        const SizedBox(height: 16),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              children: [
                Icon(
                  Icons.receipt_long_outlined,
                  size: 48,
                  color: Colors.grey[400],
                ),
                const SizedBox(height: 16),
                Text(
                  'No transactions yet',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Your transaction history will appear here',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Colors.grey[600],
                      ),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Color _getWalletColor(WalletType type) {
    switch (type) {
      case WalletType.ethereum:
        return Colors.blue;
      case WalletType.polygon:
        return Colors.purple;
      case WalletType.aleo:
        return Colors.orange;
    }
  }

  IconData _getWalletIcon(WalletType type) {
    switch (type) {
      case WalletType.ethereum:
        return Icons.currency_bitcoin;
      case WalletType.polygon:
        return Icons.polygon;
      case WalletType.aleo:
        return Icons.security;
    }
  }
}

class _ActionCard extends StatelessWidget {
  const _ActionCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.color,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final Color color;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              Icon(
                icon,
                size: 32,
                color: color,
              ),
              const SizedBox(height: 8),
              Text(
                title,
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
              const SizedBox(height: 4),
              Text(
                subtitle,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Colors.grey[600],
                    ),
              ),
            ],
          ),
        ),
      ),
    );
  }
} 