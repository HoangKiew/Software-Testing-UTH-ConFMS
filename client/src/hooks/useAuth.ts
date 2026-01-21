import { useGetMeQuery, useLogoutMutation } from '../redux/api/authApi';
import { tokenUtils } from '../utils/token';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { apiSlice } from '../redux/api/apiSlice';
import { useState, useEffect } from 'react';

export const useAuth = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [hasToken, setHasToken] = useState(() => tokenUtils.hasToken());
  
  const { data, isLoading, error, refetch } = useGetMeQuery(undefined, {
    skip: !hasToken, 
  });
  useEffect(() => {
    const checkToken = () => {
      const currentHasToken = tokenUtils.hasToken();
      if (currentHasToken !== hasToken) {
        setHasToken(currentHasToken);
      }
    };
    checkToken();
    const interval = setInterval(checkToken, 100);
    
    return () => clearInterval(interval);
  }, [hasToken]);
  const [logoutMutation] = useLogoutMutation();

  const logout = async () => {
    try {
      const refreshToken = tokenUtils.getRefreshToken();
      dispatch(apiSlice.util.resetApiState());
      setHasToken(false);
      if (refreshToken) {
        try {
          await Promise.race([
            logoutMutation({ refreshToken }).unwrap(),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Logout timeout')), 1000)
            )
          ]);
        } catch (error) {
        }
      }
      tokenUtils.clearTokens();
      navigate('/login', { replace: true });
    } catch (error) {
      tokenUtils.clearTokens();
      dispatch(apiSlice.util.resetApiState());
      setHasToken(false);
      navigate('/login', { replace: true });
    }
  };

  return {
    user: data?.user,
    isLoading,
    isAuthenticated: !!data?.user && tokenUtils.hasToken(),
    error,
    refetch,
    logout,
  };
};

