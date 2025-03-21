import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Button,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useScrollTrigger,
  Chip,
  Menu,
  MenuItem,
  Tooltip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  AccountBalanceWallet,
  History,
  KeyboardArrowDown,
  ContentCopy,
  ExitToApp,
  LinkRounded,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';

// Logo component with animation
const Logo = () => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.5 }}
  >
    <Typography
      variant="h6"
      component={Link}
      to="/"
      sx={{
        textDecoration: 'none',
        color: 'white',
        fontWeight: 'bold',
        fontSize: '1.5rem',
        background: 'linear-gradient(45deg, #00ff88 30%, #00b4d8 90%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        display: 'flex',
        alignItems: 'center',
        gap: 1,
      }}
    >
      <motion.span
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        style={{ display: 'inline-block' }}
      >
        ⚡
      </motion.span>
      Blocc
    </Typography>
  </motion.div>
);

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const navigate = useNavigate();

  // Network information
  const networks = {
    1: { name: 'Ethereum', icon: '🔵' },
    5: { name: 'Goerli', icon: '🟣' },
    11155111: { name: 'Sepolia', icon: '🟠' },
    137: { name: 'Polygon', icon: '🟣' },
    80001: { name: 'Mumbai', icon: '🟣' },
    56: { name: 'BSC', icon: '🟡' },
  };

  // Modified - Only keep Transactions in mobile drawer, remove from navbar
  const navItems = [
    { text: 'Transactions', icon: <History />, path: '/transactions' },
  ];

  // Check if MetaMask is installed
  const isMetaMaskInstalled = () => {
    return typeof window !== 'undefined' && window.ethereum !== undefined;
  };

  // Handle MetaMask events
  useEffect(() => {
    if (isMetaMaskInstalled()) {
      // Account changes
      const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
          setAccount(null);
        } else if (accounts[0] !== account) {
          setAccount(accounts[0]);
        }
      };

      // Chain changes
      const handleChainChanged = (chainIdHex) => {
        setChainId(parseInt(chainIdHex, 16));
      };

      // Subscribe to events
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      // Check if already connected
      window.ethereum.request({ method: 'eth_accounts' })
        .then(accounts => {
          if (accounts.length > 0) {
            setAccount(accounts[0]);
            window.ethereum.request({ method: 'eth_chainId' })
              .then(chainIdHex => {
                setChainId(parseInt(chainIdHex, 16));
              });
          }
        });

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [account]);

  // Connect wallet
  const connectWallet = async () => {
    if (!isMetaMaskInstalled()) {
      window.open('https://metamask.io/download/', '_blank');
      return;
    }

    setConnecting(true);
    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length > 0) {
        setAccount(accounts[0]);
        const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
        setChainId(parseInt(chainIdHex, 16));
        navigate('/wallet');
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
    } finally {
      setConnecting(false);
    }
  };

  // Format address
  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  // Copy address
  const copyAddress = () => {
    if (account) {
      navigator.clipboard.writeText(account);
      setAnchorEl(null);
    }
  };

  // Handle wallet menu
  const handleWalletClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleWalletClose = () => {
    setAnchorEl(null);
  };

  // Get network info
  const getNetworkInfo = (id) => {
    return networks[id] || { name: 'Unknown', icon: '❓' };
  };

  // Drawer toggle
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Modified drawer content
  const drawer = (
    <Box sx={{ bgcolor: 'background.default', height: '100%', pt: 2 }}>
      <Box sx={{ px: 2, mb: 3 }}>
        <Logo />
      </Box>
      {account && (
        <List>
          {navItems.map((item) => (
            <ListItem
              button
              key={item.text}
              component={Link}
              to={item.path}
              onClick={handleDrawerToggle}
              sx={{
                color: 'text.primary',
                '&:hover': {
                  bgcolor: 'rgba(0, 255, 136, 0.1)',
                },
              }}
            >
              <ListItemIcon sx={{ color: 'primary.main' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );

  return (
    <>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          bgcolor: 'transparent',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          transition: 'all 0.3s',
        }}
      >
        <Toolbar sx={{ py: 1.5, px: { xs: 2, sm: 4 } }}>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ 
              mr: 2, 
              display: { sm: 'none' },
              color: 'white',
            }}
          >
            <MenuIcon />
          </IconButton>

          <Logo />

          <Box sx={{ flexGrow: 1 }} />

          {!account ? (
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant="contained"
                startIcon={<AccountBalanceWallet />}
                onClick={connectWallet}
                disabled={connecting}
                sx={{
                  background: 'linear-gradient(45deg, #00ff88 30%, #00b4d8 90%)',
                  borderRadius: '50px',
                  color: 'black',
                  textTransform: 'none',
                  px: 3,
                  py: 1,
                  fontSize: '1rem',
                  fontWeight: 500,
                }}
              >
                Connect Wallet
              </Button>
            </motion.div>
          ) : (
            <>
              <Button
                onClick={handleWalletClick}
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '50px',
                  px: 2,
                  py: 1,
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {chainId && (
                    <Chip
                      size="small"
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <span>{getNetworkInfo(chainId).icon}</span>
                          <span>{getNetworkInfo(chainId).name}</span>
                        </Box>
                      }
                      sx={{
                        bgcolor: 'rgba(255, 255, 255, 0.1)',
                        color: 'white',
                        border: 'none',
                      }}
                    />
                  )}
                  <Typography variant="body2" sx={{ color: 'white' }}>
                    {formatAddress(account)}
                  </Typography>
                  <KeyboardArrowDown />
                </Box>
              </Button>

              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleWalletClose}
                PaperProps={{
                  sx: {
                    bgcolor: 'background.paper',
                    borderRadius: 2,
                    mt: 1,
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                  },
                }}
              >
                <MenuItem onClick={() => { navigate('/wallet'); handleWalletClose(); }}>
                  <ListItemIcon>
                    <AccountBalanceWallet fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Wallet" />
                </MenuItem>
                <MenuItem onClick={() => { navigate('/transactions'); handleWalletClose(); }}>
                  <ListItemIcon>
                    <History fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Transactions" />
                </MenuItem>
                <MenuItem onClick={copyAddress}>
                  <ListItemIcon>
                    <ContentCopy fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Copy Address" />
                </MenuItem>
              </Menu>
            </>
          )}
        </Toolbar>
      </AppBar>

      <Box component="nav">
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: 280,
              bgcolor: 'background.default',
              borderRight: '1px solid rgba(255, 255, 255, 0.1)',
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>
    </>
  );
};

export default Navbar; 