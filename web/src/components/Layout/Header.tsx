import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Chip,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  AccountBalanceWallet,
  SwapHoriz,
  Send,
  AccountCircle,
  ExitToApp,
  Settings,
  History,
  Home,
  TrendingUp,
  Phone,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useWallet } from '../../contexts/WalletContext';

const Header: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const { isConnected, account, balance, connectWallet, disconnectWallet, walletType } = useWallet();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleWalletMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleWalletMenuClose = () => {
    setAnchorEl(null);
  };

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleConnectWallet = async (type: 'coinbase' | 'metamask') => {
    try {
      await connectWallet(type);
      handleWalletMenuClose();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  const handleDisconnectWallet = () => {
    disconnectWallet();
    handleWalletMenuClose();
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  const getShortAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const navigationItems = [
    { path: '/', label: 'Home', icon: <Home /> },
    { path: '/onramp', label: 'Buy Crypto', icon: <TrendingUp /> },
    { path: '/offramp', label: 'Sell Crypto', icon: <TrendingUp /> },
    { path: '/swap', label: 'Swap', icon: <SwapHoriz /> },
    { path: '/send', label: 'Send', icon: <Send /> },
    { path: '/history', label: 'History', icon: <History /> },
  ];

  const renderDesktopNavigation = () => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      {navigationItems.map((item) => (
        <Button
          key={item.path}
          color="inherit"
          onClick={() => handleNavigation(item.path)}
          sx={{
            textTransform: 'none',
            fontWeight: location.pathname === item.path ? 600 : 400,
            borderBottom: location.pathname === item.path ? '2px solid white' : 'none',
          }}
        >
          {item.label}
        </Button>
      ))}
    </Box>
  );

  const renderMobileNavigation = () => (
    <Drawer
      anchor="left"
      open={mobileMenuOpen}
      onClose={handleMobileMenuToggle}
      sx={{
        '& .MuiDrawer-paper': {
          width: 280,
          boxSizing: 'border-box',
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          TumaDirect
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <List>
          {navigationItems.map((item) => (
            <ListItem
              key={item.path}
              button
              onClick={() => handleNavigation(item.path)}
              selected={location.pathname === item.path}
              sx={{
                borderRadius: 1,
                mb: 0.5,
                '&.Mui-selected': {
                  backgroundColor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: location.pathname === item.path ? 'white' : 'inherit',
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItem>
          ))}
        </List>
      </Box>
    </Drawer>
  );

  const renderWalletSection = () => {
    if (isConnected) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip
            label={`${parseFloat(balance).toFixed(4)} ETH`}
            color="primary"
            variant="outlined"
            size="small"
          />
          <Button
            color="inherit"
            onClick={handleWalletMenuOpen}
            startIcon={<AccountBalanceWallet />}
            sx={{ textTransform: 'none' }}
          >
            {getShortAddress(account || '')}
          </Button>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleWalletMenuClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            <MenuItem onClick={() => handleNavigation('/wallet')}>
              <ListItemIcon>
                <AccountCircle fontSize="small" />
              </ListItemIcon>
              Wallet
            </MenuItem>
            <MenuItem onClick={() => handleNavigation('/profile')}>
              <ListItemIcon>
                <Settings fontSize="small" />
              </ListItemIcon>
              Settings
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleDisconnectWallet}>
              <ListItemIcon>
                <ExitToApp fontSize="small" />
              </ListItemIcon>
              Disconnect
            </MenuItem>
          </Menu>
        </Box>
      );
    }

    return (
      <Button
        color="inherit"
        variant="outlined"
        onClick={handleWalletMenuOpen}
        startIcon={<AccountBalanceWallet />}
        sx={{ textTransform: 'none' }}
      >
        Connect Wallet
      </Button>
    );
  };

  return (
    <>
      <AppBar position="static" elevation={0} sx={{ backgroundColor: 'primary.main' }}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          {/* Logo and Brand */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton
              color="inherit"
              onClick={handleMobileMenuToggle}
              sx={{ display: { md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            <Typography
              variant="h6"
              component="div"
              sx={{
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
              onClick={() => handleNavigation('/')}
            >
              <Phone sx={{ fontSize: 28 }} />
              TumaDirect
            </Typography>
          </Box>

          {/* Desktop Navigation */}
          {!isMobile && renderDesktopNavigation()}

          {/* Wallet Section */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {renderWalletSection()}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Mobile Navigation Drawer */}
      {renderMobileNavigation()}

      {/* Wallet Connection Menu */}
      {!isConnected && (
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleWalletMenuClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          <MenuItem onClick={() => handleConnectWallet('coinbase')}>
            <ListItemIcon>
              <AccountBalanceWallet fontSize="small" />
            </ListItemIcon>
            Coinbase Wallet
          </MenuItem>
          <MenuItem onClick={() => handleConnectWallet('metamask')}>
            <ListItemIcon>
              <AccountBalanceWallet fontSize="small" />
            </ListItemIcon>
            MetaMask
          </MenuItem>
        </Menu>
      )}
    </>
  );
};

export default Header; 