import { baseApi } from '@shared/api';
import {
  nextSkip,
  productPageSchema,
  productSchema,
  type Product,
  type ProductPage,
} from '../model/product';

export const PAGE_SIZE = 20;

// Only the fields a list row shows, so a page stays small on a slow network.
const SUMMARY_FIELDS = 'title,price,rating,thumbnail';

const productApi = baseApi.injectEndpoints({
  endpoints: build => ({
    // The argument is the search text; an empty string lists everything.
    getProducts: build.infiniteQuery<ProductPage, string, number>({
      infiniteQueryOptions: {
        initialPageParam: 0,
        getNextPageParam: lastPage => nextSkip(lastPage),
      },
      query: ({ queryArg: search, pageParam: skip }) => {
        const params = { limit: PAGE_SIZE, skip, select: SUMMARY_FIELDS };
        const query = search.trim();
        return query
          ? { url: 'products/search', params: { ...params, q: query } }
          : { url: 'products', params };
      },
      responseSchema: productPageSchema,
    }),
    getProduct: build.query<Product, number>({
      query: id => `products/${id}`,
      responseSchema: productSchema,
    }),
  }),
});

export const { useGetProductsInfiniteQuery, useGetProductQuery } = productApi;
