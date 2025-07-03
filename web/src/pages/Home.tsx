import React from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Container,
  Chip,
  Avatar,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  TrendingUp,
  SwapHoriz,
  Send,
  AccountBalanceWallet,
  Security,
  Speed,
  Savings,
  Phone,
  ArrowForward,
  CheckCircle,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';

const Home: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const { isConnected } = useWallet();

  const features = [
    {
      icon: <TrendingUp sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Buy Crypto',
      description: 'Convert KES to USDC/cUSD instantly with competitive rates',
      action: 'Start Buying',
      path: '/onramp',
    },
    {
      icon: <SwapHoriz sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Sell Crypto',
      description: 'Convert USDC/cUSD back to KES and receive via M-Pesa',
      action: 'Start Selling',
      path: '/offramp',
    },
    {
      icon: <Send sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Send Money',
      description: 'Send crypto to anyone globally with minimal fees',
      action: 'Send Now',
      path: '/send',
    },
    {
      icon: <AccountBalanceWallet sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Manage Wallet',
      description: 'View balances, transaction history, and manage your assets',
      action: 'View Wallet',
      path: '/wallet',
    },
  ];

  const benefits = [
    {
      icon: <Security sx={{ fontSize: 32, color: 'success.main' }} />,
      title: 'Secure',
      description: 'Bank-grade security with multi-signature wallets',
    },
    {
      icon: <Speed sx={{ fontSize: 32, color: 'info.main' }} />,
      title: 'Fast',
      description: 'Instant transactions with real-time settlement',
    },
    {
      icon: <Savings sx={{ fontSize: 32, color: 'warning.main' }} />,
      title: 'Low Fees',
      description: 'Competitive rates starting from 0.5%',
    },
    {
      icon: <Phone sx={{ fontSize: 32, color: 'secondary.main' }} />,
      title: 'Mobile First',
      description: 'Optimized for mobile money integration',
    },
  ];

  const stats = [
    { label: 'Active Users', value: '10,000+', color: 'primary.main' },
    { label: 'Transactions', value: '50,000+', color: 'success.main' },
    { label: 'Countries', value: '5+', color: 'info.main' },
    { label: 'Success Rate', value: '99.9%', color: 'warning.main' },
  ];

  const handleGetStarted = () => {
    if (isConnected) {
      navigate('/onramp');
    } else {
      navigate('/onramp');
    }
  };

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: 'white',
          py: { xs: 8, md: 12 },
          mb: 6,
          borderRadius: 3,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography
                variant="h1"
                sx={{
                  fontSize: { xs: '2.5rem', md: '3.5rem' },
                  fontWeight: 700,
                  mb: 2,
                  lineHeight: 1.2,
                }}
              >
                Bridge Mobile Money with Crypto
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  mb: 3,
                  opacity: 0.9,
                  lineHeight: 1.5,
                }}
              >
                Seamlessly convert between Kenyan Shillings (KES) and cryptocurrency. 
                Send money globally, buy and sell crypto, all with the convenience of mobile money.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleGetStarted}
                  sx={{
                    backgroundColor: 'white',
                    color: 'primary.main',
                    px: 4,
                    py: 1.5,
                    '&:hover': {
                      backgroundColor: 'grey.100',
                    },
                  }}
                >
                  Get Started
                  <ArrowForward sx={{ ml: 1 }} />
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate('/about')}
                  sx={{
                    borderColor: 'white',
                    color: 'white',
                    px: 4,
                    py: 1.5,
                    '&:hover': {
                      borderColor: 'white',
                      backgroundColor: 'rgba(255,255,255,0.1)',
                    },
                  }}
                >
                  Learn More
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '100%',
                }}
              >
                <Phone
                  sx={{
                    fontSize: { xs: 200, md: 300 },
                    opacity: 0.1,
                    transform: 'rotate(15deg)',
                  }}
                />
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Stats Section */}
      <Container maxWidth="lg" sx={{ mb: 6 }}>
        <Grid container spacing={3}>
          {stats.map((stat) => (
            <Grid item xs={6} md={3} key={stat.label}>
              <Card
                sx={{
                  textAlign: 'center',
                  py: 3,
                  backgroundColor: 'background.paper',
                  border: `1px solid ${theme.palette.divider}`,
                }}
              >
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 700,
                    color: stat.color,
                    mb: 1,
                  }}
                >
                  {stat.value}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {stat.label}
                </Typography>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ mb: 6 }}>
        <Typography
          variant="h2"
          sx={{
            textAlign: 'center',
            mb: 1,
            fontWeight: 600,
          }}
        >
          What You Can Do
        </Typography>
        <Typography
          variant="h6"
          sx={{
            textAlign: 'center',
            mb: 6,
            color: 'text.secondary',
          }}
        >
          Everything you need to manage your money in one place
        </Typography>

        <Grid container spacing={3}>
          {features.map((feature) => (
            <Grid item xs={12} sm={6} md={3} key={feature.title}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: theme.shadows[8],
                  },
                }}
              >
                <CardContent sx={{ flexGrow: 1, textAlign: 'center', py: 4 }}>
                  <Box sx={{ mb: 2 }}>{feature.icon}</Box>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      mb: 2,
                    }}
                  >
                    {feature.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 3 }}
                  >
                    {feature.description}
                  </Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: 'center', pb: 3 }}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate(feature.path)}
                    endIcon={<ArrowForward />}
                    sx={{ textTransform: 'none' }}
                  >
                    {feature.action}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Benefits Section */}
      <Box
        sx={{
          backgroundColor: 'grey.50',
          py: 6,
          borderRadius: 3,
          mb: 6,
        }}
      >
        <Container maxWidth="lg">
          <Typography
            variant="h2"
            sx={{
              textAlign: 'center',
              mb: 1,
              fontWeight: 600,
            }}
          >
            Why Choose TumaDirect?
          </Typography>
          <Typography
            variant="h6"
            sx={{
              textAlign: 'center',
              mb: 6,
              color: 'text.secondary',
            }}
          >
            Built for the Kenyan market with global reach
          </Typography>

          <Grid container spacing={4}>
            {benefits.map((benefit) => (
              <Grid item xs={12} sm={6} md={3} key={benefit.title}>
                <Box sx={{ textAlign: 'center' }}>
                  <Box sx={{ mb: 2 }}>{benefit.icon}</Box>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      mb: 1,
                    }}
                  >
                    {benefit.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {benefit.description}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Container maxWidth="md" sx={{ textAlign: 'center', mb: 6 }}>
        <Card
          sx={{
            p: 6,
            background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`,
            color: 'white',
          }}
        >
          <Typography
            variant="h3"
            sx={{
              fontWeight: 700,
              mb: 2,
            }}
          >
            Ready to Get Started?
          </Typography>
          <Typography
            variant="h6"
            sx={{
              mb: 4,
              opacity: 0.9,
            }}
          >
            Join thousands of users who are already using TumaDirect to manage their money
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={handleGetStarted}
            sx={{
              backgroundColor: 'white',
              color: 'secondary.main',
              px: 6,
              py: 2,
              fontSize: '1.1rem',
              '&:hover': {
                backgroundColor: 'grey.100',
              },
            }}
          >
            Start Using TumaDirect
            <ArrowForward sx={{ ml: 1 }} />
          </Button>
        </Card>
      </Container>
    </Box>
  );
};

export default Home; 