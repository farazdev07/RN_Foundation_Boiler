import { FlashList, type FlashListProps } from '@shopify/flash-list';

// The list for screens: it recycles row views, so a long list scrolls without
// mounting a component per row (see ADR 0012). Short lists inside a modal can
// stay on FlatList.
//
// Keep `renderItem` stable (useCallback) and rows memoised, or every row
// re-renders whenever the screen does.
export function List<T>(props: FlashListProps<T>) {
  return <FlashList keyboardShouldPersistTaps="handled" {...props} />;
}
