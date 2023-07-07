import React, { useCallback, useMemo, useRef } from 'react';
import { VoteList } from '../components/VoteList';
import useSWRInfinite from 'swr/infinite';
import { fetcher } from '../lib/util/swr';
import { Vote } from '../types/Vote';

export type VoteListOptions = {
  voterId?: string;
};

export const getKey = (
  pageIndex: number,
  previousPageData: Vote[],
  voterId?: string
) => {
  if (previousPageData && !previousPageData.length) return null; // reached the end
  return `/api/votes?page=${pageIndex + 1}${
    voterId ? `&voterId=${voterId}` : ''
  }`;
};

export function PaginatedVoteList({ voterId }: VoteListOptions) {
  const observer = useRef<IntersectionObserver | null>(null);

  const { data, error, isLoading, isValidating, size, setSize } =
    useSWRInfinite((...args) => getKey(...args, voterId), fetcher);

  const votes = useMemo(() => data?.flat() || [], [data]);
  const isLoadingMore = useMemo(
    () =>
      isLoading || (size > 0 && data && typeof data[size - 1] === 'undefined'),
    [data, isLoading, size]
  );
  const isEmpty = useMemo(() => data?.[0]?.length === 0, [data]);
  const isReachingEnd = useMemo(
    () => isEmpty || (data && data[data.length - 1]?.length < 10),
    [data, isEmpty]
  );
  const isRefreshing = useMemo(
    () => isValidating && data && data.length === size,
    [data, isValidating, size]
  );

  const loadMoreRef = useCallback(
    async (node: HTMLDivElement) => {
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver(async entries => {
        if (entries[0].isIntersecting && !isLoadingMore && !isReachingEnd) {
          console.log('intersecting');
          await setSize(size + 1);
        }
      });
      if (node) observer.current.observe(node);
    },
    [setSize, size, isLoadingMore, isReachingEnd]
  );

  if (!votes) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error fetching data</div>;
  }

  return (
    <div className="flex flex-col justify-center items-center">
      <VoteList votes={votes} loadMoreRef={loadMoreRef} />
      {isLoadingMore && <h6 className="text-gray-600 text-s">Loading...</h6>}
    </div>
  );
}
