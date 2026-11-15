const fs = require('fs');
const os = require('os');
const path = require('path');
const { createSlice } = require('./new-slice');

const I18N = 'src/app/i18n/index.ts';

describe('createSlice', () => {
  let root;
  const read = file => fs.readFileSync(path.join(root, file), 'utf8');

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'new-slice-'));
    fs.mkdirSync(path.join(root, 'src/app/i18n'), { recursive: true });
    fs.writeFileSync(
      path.join(root, I18N),
      "import { common, initI18n } from '@shared/lib/i18n';\n\ninitI18n({\n  common,\n});\n",
    );
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  it('creates a feature with a public index, strings and a test, and registers its strings', () => {
    const created = createSlice(root, 'feature', 'rate-product');

    expect(created.sort()).toEqual([
      'src/features/rate-product/i18n/en.ts',
      'src/features/rate-product/index.ts',
      'src/features/rate-product/ui/RateProduct.test.tsx',
      'src/features/rate-product/ui/RateProduct.tsx',
    ]);
    expect(read('src/features/rate-product/index.ts')).toContain(
      "export { rateProduct as rateProductStrings } from './i18n/en';",
    );
    expect(read(I18N)).toBe(
      "import { rateProductStrings } from '@features/rate-product';\nimport { common, initI18n } from '@shared/lib/i18n';\n\ninitI18n({\n  common,\n  rateProduct: rateProductStrings,\n});\n",
    );
  });

  it('names a screen component with the Screen suffix', () => {
    createSlice(root, 'screen', 'order-history');

    expect(read('src/screens/order-history/index.ts')).toContain(
      "export { OrderHistoryScreen } from './ui/OrderHistoryScreen';",
    );
    expect(read(I18N)).toContain('orderHistory: orderHistoryStrings,');
  });

  it('creates an entity with a schema and no strings to register', () => {
    const before = read(I18N);
    createSlice(root, 'entity', 'order');

    expect(read('src/entities/order/model/order.ts')).toContain(
      'export const orderSchema = z.object({',
    );
    expect(read(I18N)).toBe(before);
  });

  it('refuses to overwrite an existing slice', () => {
    createSlice(root, 'feature', 'rate-product');

    expect(() => createSlice(root, 'feature', 'rate-product')).toThrow(
      'already exists',
    );
  });

  it('refuses a name whose i18n namespace is taken by another layer', () => {
    createSlice(root, 'feature', 'checkout');

    expect(() => createSlice(root, 'screen', 'checkout')).toThrow(
      'already registered',
    );
    expect(fs.existsSync(path.join(root, 'src/screens/checkout'))).toBe(false);
  });

  it.each([
    ['widget', 'rate-product', 'Unknown layer'],
    ['feature', 'RateProduct', 'kebab-case'],
    ['feature', undefined, 'kebab-case'],
  ])('rejects %s %s', (layer, name, message) => {
    expect(() => createSlice(root, layer, name)).toThrow(message);
  });

  it('stops rather than guess when app/i18n has changed shape', () => {
    fs.writeFileSync(path.join(root, I18N), 'something else\n');

    expect(() => createSlice(root, 'feature', 'rate-product')).toThrow(
      'register the strings by hand',
    );
  });
});
