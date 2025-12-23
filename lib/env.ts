function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `[env] Missing required environment variable: ${name}. ` +
        `Copy env.example to .env.local and fill it in. ` +
        `You can also run: node scripts/check-env.mjs`
    );
  }
  return value;
}

export const env = {
  NEXT_PUBLIC_SUPABASE_URL: required("NEXT_PUBLIC_SUPABASE_URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: required("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
} as const;


