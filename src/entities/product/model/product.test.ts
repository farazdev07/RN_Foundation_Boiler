import { nextSkip, productSchema, toSummary, type Product } from './product';

const page = (skip: number, count: number, total: number) => ({
  products: Array.from({ length: count }, (_, i) => ({
    id: skip + i + 1,
    title: `Product ${skip + i + 1}`,
    price: 10,
    rating: 4,
    thumbnail: 'https://cdn.example.com/t.png',
  })),
  skip,
  limit: 20,
  total,
});

describe('nextSkip', () => {
  it('points at the next page while products remain', () => {
    expect(nextSkip(page(0, 20, 45))).toBe(20);
    expect(nextSkip(page(20, 20, 45))).toBe(40);
  });

  it('stops after the last page', () => {
    expect(nextSkip(page(40, 5, 45))).toBeUndefined();
    expect(nextSkip(page(0, 20, 20))).toBeUndefined();
  });

  it('stops on an empty page, so a wrong total cannot loop forever', () => {
    expect(nextSkip(page(20, 0, 100))).toBeUndefined();
  });
});

describe('product', () => {
  it('accepts a product without a brand', () => {
    const parsed = productSchema.safeParse({
      ...page(0, 1, 1).products[0],
      description: 'Fresh',
      category: 'groceries',
      stock: 3,
      images: [],
    });
    expect(parsed.success).toBe(true);
  });

  it('reduces a full product to the summary favourites store', () => {
    const product: Product = {
      id: 1,
      title: 'Phone',
      price: 99,
      rating: 4.5,
      thumbnail: 't.png',
      description: 'long text',
      category: 'smartphones',
      stock: 2,
      images: ['a.png'],
    };
    expect(toSummary(product)).toEqual({
      id: 1,
      title: 'Phone',
      price: 99,
      rating: 4.5,
      thumbnail: 't.png',
    });
  });
});
