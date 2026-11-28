import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// ==============================================================================
// Authentication Helpers
// ==============================================================================

export async function getCurrentUser() {
  if (!supabase) return null;
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  if (!session) return null;
  return session.user;
}

export async function signUpWithEmail(email, password) {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data.user;
}

export async function signInWithEmail(email, password) {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
}

export async function signOutUser() {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// ==============================================================================
// Database Cloud Sync Helpers (Speech History & Favorites)
// ==============================================================================

export async function fetchCloudHistory(userId) {
  if (!supabase || !userId) return [];
  const { data, error } = await supabase
    .from('speech_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    throw error;
  }
  return data.map((item) => ({
    id: item.id,
    text: item.text,
    language: item.language,
    voice: item.voice,
    audioUrl: item.audio_url,
    createdAt: new Date(item.created_at).getTime(),
  }));
}

export async function saveCloudHistory(userId, { text, language, voice, audioUrl }) {
  if (!supabase || !userId) return null;
  const { data, error } = await supabase
    .from('speech_history')
    .insert([{
      user_id: userId,
      text,
      language,
      voice,
      audio_url: audioUrl,
    }])
    .select()
    .single();

  if (error) {
    throw error;
  }
  return data;
}

export async function fetchCloudFavorites(userId) {
  if (!supabase || !userId) return [];
  const { data, error } = await supabase
    .from('favorites')
    .select('text')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }
  return data.map((item) => item.text);
}

export async function addCloudFavorite(userId, text, voice) {
  if (!supabase || !userId) return;
  const { error } = await supabase
    .from('favorites')
    .insert([{ user_id: userId, text, voice }]);
  if (error) throw error;
}

export async function removeCloudFavorite(userId, text) {
  if (!supabase || !userId) return;
  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('user_id', userId)
    .eq('text', text);
  if (error) throw error;
}

export async function recordUsageEvent(userId, event) {
  if (!supabase || !userId) return null;
  const { error } = await supabase
    .from('usage_events')
    .insert([{
      user_id: userId,
      event_type: event.eventType || 'tts',
      language: event.language || null,
      character_count: event.characterCount || 0,
      success: event.success !== false,
    }]);
  if (error) throw error;
  return true;
}

export async function fetchMyUsage() {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc('get_my_usage');
  if (error) throw error;
  return data?.[0] || null;
}

export async function fetchAdminUsage() {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc('get_admin_usage');
  if (error) throw error;
  return data;
}
