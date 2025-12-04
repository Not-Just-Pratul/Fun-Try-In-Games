import * as fc from 'fast-check';

describe('Setup Verification', () => {
  test('Jest is working', () => {
    expect(true).toBe(true);
  });

  test('fast-check is working', () => {
    fc.assert(
      fc.property(fc.integer(), (n) => {
        return n === n;
      })
    );
  });
});
