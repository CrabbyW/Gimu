import { services } from '@/services';
import { useServiceQuery } from './useServiceQuery';

export const useProfile = () => useServiceQuery(() => services.user.getProfile(), []);
