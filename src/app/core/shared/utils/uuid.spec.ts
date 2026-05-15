import { generateUUID } from './uuid';

// jsdom doesn't implement crypto.randomUUID; we define a mock on the global
// crypto object so the implementation can delegate to it.

describe('generateUUID', () => {
  const mockRandomUUID = jest.fn(
    () => '550e8400-e29b-41d4-a716-446655440000',
  );

  beforeAll(() => {
    Object.defineProperty(globalThis.crypto, 'randomUUID', {
      value: mockRandomUUID,
      writable: true,
      configurable: true,
    });
  });

  beforeEach(() => {
    mockRandomUUID.mockClear();
    mockRandomUUID.mockReturnValue('550e8400-e29b-41d4-a716-446655440000');
  });

  it('V9/S1: returns a non-empty 36-character string', () => {
    const id = generateUUID();
    expect(typeof id).toBe('string');
    expect(id.length).toBe(36);
  });

  it('S1: has dashes at positions 8, 13, 18, 23 (UUID v4 format)', () => {
    const id = generateUUID();
    expect(id[8]).toBe('-');
    expect(id[13]).toBe('-');
    expect(id[18]).toBe('-');
    expect(id[23]).toBe('-');
  });

  it('S2: delegates to crypto.randomUUID (called once per invocation)', () => {
    generateUUID();
    expect(mockRandomUUID).toHaveBeenCalledTimes(1);
  });

  it('S2: two calls produce different values from underlying crypto.randomUUID', () => {
    mockRandomUUID
      .mockReturnValueOnce('aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee')
      .mockReturnValueOnce('bbbbbbbb-cccc-4ddd-9eee-ffffffffffff');

    const id1 = generateUUID();
    const id2 = generateUUID();
    expect(id1).not.toBe(id2);
  });

  it('matches UUID format regex pattern', () => {
    const id = generateUUID();
    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    expect(uuidPattern.test(id)).toBe(true);
  });
});
