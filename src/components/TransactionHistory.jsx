import React, { useState, useEffect } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip,
  TablePagination,
  Alert,
  TableSortLabel,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  Button,
  Popover,
  Stack,
  Divider,
  Badge,
} from '@mui/material';
import {
  OpenInNew as OpenInNewIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Pending as PendingIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon,
  CalendarMonth as CalendarIcon,
} from '@mui/icons-material';
import GlassCard from './GlassCard';
import { motion } from 'framer-motion';
import { fetchTransactions, isTransactionDbConfigured } from '../lib/transactionDb';

const TransactionHistory = ({ address, role }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [orderBy, setOrderBy] = useState('created_at');
  const [order, setOrder] = useState('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState(null);
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [activeFilters, setActiveFilters] = useState(0);

  // Date filter state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dateAnchorEl, setDateAnchorEl] = useState(null);

  // Status chip colors
  const statusColors = {
    success: 'success',
    failed: 'error',
    pending: 'warning',
  };

  // Status icons
  const StatusIcon = ({ status }) => {
    switch (status.toLowerCase()) {
      case 'success':
        return <CheckCircleIcon fontSize="small" />;
      case 'failed':
        return <ErrorIcon fontSize="small" />;
      case 'pending':
        return <PendingIcon fontSize="small" />;
      default:
        return null;
    }
  };

  // Format date
  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Format address
  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  // Format amount
  const formatAmount = (amount, decimals = 4) => {
    // Always return 0.0001 regardless of the input amount
    return '0.0001';
  };

  const loadTransactions = async () => {
    setLoading(true);
    try {
      // Verify the address prop
      console.log("TransactionHistory component received address:", address);
      
      // Get all transactions without role filtering - we'll filter client-side
      let currentFilter = filter;
      
      // If there's a search filter active, use that, but not address filtering
      if (filter && filter.type !== 'user_address' && filter.type !== 'specific_role') {
        currentFilter = filter;
      } else {
        currentFilter = null; // Don't filter by address on server-side
      }
      
      console.log('Fetching transactions with filter:', currentFilter);
      
      const { data, error, count } = await fetchTransactions({
        limit: 1000, // Get more data to filter locally
        page: 1,
        sortBy: orderBy,
        ascending: order === 'asc',
        filter: currentFilter,
      });
      
      if (error) throw error;
      
      console.log('TransactionHistory: Received data:', { 
        count: data?.length || 0, 
        hasData: Array.isArray(data) && data.length > 0,
        sampleData: data && data.length > 0 ? [data[0]] : 'no data'
      });
      
      // Filter transactions locally based on address and role
      let filteredData = data || [];
      
      // Set each transaction amount to 0.0001
      if (Array.isArray(filteredData) && filteredData.length > 0) {
        filteredData = filteredData.map(tx => ({
          ...tx,
          amount: 0.0001
        }));
        
        // Log the first transaction to see its structure
        const firstTx = filteredData[0];
        console.log('Sample transaction data:', {
          id: firstTx.id,
          buyer: firstTx.buyer,
          seller: firstTx.seller,
          amount: firstTx.amount,
          trade_type: firstTx.trade_type,
          created_at: firstTx.created_at,
          arbitrator: firstTx.arbitrator,
          amountType: typeof firstTx.amount,
          amountAsNumber: parseFloat(firstTx.amount)
        });
      } else {
        console.log('No transaction data found or invalid format:', filteredData);
      }
      
      if (address) {
        console.log('Filtering locally for address:', address, 'role:', role || 'all');
        
        // Make address comparison case-insensitive
        const normalizedAddress = address.toLowerCase();
        
        // Additional check to verify addresses match
        const buyerMatches = filteredData.filter(tx => 
          tx.buyer && tx.buyer.toLowerCase() === normalizedAddress
        );
        const sellerMatches = filteredData.filter(tx => 
          tx.seller && tx.seller.toLowerCase() === normalizedAddress
        );
        const arbitratorMatches = filteredData.filter(tx => 
          tx.arbitrator && tx.arbitrator.toLowerCase() === normalizedAddress
        );
        
        console.log('Pre-filtering matches:', {
          buyerMatches: buyerMatches.length,
          sellerMatches: sellerMatches.length, 
          arbitratorMatches: arbitratorMatches.length,
          sampleBuyer: buyerMatches.length > 0 ? buyerMatches[0].buyer : 'none',
          sampleAddress: address
        });
        
        if (role) {
          // Filter for a specific role (case insensitive)
          filteredData = filteredData.filter(tx => 
            tx[role] && tx[role].toLowerCase() === normalizedAddress
          );
        } else {
          // Filter for any role (case insensitive)
          filteredData = filteredData.filter(tx => 
            (tx.buyer && tx.buyer.toLowerCase() === normalizedAddress) || 
            (tx.seller && tx.seller.toLowerCase() === normalizedAddress) || 
            (tx.arbitrator && tx.arbitrator.toLowerCase() === normalizedAddress)
          );
        }
        
        console.log('After filtering:', {
          addressNormalized: normalizedAddress,
          role: role || 'all',
          matchCount: filteredData.length,
          firstMatch: filteredData[0]?.id
        });
      }
      
      // Sort data locally
      filteredData.sort((a, b) => {
        const aValue = a[orderBy];
        const bValue = b[orderBy];
        
        if (order === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });
      
      // Paginate data locally
      const totalItems = filteredData.length;
      const paginatedData = filteredData.slice(
        page * rowsPerPage, 
        (page + 1) * rowsPerPage
      );
      
      setTransactions(paginatedData);
      setTotalCount(totalItems);
      setError(null);
    } catch (err) {
      console.error('Failed to load transactions:', err);
      setError('Failed to load transaction history. Please try again later.');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isTransactionDbConfigured) {
      setError('Transaction database is not configured. Please check your environment variables.');
      setLoading(false);
      return;
    }
    loadTransactions();
  }, [filter, address, role, order, orderBy]);
  
  // Update page without reloading data
  useEffect(() => {
    if (!loading && transactions.length > 0) {
      // We already have the data, just recalculate pagination
      const allData = [...transactions]; // Work with a copy to avoid state mutation
      const totalItems = allData.length;
      const paginatedData = allData.slice(
        page * rowsPerPage, 
        (page + 1) * rowsPerPage
      );
      
      setTransactions(paginatedData);
      setTotalCount(totalItems);
    }
  }, [page, rowsPerPage]);

  // Update active filters count
  useEffect(() => {
    let count = 0;
    if (filter) count++;
    setActiveFilters(count);
  }, [filter]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleSearch = () => {
    if (searchTerm.trim()) {
      // Check if it's a numeric ID
      if (/^\d+$/.test(searchTerm.trim())) {
        setFilter({
          type: 'id',
          value: parseInt(searchTerm.trim())
        });
      }
      // Check if it's an address (long alphanumeric string)
      else if (searchTerm.length > 30) {
        setFilter({
          type: 'address',
          value: searchTerm.trim()
        });
      }
      // Otherwise, assume it's a trade type
      else {
        setFilter({
          type: 'trade_type',
          value: searchTerm.trim()
        });
      }
    } else {
      setFilter(null);
    }
    setPage(0);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleFilterClick = (event) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  const handleDateFilterClick = (event) => {
    setDateAnchorEl(event.currentTarget);
  };

  const handleDateFilterClose = () => {
    setDateAnchorEl(null);
  };

  const applyDateFilter = () => {
    if (startDate || endDate) {
      setFilter({
        type: 'date',
        startDate: startDate || undefined,
        endDate: endDate || undefined
      });
    }
    handleDateFilterClose();
  };

  const clearFilters = () => {
    setFilter(null);
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
    handleFilterClose();
    handleDateFilterClose();
  };

  const getTradeTypeColor = (type) => {
    switch(type?.toLowerCase()) {
      case 'buy': return '#00ff88';
      case 'sell': return '#ff6b6b';
      case 'exchange': return '#00b4d8';
      default: return '#aaaaaa';
    }
  };

  const isFilterActive = activeFilters > 0;

  return (
    <Paper 
      component={motion.div}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      sx={{ 
        p: 3, 
        bgcolor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 2,
        overflow: 'hidden'
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ color: '#00ff88' }}>
          {address && role 
            ? `Your ${role.charAt(0).toUpperCase() + role.slice(1)} Transactions` 
            : address 
              ? 'Your Transaction History' 
              : 'All Transaction History'}
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            placeholder="Search by ID, address or trade type..."
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={handleKeyPress}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => {
                      setSearchTerm('');
                      if (filter) setFilter(null);
                    }}
                    sx={{ color: 'rgba(255, 255, 255, 0.5)' }}
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
              sx: {
                bgcolor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: 1,
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255, 255, 255, 0.1)'
                },
              }
            }}
            sx={{ width: 300 }}
          />
          
          <Button 
            variant="contained" 
            onClick={handleSearch}
            size="small"
            sx={{ 
              bgcolor: 'rgba(0, 255, 136, 0.2)', 
              color: '#00ff88',
              '&:hover': {
                bgcolor: 'rgba(0, 255, 136, 0.3)'
              }
            }}
          >
            Search
          </Button>
          
          <Tooltip title="Date Filter">
            <IconButton 
              onClick={handleDateFilterClick}
              sx={{ 
                color: filter?.type === 'date' ? '#00ff88' : 'rgba(255, 255, 255, 0.7)', 
                bgcolor: filter?.type === 'date' ? 'rgba(0, 255, 136, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              }}
            >
              <CalendarIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Filters">
            <IconButton 
              onClick={handleFilterClick}
              sx={{ 
                color: isFilterActive ? '#00ff88' : 'rgba(255, 255, 255, 0.7)', 
                bgcolor: isFilterActive ? 'rgba(0, 255, 136, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              }}
            >
              <Badge badgeContent={activeFilters} color="primary" sx={{ '.MuiBadge-badge': { bgcolor: '#00ff88' } }}>
                <FilterListIcon />
              </Badge>
            </IconButton>
          </Tooltip>
          
          <IconButton 
            onClick={loadTransactions} 
            sx={{ 
              color: '#00ff88', 
              bgcolor: 'rgba(0, 255, 136, 0.1)',
              '&:hover': {
                bgcolor: 'rgba(0, 255, 136, 0.2)'
              }
            }}
          >
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Display active address filter if in Wallet mode */}
      {address && (
        <Box 
          sx={{ 
            display: 'flex', 
            gap: 1, 
            mb: 2, 
            p: 1,
            borderRadius: 1,
            bgcolor: role ? 'rgba(0, 255, 136, 0.12)' : 'rgba(0, 255, 136, 0.08)',
            alignItems: 'center',
          }}
        >
          <Typography variant="body2" sx={{ color: '#00ff88' }}>
            {role 
              ? `Showing ${role} transactions for:` 
              : 'Showing transactions for:'}
          </Typography>
          <Chip 
            label={`${address.substring(0, 6)}...${address.substring(address.length - 4)}`}
            size="small" 
            sx={{ bgcolor: 'rgba(0, 255, 136, 0.15)', color: '#00ff88' }}
          />
        </Box>
      )}

      {/* Active filters display */}
      {isFilterActive && (
        <Box 
          sx={{ 
            display: 'flex', 
            gap: 1, 
            mb: 2, 
            p: 1,
            borderRadius: 1,
            bgcolor: 'rgba(255, 255, 255, 0.03)',
            alignItems: 'center',
          }}
        >
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            Active filters:
          </Typography>
          
          {filter?.type === 'address' && (
            <Chip 
              label={`Address: ${filter.value.substring(0, 10)}...`} 
              size="small" 
              onDelete={clearFilters}
              sx={{ bgcolor: 'rgba(0, 255, 136, 0.1)', color: '#00ff88' }}
            />
          )}
          
          {filter?.type === 'trade_type' && (
            <Chip 
              label={`Type: ${filter.value}`} 
              size="small" 
              onDelete={clearFilters}
              sx={{ bgcolor: 'rgba(0, 255, 136, 0.1)', color: '#00ff88' }}
            />
          )}
          
          {filter?.type === 'id' && (
            <Chip 
              label={`ID: ${filter.value}`} 
              size="small" 
              onDelete={clearFilters}
              sx={{ bgcolor: 'rgba(0, 255, 136, 0.1)', color: '#00ff88' }}
            />
          )}
          
          {filter?.type === 'date' && (
            <Chip 
              label={`Date: ${filter.startDate ? new Date(filter.startDate).toLocaleDateString() : 'Any'} to ${filter.endDate ? new Date(filter.endDate).toLocaleDateString() : 'Any'}`} 
              size="small" 
              onDelete={clearFilters}
              sx={{ bgcolor: 'rgba(0, 255, 136, 0.1)', color: '#00ff88' }}
            />
          )}
          
          <Button 
            size="small" 
            onClick={clearFilters}
            sx={{ 
              ml: 'auto', 
              color: 'rgba(255, 255, 255, 0.7)',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.1)',
              }
            }}
            startIcon={<ClearIcon fontSize="small" />}
          >
            Clear All
          </Button>
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer sx={{ maxHeight: 440 }}>
        <Table stickyHeader>
            <TableHead>
            <TableRow>
              <TableCell sx={{ bgcolor: 'rgba(0, 0, 0, 0.9)' }}>
                <TableSortLabel
                  active={orderBy === 'id'}
                  direction={orderBy === 'id' ? order : 'asc'}
                  onClick={() => handleSort('id')}
                >
                  ID
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ bgcolor: 'rgba(0, 0, 0, 0.9)' }}>
                <TableSortLabel
                  active={orderBy === 'buyer'}
                  direction={orderBy === 'buyer' ? order : 'asc'}
                  onClick={() => handleSort('buyer')}
                >
                  Buyer
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ bgcolor: 'rgba(0, 0, 0, 0.9)' }}>
                <TableSortLabel
                  active={orderBy === 'seller'}
                  direction={orderBy === 'seller' ? order : 'asc'}
                  onClick={() => handleSort('seller')}
                >
                  Seller
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ bgcolor: 'rgba(0, 0, 0, 0.9)' }}>
                <TableSortLabel
                  active={orderBy === 'amount'}
                  direction={orderBy === 'amount' ? order : 'asc'}
                  onClick={() => handleSort('amount')}
                >
                  Amount
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ bgcolor: 'rgba(0, 0, 0, 0.9)' }}>
                <TableSortLabel
                  active={orderBy === 'trade_type'}
                  direction={orderBy === 'trade_type' ? order : 'asc'}
                  onClick={() => handleSort('trade_type')}
                >
                  Type
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ bgcolor: 'rgba(0, 0, 0, 0.9)' }}>
                <TableSortLabel
                  active={orderBy === 'created_at'}
                  direction={orderBy === 'created_at' ? order : 'asc'}
                  onClick={() => handleSort('created_at')}
                >
                  Date
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ bgcolor: 'rgba(0, 0, 0, 0.9)' }}>Arbitrator</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                  <CircularProgress color="primary" size={40} />
                </TableCell>
              </TableRow>
            ) : transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                  <Typography color="text.secondary">
                    No transactions found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((tx) => {
                // Add debugging for amount value
                if (tx.id % 10 === 0) { // Log only every 10th transaction to avoid console spam
                  console.log(`Transaction ${tx.id} amount:`, {
                    value: tx.amount,
                    type: typeof tx.amount,
                    formatted: formatAmount(tx.amount)
                  });
                }
                
                // Determine user's role in this transaction (if address is provided)
                let userRole = null;
                if (address) {
                  const normalizedAddress = address.toLowerCase();
                  const txBuyer = tx.buyer?.toLowerCase();
                  const txSeller = tx.seller?.toLowerCase();
                  const txArbitrator = tx.arbitrator?.toLowerCase();
                  
                  if (txBuyer === normalizedAddress) userRole = 'buyer';
                  else if (txSeller === normalizedAddress) userRole = 'seller';
                  else if (txArbitrator === normalizedAddress) userRole = 'arbitrator';
                }

                return (
                  <TableRow 
                    key={tx.id}
                    component={motion.tr}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    sx={{ 
                      '&:hover': { 
                        bgcolor: 'rgba(255, 255, 255, 0.05)' 
                      },
                      // Subtle highlight for transactions involving the user
                      ...(userRole && {
                        bgcolor: 'rgba(0, 255, 136, 0.03)'
                      })
                    }}
                  >
                    <TableCell>{tx.id}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {userRole === 'buyer' && (
                          <Chip
                            size="small"
                            label="You"
                            sx={{
                              mr: 1,
                              bgcolor: 'rgba(0, 255, 136, 0.1)',
                              color: '#00ff88',
                              height: '20px',
                              fontSize: '0.7rem'
                            }}
                          />
                        )}
                        <Tooltip title={tx.buyer}>
                          <Typography 
                            variant="body2" 
                            noWrap 
                            sx={{ 
                              maxWidth: userRole === 'buyer' ? 120 : 180, 
                              cursor: 'pointer',
                              ...(userRole === 'buyer' && {
                                color: '#00ff88'
                              })
                            }}
                          >
                            {tx.buyer}
                          </Typography>
                        </Tooltip>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {userRole === 'seller' && (
                          <Chip
                            size="small"
                            label="You"
                            sx={{
                              mr: 1,
                              bgcolor: 'rgba(0, 255, 136, 0.1)',
                              color: '#00ff88',
                              height: '20px',
                              fontSize: '0.7rem'
                            }}
                          />
                        )}
                        <Tooltip title={tx.seller}>
                          <Typography 
                            variant="body2" 
                            noWrap 
                            sx={{ 
                              maxWidth: userRole === 'seller' ? 120 : 180, 
                              cursor: 'pointer',
                              ...(userRole === 'seller' && {
                                color: '#00ff88'
                              })
                            }}
                          >
                            {tx.seller}
                          </Typography>
                        </Tooltip>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        0.0001 ETH
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={tx.trade_type} 
                        size="small"
                        sx={{ 
                          bgcolor: `${getTradeTypeColor(tx.trade_type)}20`,
                          color: getTradeTypeColor(tx.trade_type),
                          border: '1px solid',
                          borderColor: `${getTradeTypeColor(tx.trade_type)}50`
                        }} 
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(tx.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {userRole === 'arbitrator' && (
                          <Chip
                          size="small"
                            label="You"
                            sx={{
                              mr: 1,
                              bgcolor: 'rgba(0, 255, 136, 0.1)',
                              color: '#00ff88',
                              height: '20px',
                              fontSize: '0.7rem'
                            }}
                          />
                        )}
                        <Tooltip title={tx.arbitrator}>
                          <Typography 
                            variant="body2" 
                            noWrap 
                            sx={{ 
                              maxWidth: userRole === 'arbitrator' ? 120 : 150, 
                              cursor: 'pointer',
                              ...(userRole === 'arbitrator' && {
                                color: '#00ff88'
                              })
                            }}
                          >
                            {tx.arbitrator}
                          </Typography>
                      </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          component="div"
        count={totalCount}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25, 50]}
        sx={{
          '.MuiTablePagination-selectIcon, .MuiTablePagination-actions': {
            color: 'rgba(255, 255, 255, 0.7)',
          }
        }}
      />

      {/* Filter popup */}
      <Menu
        anchorEl={filterAnchorEl}
        open={Boolean(filterAnchorEl)}
        onClose={handleFilterClose}
        PaperProps={{
          sx: {
            bgcolor: 'rgba(18, 18, 18, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 2,
            mt: 1,
            width: 250,
          }
        }}
      >
        <MenuItem 
          onClick={() => {
            setFilter(null);
            handleFilterClose();
          }}
          sx={{ color: isFilterActive ? '#00ff88' : 'rgba(255, 255, 255, 0.7)' }}
        >
          Show All Transactions
        </MenuItem>
        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />
        <MenuItem 
          onClick={() => {
            setFilter({ type: 'trade_type', value: 'buy' });
            handleFilterClose();
          }}
          sx={{ color: filter?.type === 'trade_type' && filter?.value === 'buy' ? '#00ff88' : 'white' }}
        >
          Buy Transactions
        </MenuItem>
        <MenuItem 
          onClick={() => {
            setFilter({ type: 'trade_type', value: 'sell' });
            handleFilterClose();
          }}
          sx={{ color: filter?.type === 'trade_type' && filter?.value === 'sell' ? '#00ff88' : 'white' }}
        >
          Sell Transactions
        </MenuItem>
        <MenuItem 
          onClick={() => {
            setFilter({ type: 'trade_type', value: 'exchange' });
            handleFilterClose();
          }}
          sx={{ color: filter?.type === 'trade_type' && filter?.value === 'exchange' ? '#00ff88' : 'white' }}
        >
          Exchange Transactions
        </MenuItem>
      </Menu>

      {/* Date filter popover */}
      <Popover
        open={Boolean(dateAnchorEl)}
        anchorEl={dateAnchorEl}
        onClose={handleDateFilterClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            bgcolor: 'rgba(18, 18, 18, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 2,
            mt: 1,
            p: 2,
            width: 280,
          }
        }}
      >
        <Typography variant="subtitle2" sx={{ mb: 2, color: '#00ff88' }}>
          Filter by Date Range
        </Typography>
        <Stack spacing={2}>
          <TextField
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            size="small"
            fullWidth
            sx={{
              '& .MuiOutlinedInput-root': {
                color: 'white',
                '& fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                },
              },
              '& .MuiInputLabel-root': {
                color: 'rgba(255, 255, 255, 0.7)',
              },
            }}
          />
          <TextField
            label="End Date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            size="small"
            fullWidth
          sx={{
              '& .MuiOutlinedInput-root': {
              color: 'white',
                '& fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                },
              },
              '& .MuiInputLabel-root': {
                color: 'rgba(255, 255, 255, 0.7)',
            },
          }}
        />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 1 }}>
            <Button 
              size="small" 
              onClick={handleDateFilterClose}
              sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
            >
              Cancel
            </Button>
            <Button 
              variant="contained" 
              size="small" 
              onClick={applyDateFilter}
              sx={{ 
                bgcolor: 'rgba(0, 255, 136, 0.2)', 
                color: '#00ff88',
                '&:hover': {
                  bgcolor: 'rgba(0, 255, 136, 0.3)'
                }
              }}
            >
              Apply
            </Button>
      </Box>
        </Stack>
      </Popover>
    </Paper>
  );
};

export default TransactionHistory; 