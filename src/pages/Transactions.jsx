import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Typography,
  Container,
  Paper,
  Switch,
  FormControlLabel,
} from '@mui/material';
import TransactionHistory from '../components/TransactionHistory';
import BlockchainBackground from '../components/BlockchainBackground';
import Navbar from '../components/Navbar';

const Transactions = () => {
  const [account, setAccount] = useState(null);
  const [showGlobalTransactions, setShowGlobalTransactions] = useState(false);

  // Check if wallet is connected on mount
  useEffect(() => {
    const checkWalletConnection = async () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setAccount(accounts[0]);
          }
        } catch (error) {
          console.error('Failed to get accounts:', error);
        }
      }
    };

    checkWalletConnection();

    // Set up event listener for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
        } else {
          setAccount(null);
        }
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', () => {});
      }
    };
  }, []);

  const handleToggleChange = (event) => {
    setShowGlobalTransactions(event.target.checked);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        position: 'relative',
        pt: 12,
        pb: 6,
      }}
    >
      <BlockchainBackground />
      <Navbar />
      
      <Container maxWidth="xl">
        <Box sx={{ mb: 6 }}>
          <Typography 
            variant="h3" 
            component="h1" 
            sx={{ 
              fontWeight: 700, 
              mb: 1,
              background: 'linear-gradient(90deg, #00ff88 0%, #00b4d8 100%)',
              backgroundClip: 'text',
              textFillColor: 'transparent',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Trade Transaction History
          </Typography>
          <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontWeight: 400 }}>
            View the latest blockchain trading activity with detailed information
          </Typography>
        </Box>
        
        <Box sx={{ mb: 4 }}>
          <Paper
            sx={{
              p: 0.5,
              borderRadius: 5,
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <FormControlLabel
              control={
                <Switch
                  checked={showGlobalTransactions}
                  onChange={handleToggleChange}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: '#00ff88',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 255, 136, 0.08)',
                      },
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: 'rgba(0, 255, 136, 0.5)',
                    },
                  }}
                />
              }
              label={
                <Typography variant="body2" sx={{ color: 'white' }}>
                  {showGlobalTransactions ? 'Showing All Transactions' : 'Showing Your Transactions'}
                </Typography>
              }
              sx={{ mx: 1 }}
            />
          </Paper>
        </Box>
        
        <Box sx={{ mb: 4 }}>
          {showGlobalTransactions ? (
            <TransactionHistory />
          ) : (
            <TransactionHistory address={account} />
          )}
        </Box>
      </Container>
    </Box>
  );
};

export default Transactions; 