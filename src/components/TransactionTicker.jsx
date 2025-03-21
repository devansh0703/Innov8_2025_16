import React, { useState, useEffect } from 'react';
import { Box, Typography, Avatar, Chip, CircularProgress } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { transactionDb, isTransactionDbConfigured } from '../lib/transactionDb';

// Get token-specific color
const getTokenColor = (tradeType) => {
  const colors = {
    buy: '#00ff88',
    sell: '#ff6b6b',
    exchange: '#00b4d8',
  };
  return colors[tradeType?.toLowerCase()] || '#aaaaaa';
};

// Format address
const formatAddress = (address) => {
  if (!address) return '';
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

// Format amount
const formatAmount = (amount) => {
  if (amount === null || amount === undefined) return '0.00';
  
  try {
    // If it's a number, format it directly
    if (typeof amount === 'number') {
      return amount.toFixed(4);
    }
    
    // If it's a string that can be parsed as a number
    const numAmount = parseFloat(amount);
    if (!isNaN(numAmount)) {
      return numAmount.toFixed(4);
    }
    
    // If we can't parse it, return as is
    return amount.toString();
  } catch (err) {
    console.error('Error formatting amount:', err, amount);
    return '0.00';
  }
};

// Format timestamp
const formatTimestamp = (timestamp) => {
  if (!timestamp) return 'unknown time';
  
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} mins ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} days ago`;
  } catch (err) {
    console.error('Error formatting timestamp:', err);
    return 'unknown time';
  }
};

// Individual transaction item
const TransactionItem = ({ transaction, animate = true }) => {
  const { buyer, seller, amount, trade_type, created_at } = transaction;
  
  return (
    <motion.div
      initial={animate ? { opacity: 0, y: 20 } : false}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      style={{ marginBottom: '12px' }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderRadius: '12px',
          backgroundColor: 'rgba(10, 10, 30, 0.2)',
          transition: 'all 0.2s ease',
          '&:hover': {
            backgroundColor: 'rgba(10, 10, 30, 0.4)',
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar
            sx={{ 
              width: 40, 
              height: 40, 
              backgroundColor: getTokenColor(trade_type),
              fontSize: '0.75rem',
              marginRight: 2
            }}
          >
            {trade_type?.substring(0, 4).toUpperCase() || 'TRX'}
          </Avatar>
          <Box>
            <Typography variant="body2" color="white">
              {formatAddress(buyer)} → {formatAddress(seller)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formatTimestamp(created_at)}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography
            variant="body2"
            sx={{ 
              fontWeight: 'bold',
              color: 'white',
              marginRight: 2
            }}
          >
            {formatAmount(amount)} ETH
          </Typography>
          <Chip 
            label={trade_type || 'unknown'} 
            size="small"
            sx={{ 
              backgroundColor: `${getTokenColor(trade_type)}20`,
              color: getTokenColor(trade_type),
              borderRadius: '6px',
              fontSize: '0.6rem',
              height: '24px'
            }}
          />
        </Box>
      </Box>
    </motion.div>
  );
};

export default function TransactionTicker() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [key, setKey] = useState(0); // Used to force re-render with new animation

  const fetchRecentTransactions = async () => {
    try {
      if (!isTransactionDbConfigured) {
        setError('Transaction database is not configured');
        setLoading(false);
        return;
      }

      // Fetch 5 most recent transactions
      const { data, error: fetchError } = await transactionDb
        .from('trades')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (fetchError) {
        console.error('Error fetching recent transactions:', fetchError);
        setError('Failed to load recent transactions');
        return;
      }
      
      if (!data || data.length === 0) {
        console.log('No recent transactions found');
        return;
      }
      
      console.log('Fetched recent transactions:', data.length);
      setTransactions(data);
      setKey(prev => prev + 1);
      setError(null);
    } catch (err) {
      console.error('Error in fetchRecentTransactions:', err);
      setError('An error occurred while fetching transactions');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch on component mount
  useEffect(() => {
    fetchRecentTransactions();
  }, []);

  // Fetch new transactions every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchRecentTransactions();
    }, 5 * 60 * 1000); // 5 minutes
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <Box sx={{ height: '100%', overflow: 'hidden' }}>
      {loading && transactions.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <CircularProgress size={30} sx={{ color: '#00ff88' }} />
        </Box>
      ) : error ? (
        <Typography color="error" align="center" sx={{ my: 3 }}>
          {error}
        </Typography>
      ) : transactions.length === 0 ? (
        <Typography color="text.secondary" align="center" sx={{ my: 3 }}>
          No transactions found
        </Typography>
      ) : (
        <AnimatePresence>
          {transactions.map((transaction, index) => (
            <TransactionItem 
              key={`${transaction.id}-${key}-${index}`}
              transaction={transaction}
              animate={true}
            />
          ))}
        </AnimatePresence>
      )}
    </Box>
  );
} 