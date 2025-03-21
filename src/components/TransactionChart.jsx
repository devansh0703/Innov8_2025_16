import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { useEffect, useState } from 'react';
import { transactionDb, isTransactionDbConfigured } from '../lib/transactionDb';
import { Box, CircularProgress, Typography } from '@mui/material';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function TransactionChart() {
  const [data, setData] = useState({
    labels: [],
    datasets: [
      {
        label: 'Transactions per Hour',
        data: [],
        borderColor: '#00ff88',
        backgroundColor: 'rgba(0, 255, 136, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#ffffff',
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: '#ffffff',
        },
      },
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: '#ffffff',
        },
      },
    },
  };

  // Function to fetch hourly transaction counts
  const fetchHourlyData = async () => {
    setLoading(true);
    try {
      if (!isTransactionDbConfigured) {
        setError('Transaction database is not configured');
        setLoading(false);
        return;
      }
      
      // Get current date and time
      const now = new Date();
      // Go back 24 hours
      const startTime = new Date(now);
      startTime.setHours(now.getHours() - 24);
      
      // Format for database query
      const startTimeISO = startTime.toISOString();
      const endTimeISO = now.toISOString();
      
      console.log(`Fetching transactions from ${startTimeISO} to ${endTimeISO}`);
      
      // Fetch all transactions in the 24-hour window
      const { data, error: fetchError } = await transactionDb
        .from('trades')
        .select('created_at')
        .gte('created_at', startTimeISO)
        .lte('created_at', endTimeISO)
        .order('created_at', { ascending: true });
      
      if (fetchError) {
        console.error('Error fetching transaction data:', fetchError);
        setError('Failed to load transaction data');
        setLoading(false);
        return;
      }
      
      if (!data || data.length === 0) {
        console.log('No transaction data found in time range');
        // Create empty hourly buckets
        const emptyData = generateEmptyHourlyBuckets(startTime, now);
        updateChartData(emptyData);
        setLoading(false);
        return;
      }
      
      console.log(`Found ${data.length} transactions in time range`);
      
      // Group transactions by hour
      const hourlyData = groupTransactionsByHour(data, startTime, now);
      updateChartData(hourlyData);
    } catch (err) {
      console.error('Error in fetchHourlyData:', err);
      setError('An error occurred while fetching chart data');
    } finally {
      setLoading(false);
    }
  };
  
  // Group transactions into hourly buckets
  const groupTransactionsByHour = (transactions, startTime, endTime) => {
    // Create empty hourly buckets
    const hourlyBuckets = generateEmptyHourlyBuckets(startTime, endTime);
    
    // Count transactions in each hour
    transactions.forEach(tx => {
      const txDate = new Date(tx.created_at);
      const hourKey = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, '0')}-${String(txDate.getDate()).padStart(2, '0')} ${String(txDate.getHours()).padStart(2, '0')}:00`;
      
      if (hourlyBuckets[hourKey] !== undefined) {
        hourlyBuckets[hourKey]++;
      }
    });
    
    return hourlyBuckets;
  };
  
  // Generate empty hourly buckets for the given time range
  const generateEmptyHourlyBuckets = (startTime, endTime) => {
    const buckets = {};
    const currentTime = new Date(startTime);
    
    while (currentTime <= endTime) {
      const hourKey = `${currentTime.getFullYear()}-${String(currentTime.getMonth() + 1).padStart(2, '0')}-${String(currentTime.getDate()).padStart(2, '0')} ${String(currentTime.getHours()).padStart(2, '0')}:00`;
      buckets[hourKey] = 0;
      
      // Increment by 1 hour
      currentTime.setHours(currentTime.getHours() + 1);
    }
    
    return buckets;
  };
  
  // Update chart data with the hourly counts
  const updateChartData = (hourlyBuckets) => {
    const labels = Object.keys(hourlyBuckets);
    const counts = Object.values(hourlyBuckets);
    
    // Format labels to be more readable (just show HH:MM)
    const formattedLabels = labels.map(label => {
      const time = label.split(' ')[1];
      return time;
    });
    
    setData({
      labels: formattedLabels,
      datasets: [
        {
          ...data.datasets[0],
          data: counts,
        },
      ],
    });
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchHourlyData();
  }, []);

  // Update data every hour
  useEffect(() => {
    const interval = setInterval(() => {
      fetchHourlyData();
    }, 60 * 60 * 1000); // Every hour
    
    return () => clearInterval(interval);
  }, []);

  if (loading && (!data.labels.length || !data.datasets[0].data.length)) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <CircularProgress size={40} sx={{ color: '#00ff88' }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <div style={{ width: '100%', height: '300px', padding: '20px' }}>
      <Line data={data} options={options} />
    </div>
  );
} 