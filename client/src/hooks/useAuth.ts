import { useGetMeQuery, useLogoutMutation } from '../redux/api/authApi';
import { tokenUtils } from '../utils/token';
import { useNavigate } from 'react-router-dom';

export const useAuth = () => {
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useGetMeQuery(undefined, {
    skip: !tokenUtils.hasToken(), 
  });
  const [logoutMutation] = useLogoutMutation();

  const logout = async () => {
    try {
      const refreshToken = tokenUtils.getRefreshToken();
      if (refreshToken) {
        await logoutMutation({ refreshToken }).unwrap();
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      tokenUtils.clearTokens();
      navigate('/login');
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

