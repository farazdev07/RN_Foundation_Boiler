import { z } from 'zod';

// What a list row needs. Favourites keep this shape on disk, so it stays small
// and changing it means a new storage version.
export const productSummarySchema = z.object({
  id: z.number().int(),
  title: z.string(),
  price: z.number(),
  rating: z.number(),
  thumbnail: z.string(),
});

export type ProductSummary = z.infer<typeof productSummarySchema>;

export const productSchema = productSummarySchema.extend({
  description: z.string(),
  // dummyjson leaves the brand out for some categories, such as groceries.
  brand: z.string().optional(),
  category: z.string(),
  stock: z.number().int(),
  images: z.array(z.string()),
});

export type Product = z.infer<typeof productSchema>;

export const productPageSchema = z.object({
  products: z.array(productSummarySchema),
  total: z.number().int(),
  skip: z.number().int(),
  limit: z.number().int(),
});

export type ProductPage = z.infer<typeof productPageSchema>;

export const toSummary = ({
  id,
  title,
  price,
  rating,
  thumbnail,
}: ProductSummary): ProductSummary => ({ id, title, price, rating, thumbnail });

// The offset of the next page, or undefined once every product is loaded.
export const nextSkip = ({
  skip,
  limit,
  total,
  products,
}: ProductPage): number | undefined => {
  const next = skip + Math.max(products.length, limit);
  return products.length > 0 && next < total ? next : undefined;
};
