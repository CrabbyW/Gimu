import { services } from '@/services';
import { useServiceQuery } from './useServiceQuery';

export const useLesson = (id: string) => useServiceQuery(() => services.lessons.getLesson(id), [id]);
