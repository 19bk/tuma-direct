class SupabaseConfig {
  // Development
  static const String devUrl = 'YOUR_SUPABASE_DEV_URL';
  static const String devAnonKey = 'YOUR_SUPABASE_DEV_ANON_KEY';
  
  // Production
  static const String prodUrl = 'YOUR_SUPABASE_PROD_URL';
  static const String prodAnonKey = 'YOUR_SUPABASE_PROD_ANON_KEY';
  
  // Current environment
  static const bool isProduction = false;
  
  static String get url => isProduction ? prodUrl : devUrl;
  static String get anonKey => isProduction ? prodAnonKey : devAnonKey;
  
  // Database table names
  static const String usersTable = 'users';
  static const String transactionsTable = 'transactions';
  static const String walletsTable = 'wallets';
  static const String mpesaTransactionsTable = 'mpesa_transactions';
  static const String cryptoTransactionsTable = 'crypto_transactions';
  
  // Storage buckets
  static const String profileImagesBucket = 'profile-images';
  static const String documentsBucket = 'documents';
  
  // Real-time channels
  static const String transactionsChannel = 'transactions';
  static const String walletUpdatesChannel = 'wallet_updates';
} 