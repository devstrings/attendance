import { useState, useCallback } from 'react';

/**
 * Custom hook for API calls with loading and error handling
 * 
 * Usage:
 * const { data, loading, error, execute } = useApi(apiFunction);
 * 
 * // Call the API
 * await execute(param1, param2);
 */
const useApi = (apiFunction) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(
    async (...args) => {
      try {
        setLoading(true);
        setError(null);
        
        const result = await apiFunction(...args);
        
        setData(result);
        return result;
      } catch (err) {
        setError(err.message || 'An error occurred');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [apiFunction]
  );

  const reset = () => {
    setData(null);
    setError(null);
    setLoading(false);
  };

  return {
    data,
    loading,
    error,
    execute,
    reset
  };
};

export default useApi;