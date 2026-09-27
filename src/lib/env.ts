export const hasSupabase = Boolean(
  process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const hasOpenAI = Boolean(process.env.OPENAI_API_KEY);
