import { act, renderHook } from '@testing-library/react-native';
import {
  canLoadMore,
  isRefreshing,
  useInfiniteQueryList,
  type InfiniteQueryState,
} from './infiniteList';

type Page = { rows: number[] };

const selectRows = (page: Page) => page.rows;

const state = (
  overrides: Partial<InfiniteQueryState<Page>> = {},
): InfiniteQueryState<Page> => ({
  data: { pages: [{ rows: [1, 2] }, { rows: [3] }] },
  isLoading: false,
  isFetching: false,
  isFetchingNextPage: false,
  hasNextPage: true,
  fetchNextPage: jest.fn(),
  refetch: jest.fn(),
  ...overrides,
});

describe('infinite list', () => {
  it.each([
    [{ isFetching: true, isLoading: false, isFetchingNextPage: false }, true],
    [{ isFetching: true, isLoading: true, isFetchingNextPage: false }, false],
    [{ isFetching: true, isLoading: false, isFetchingNextPage: true }, false],
    [{ isFetching: false, isLoading: false, isFetchingNextPage: false }, false],
  ])('shows the refresh spinner only for a refetch: %j', (flags, expected) => {
    expect(isRefreshing(flags)).toBe(expected);
  });

  it('loads more only when there is a next page and nothing is in flight', () => {
    expect(canLoadMore({ hasNextPage: true, isFetching: false })).toBe(true);
    expect(canLoadMore({ hasNextPage: true, isFetching: true })).toBe(false);
    expect(canLoadMore({ hasNextPage: false, isFetching: false })).toBe(false);
  });

  it('flattens pages and keeps the same array until the data changes', async () => {
    const first = state();
    const { result, rerender } = await renderHook(
      (query: InfiniteQueryState<Page>) =>
        useInfiniteQueryList(query, selectRows),
      { initialProps: first },
    );
    const items = result.current.items;

    expect(items).toEqual([1, 2, 3]);

    await rerender({ ...first, isFetching: true });
    expect(result.current.items).toBe(items);

    await rerender(state({ data: undefined }));
    expect(result.current.items).toEqual([]);
  });

  it('fetches the next page once for repeated end-reached events', async () => {
    const fetchNextPage = jest.fn();
    const { result, rerender } = await renderHook(
      (query: InfiniteQueryState<Page>) =>
        useInfiniteQueryList(query, selectRows),
      { initialProps: state({ fetchNextPage }) },
    );

    await act(() => result.current.onEndReached());
    // The request is now in flight, as the query hook would report.
    await rerender(
      state({ fetchNextPage, isFetching: true, isFetchingNextPage: true }),
    );
    await act(() => result.current.onEndReached());

    expect(fetchNextPage).toHaveBeenCalledTimes(1);
    expect(result.current.loadingMore).toBe(true);
  });
});
