import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Chip,
  Divider,
  useTheme,
} from '@mui/material';
import {
  TrendingUp,
  AccountBalanceWallet,
  Payment,
  Info,
  ArrowDownward,
} from '@mui/icons-material';
import { useWallet } from '../contexts/WalletContext';
import { useTransaction } from '../contexts/TransactionContext';

interface ExchangeRate {
  currency: string;
  rate: number;
  fee: number;
}

const Onramp: React.FC = () => {
  const theme = useTheme();
  const { isConnected, account, connectWallet } = useWallet();
  const { initiateTransaction, isLoading, error } = useTransaction();

  const [amount, setAmount] = useState<string>('');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('USDC');
  const [paymentMethod, setPaymentMethod] = useState<string>('mpesa');
  const [exchangeRate, setExchangeRate] = useState<ExchangeRate | null>(null);
  const [calculatedAmount, setCalculatedAmount] = useState<string>('0');
  const [fee, setFee] = useState<string>('0');

  const currencies = [
    { value: 'USDC', label: 'USDC (USD Coin)', network: 'Ethereum' },
    { value: 'CUSD', label: 'cUSD (Celo Dollar)', network: 'Celo' },
  ];

  const paymentMethods = [
    { value: 'mpesa', label: 'M-Pesa', description: 'Mobile money transfer' },
    { value: 'bank', label: 'Bank Transfer', description: 'Direct bank deposit' },
    { value: 'card', label: 'Credit/Debit Card', description: 'Visa, Mastercard' },
  ];

  // Simulated exchange rates (replace with real API)
  const exchangeRates: ExchangeRate[] = [
    { currency: 'USDC', rate: 0.0072, fee: 0.005 }, // 1 KES = 0.0072 USDC
    { currency: 'CUSD', rate: 0.0072, fee: 0.005 },
  ];

  useEffect(() => {
    const rate = exchangeRates.find(r => r.currency === selectedCurrency);
    setExchangeRate(rate || null);
  }, [selectedCurrency]);

  useEffect(() => {
    if (amount && exchangeRate) {
      const numAmount = parseFloat(amount);
      const calculated = numAmount * exchangeRate.rate;
      const feeAmount = numAmount * exchangeRate.fee;
      const netAmount = calculated - feeAmount;
      
      setCalculatedAmount(netAmount.toFixed(4));
      setFee(feeAmount.toFixed(2));
    } else {
      setCalculatedAmount('0');
      setFee('0');
    }
  }, [amount, exchangeRate]);

  const handleAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  };

  const handleBuyCrypto = async () => {
    if (!isConnected) {
      try {
        await connectWallet('coinbase');
      } catch (error) {
        console.error('Failed to connect wallet:', error);
        return;
      }
    }

    if (!amount || parseFloat(amount) <= 0) {
      return;
    }

    try {
      const transactionId = await initiateTransaction({
        type: 'onramp',
        amount: amount,
        sourceCurrency: 'KES',
        targetCurrency: selectedCurrency,
        sourceNetwork: 'mobile_money',
        targetNetwork: selectedCurrency === 'USDC' ? 'ethereum' : 'celo',
        description: `Buy ${selectedCurrency} with KES`,
      });

      console.log('Transaction initiated:', transactionId);
    } catch (error) {
      console.error('Failed to initiate transaction:', error);
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'mpesa':
        return '📱';
      case 'bank':
        return '🏦';
      case 'card':
        return '💳';
      default:
        return '💰';
    }
  };

  return (
    <Box>
      <Typography variant="h3" sx={{ mb: 1, fontWeight: 600 }}>
        Buy Crypto
      </Typography>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
        Convert Kenyan Shillings (KES) to cryptocurrency instantly
      </Typography>

      <Grid container spacing={4}>
        {/* Main Form */}
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <TrendingUp sx={{ fontSize: 32, color: 'primary.main', mr: 2 }} />
                <Typography variant="h5" fontWeight={600}>
                  Purchase Details
                </Typography>
              </Box>

              {/* Amount Input */}
              <TextField
                fullWidth
                label="Amount in KES"
                type="text"
                value={amount}
                onChange={handleAmountChange}
                placeholder="Enter amount (e.g., 1000)"
                sx={{ mb: 3 }}
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 1 }}>KES</Typography>,
                }}
              />

              {/* Currency Selection */}
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Select Cryptocurrency</InputLabel>
                <Select
                  value={selectedCurrency}
                  onChange={(e) => setSelectedCurrency(e.target.value)}
                  label="Select Cryptocurrency"
                >
                  {currencies.map((currency) => (
                    <MenuItem key={currency.value} value={currency.value}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                        <Typography>{currency.label}</Typography>
                        <Chip label={currency.network} size="small" variant="outlined" />
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Payment Method */}
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Payment Method</InputLabel>
                <Select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  label="Payment Method"
                >
                  {paymentMethods.map((method) => (
                    <MenuItem key={method.value} value={method.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography sx={{ fontSize: 20 }}>
                          {getPaymentMethodIcon(method.value)}
                        </Typography>
                        <Box>
                          <Typography variant="body1">{method.label}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {method.description}
                          </Typography>
                        </Box>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Wallet Connection */}
              {!isConnected && (
                <Alert severity="info" sx={{ mb: 3 }}>
                  <Typography variant="body2">
                    Connect your wallet to receive the purchased cryptocurrency
                  </Typography>
                </Alert>
              )}

              {/* Buy Button */}
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleBuyCrypto}
                disabled={!amount || parseFloat(amount) <= 0 || isLoading}
                sx={{ py: 2, fontSize: '1.1rem' }}
              >
                {isLoading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  <>
                    <TrendingUp sx={{ mr: 1 }} />
                    Buy {selectedCurrency}
                  </>
                )}
              </Button>

              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error}
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Summary Card */}
        <Grid item xs={12} md={4}>
          <Card sx={{ position: 'sticky', top: 24 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                Transaction Summary
              </Typography>

              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography color="text.secondary">You Pay</Typography>
                  <Typography fontWeight={600}>KES {amount || '0'}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography color="text.secondary">Exchange Rate</Typography>
                  <Typography>1 KES = {exchangeRate?.rate.toFixed(6)} {selectedCurrency}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography color="text.secondary">Fee (0.5%)</Typography>
                  <Typography color="error.main">-KES {fee}</Typography>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="h6" fontWeight={600}>
                    You Receive
                  </Typography>
                  <Typography variant="h6" fontWeight={600} color="primary.main">
                    {calculatedAmount} {selectedCurrency}
                  </Typography>
                </Box>
              </Box>

              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Processing Time:</strong> 2-5 minutes
                </Typography>
              </Alert>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Info sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  Funds will be sent to your connected wallet
                </Typography>
              </Box>

              {isConnected && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AccountBalanceWallet sx={{ fontSize: 16, color: 'success.main' }} />
                  <Typography variant="body2" color="success.main">
                    Wallet Connected: {account?.slice(0, 6)}...{account?.slice(-4)}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Information Section */}
      <Card sx={{ mt: 4 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
            How it works
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Box
                  sx={{
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    backgroundColor: 'primary.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 2,
                  }}
                >
                  <Typography variant="h4" color="white" fontWeight={600}>
                    1
                  </Typography>
                </Box>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Enter Amount
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Specify how much KES you want to convert to cryptocurrency
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Box
                  sx={{
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    backgroundColor: 'primary.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 2,
                  }}
                >
                  <Typography variant="h4" color="white" fontWeight={600}>
                    2
                  </Typography>
                </Box>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Make Payment
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Pay using M-Pesa, bank transfer, or card payment
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Box
                  sx={{
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    backgroundColor: 'primary.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 2,
                  }}
                >
                  <Typography variant="h4" color="white" fontWeight={600}>
                    3
                  </Typography>
                </Box>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Receive Crypto
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Cryptocurrency is sent to your connected wallet instantly
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Onramp; 