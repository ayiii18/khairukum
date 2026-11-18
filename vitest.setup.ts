process.env.AUTH_SECRET =
  process.env.AUTH_SECRET ?? 'test-only-secret-value-with-more-than-32-characters';
process.env.DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgresql://test:test@localhost:5432/test';
