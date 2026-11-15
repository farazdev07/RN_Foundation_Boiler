import { useCallback, useMemo } from 'react';

// The part of an RTK Query infinite query hook's result that a list needs.
export type InfiniteQueryState<Page> = {
  data?: { pages: Page[] } | undefined;
  isLoading: boolean;
  isFetching: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => unknown;
  refetch: () => unknown;
};

// True for a pull-to-refresh or a refetch, not for the first load (which shows
// a skeleton) or for the next page (which shows a footer spinner).
export const isRefreshing = ({
  isFetching,
  isLoading,
  isFetchingNextPage,
}: Pick<
  InfiniteQueryState<unknown>,
  'isFetching' | 'isLoading' | 'isFetchingNextPage'
>): boolean => isFetching && !isLoading && !isFetchingNextPage;

// A list fires onEndReached more than once near the end; only one of those
// may start a request.
export const canLoadMore = ({
  hasNextPage,
  isFetching,
}: Pick<InfiniteQueryState<unknown>, 'hasNextPage' | 'isFetching'>): boolean =>
  hasNextPage && !isFetching;

// Turns an infinite query into list props. `selectItems` must be stable: define
// it outside the component.
//
//   const list = useInfiniteQueryList(useGetProductsInfiniteQuery(search), selectProducts);
//   <List data={list.items} onEndReached={list.onEndReached} ... />
export const useInfiniteQueryList = <Page, Item>(
  query: InfiniteQueryState<Page>,
  selectItems: (page: Page) => readonly Item[],
) => {
  const { data, hasNextPage, isFetching, fetchNextPage, refetch } = query;

  const items = useMemo(
    () => data?.pages.flatMap(selectItems) ?? [],
    [data, selectItems],
  );

  const onEndReached = useCallback(() => {
    if (canLoadMore({ hasNextPage, isFetching })) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetching, fetchNextPage]);

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  return {
    items,
    onEndReached,
    onRefresh,
    refreshing: isRefreshing(query),
    loadingMore: query.isFetchingNextPage,
  };
};
