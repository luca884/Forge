export abstract class DomainError extends Error {
  constructor(
    message: string,
    public override readonly name: string,
  ) {
    super(message);
    // Restore prototype chain for instanceof checks
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
