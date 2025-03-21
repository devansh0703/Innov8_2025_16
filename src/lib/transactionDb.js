import { createClient } from '@supabase/supabase-js';

// Log all environment variables for debugging
console.log('ENV Variables available:', {
  VITE_TRANSACTION_SUPABASE_URL: import.meta.env.VITE_TRANSACTION_SUPABASE_URL ? 'defined' : 'undefined',
  VITE_TRANSACTION_SUPABASE_KEY: import.meta.env.VITE_TRANSACTION_SUPABASE_KEY ? 'defined' : 'undefined',
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL ? 'defined' : 'undefined',
  VITE_SUPABASE_KEY: import.meta.env.VITE_SUPABASE_KEY ? 'defined' : 'undefined',
});

// Try to get environment variables
let supabaseUrl = import.meta.env.VITE_TRANSACTION_SUPABASE_URL;
let supabaseKey = import.meta.env.VITE_TRANSACTION_SUPABASE_KEY;

// Fallback to hardcoded values if environment variables aren't available
// (not ideal for production, but helps during development)
if (!supabaseUrl) {
  console.warn('⚠️ VITE_TRANSACTION_SUPABASE_URL not found, using hardcoded URL');
  supabaseUrl = 'https://whtleqhbvfiamcfzliqi.supabase.co';
}

if (!supabaseKey) {
  console.warn('⚠️ VITE_TRANSACTION_SUPABASE_KEY not found, using hardcoded key');
  supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndodGxlcWhidmZpYW1jZnpsaXFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI0NzIwNDAsImV4cCI6MjA1ODA0ODA0MH0.w1Cbv7iDQM_fK9dC6u_PfH8EVB4o9DjxSLad7iIcppo';
}

// Log the actual URLs (not showing the full key for security)
console.log('Transaction DB URL:', supabaseUrl);
console.log('Transaction DB Key (first 10 chars):', supabaseKey ? supabaseKey.substring(0, 10) + '...' : 'undefined');

const supabaseClient = createClient(supabaseUrl, supabaseKey);

export const transactionDb = supabaseClient; // Export the client directly
export const isTransactionDbConfigured = true; // We're always configured now since we have fallbacks

/**
 * Fetch transaction history from the trades table
 * @param {Object} options - Query options
 * @param {number} options.limit - Number of records to return
 * @param {number} options.page - Page number for pagination
 * @param {string} options.sortBy - Column to sort by
 * @param {boolean} options.ascending - Sort direction
 * @param {Object} options.filter - Filter options
 * @returns {Promise<Object>} - Transaction data and error if any
 */
