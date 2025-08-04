import { useContext } from 'react';
import { AuthContext } from './AuthContext';

// Custom hook to use auth context
export const useAuth = () => {
  return useContext(AuthContext);
};