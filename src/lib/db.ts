import { supabase } from './supabase';

// Create test record (generateTestCode)
export async function saveTest(code: string, results: any[], score: number, userEmail?: string) {
  const { data, error } = await supabase
    .from('tests')
    .upsert([
      { code, results, score, user_email: userEmail, created_at: new Date().toISOString() }
    ], { onConflict: 'code' }); // Upsert == INSERT + UPDATE like your old code

  if (error) throw error;
  return data?.[0];
}

export async function getTestByCode(code: string) {
  const { data, error } = await supabase
    .from('tests')
    .select('*')
    .eq('code', code)
    .single();

  if (error || !data) throw error;
  return data;
}

export async function getReport(id: string) {
  const { data, error } = await supabase
    .from('tests')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) throw error;
  return data;
}