export async function fetchTransactions({
  limit = 1000, // Increased default limit for client-side filtering
  page = 1,
  sortBy = 'created_at',
  ascending = false,
  filter = null,
} = {}) {
  // Ensure DB is configured
  if (!isTransactionDbConfigured) {
    console.error('Transaction database is not configured. Cannot fetch transactions.');
    return { data: [], count: 0, error: new Error('Database not configured') };
  }

  try {
    // Start with base query
    let query = transactionDb.from('trades').select('*', { count: 'exact' });

    // Apply filtering logic
    if (filter) {
      switch(filter.type) {
        case 'address':
          // Search in both buyer and seller fields
          query = query.or(`buyer.ilike.%${filter.value}%,seller.ilike.%${filter.value}%`);
          break;
          
        case 'trade_type':
          // Exact match for trade type
          query = query.eq('trade_type', filter.value);
          break;
          
        case 'id':
          // Exact match for id
          query = query.eq('id', filter.value);
          break;
          
        case 'date':
          // Date range filtering
          if (filter.startDate) {
            query = query.gte('created_at', filter.startDate);
          }
          if (filter.endDate) {
            // Add 1 day to include the end date
            const endDate = new Date(filter.endDate);
            endDate.setDate(endDate.getDate() + 1);
            query = query.lt('created_at', endDate.toISOString());
          }
          break;
          
        // For backward compatibility
        default:
          if (filter.field && filter.value) {
            query = query.ilike(filter.field, `%${filter.value}%`);
          }
      }
    }

    // Apply sorting
    query = query.order(sortBy, { ascending });

    // Apply pagination if needed
    if (limit < 1000) {
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);
    }

    // Execute query
    console.log('Executing Supabase query with filter:', filter?.type || 'none');
    const { data, error, count } = await query;
    
    // Process amount values to ensure they're in a usable format
    if (data && Array.isArray(data)) {
      console.log('Processing amounts for', data.length, 'transactions');
      data.forEach(tx => {
        console.log('Transaction before processing:', {
          id: tx.id,
          amount: tx.amount,
          amountType: typeof tx.amount
        });
        
        // Check if amount exists but is in a problematic format
        if (tx.amount === null || tx.amount === undefined) {
          tx.amount = 0; // Default value
          console.log(`Transaction ${tx.id}: null amount set to 0`);
        }
        // Handle numeric values from Supabase (they may come as strings or numbers)
        else if (typeof tx.amount === 'string') {
          // Try to parse as float first
          const parsed = parseFloat(tx.amount);
          if (!isNaN(parsed)) {
            tx.amount = parsed;
            console.log(`Transaction ${tx.id}: string amount ${tx.amount} parsed to number`);
          }
        }
        // Make sure numeric values are properly handled
        else if (typeof tx.amount === 'number') {
          // Keep as is, it's already a number
          console.log(`Transaction ${tx.id}: amount is already a number: ${tx.amount}`);
        }
        // Handle other edge cases
        else {
          console.log(`Transaction ${tx.id}: unhandled amount type: ${typeof tx.amount}, value: ${tx.amount}`);
          // Try to convert to string and then parse
          const strValue = String(tx.amount);
          const parsed = parseFloat(strValue);
          if (!isNaN(parsed)) {
            tx.amount = parsed;
            console.log(`Transaction ${tx.id}: converted to number: ${tx.amount}`);
          }
        }
      });
      
      // Log a sample transaction after processing
      if (data.length > 0) {
        console.log('Sample transaction after processing:', {
          id: data[0].id,
          amount: data[0].amount,
          amountType: typeof data[0].amount
        });
      }
    }
    
    console.log('Query results:', { 
      count: data?.length || 0, 
      hasError: !!error,
      errorMessage: error?.message,
      sampleAmount: data && data.length > 0 ? data[0].amount : 'no data'
    });

    return { data, count, error };
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return { data: [], count: 0, error };
  }
}

/**
 * Run a test query to verify the database connection and data format
 * This helps us debug issues with field types and values
 */
export async function testFetchData() {
  try {
    console.log('Running test query to verify database connection...');
    const { data, error } = await transactionDb
      .from('trades')
      .select('*')
      .limit(5);
    
    if (error) {
      console.error('Test query error:', error);
      return { success: false, error };
    }
    
    if (!data || data.length === 0) {
      console.warn('Test query returned no data');
      return { success: false, message: 'No data returned' };
    }
    
    // Log the raw data to see exactly what we're getting from Supabase
    console.log('Raw test data from Supabase:', data);
    
    // Analyze the first row to understand data types
    const firstRow = data[0];
    const fieldTypes = {};
    for (const key in firstRow) {
      fieldTypes[key] = typeof firstRow[key];
      if (key === 'amount') {
        console.log(`Amount value: ${firstRow[key]}, type: ${typeof firstRow[key]}, parsed: ${parseFloat(firstRow[key])}`);
      }
    }
    
    console.log('Field types in data:', fieldTypes);
    return { success: true, data, fieldTypes };
  } catch (err) {
    console.error('Error in test fetch:', err);
    return { success: false, error: err };
  }
}

// Run a test query on module load to debug issues
testFetchData().then(result => {
  console.log('Test fetch result:', result.success ? 'SUCCESS' : 'FAILED');
}); 