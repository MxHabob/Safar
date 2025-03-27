import { useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { fetchStart, fetchSuccess, fetchFailure } from '@/redux/features/ui/infinite-scroll-slice';

export const useInfiniteScroll = (fetchFunction: (page: number, limit: number) => Promise<{
  data: unknown[];
  hasMore: boolean;
}>, limit = 10) => {
  const dispatch = useDispatch();
  const observerElement = useRef<HTMLDivElement>(null);
  const { page, hasMore, isLoading } = useSelector((state: RootState) => state.scroll);

  const fetchData = useCallback(async () => {
    if (!hasMore || isLoading) return;
    
    try {
      dispatch(fetchStart());
      const response = await fetchFunction(page, limit);
      dispatch(fetchSuccess(response));
    } catch (error) {
      dispatch(fetchFailure(error instanceof Error ? error.message : 'Unknown error'));
    }
  }, [page, hasMore, isLoading, dispatch, fetchFunction, limit]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          fetchData();
        }
      },
      { threshold: 1.0 }
    );

    if (observerElement.current) {
      observer.observe(observerElement.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [fetchData, hasMore, isLoading]);

  return { observerElement, isLoading };
};