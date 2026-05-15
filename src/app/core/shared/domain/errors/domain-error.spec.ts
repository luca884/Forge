import { DomainError } from './domain-error';

class ConcreteError extends DomainError {
  constructor(message: string) {
    super(message, 'ConcreteError');
  }
}

describe('DomainError', () => {
  it('is an instance of Error', () => {
    const err = new ConcreteError('test');
    expect(err).toBeInstanceOf(Error);
  });

  it('is an instance of DomainError', () => {
    const err = new ConcreteError('test');
    expect(err).toBeInstanceOf(DomainError);
  });

  it('preserves the message', () => {
    const err = new ConcreteError('something went wrong');
    expect(err.message).toBe('something went wrong');
  });

  it('exposes a typed name', () => {
    const err = new ConcreteError('test');
    expect(err.name).toBe('ConcreteError');
  });

  it('can be caught as Error', () => {
    expect(() => {
      throw new ConcreteError('boom');
    }).toThrow(Error);
  });
});
