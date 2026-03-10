import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper to create an authenticated Supabase client
export const createAuthenticatedClient = (clerkToken: string) => {
    return createClient(supabaseUrl, supabaseAnonKey, {
        global: {
            headers: {
                Authorization: `Bearer ${clerkToken}`,
            },
        },
    });
};

// Profile helpers
export interface Profile {
    id: string;
    email: string | null;
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
    created_at: string;
    updated_at: string;
}

export async function getProfile(token: string, userId: string): Promise<Profile | null> {
    const authSupabase = createAuthenticatedClient(token);

    const { data, error } = await authSupabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        return null;
    }
    return data;
}

export async function upsertProfile(token: string, profile: Partial<Profile> & { id: string }): Promise<Profile | null> {
    const authSupabase = createAuthenticatedClient(token);

    const { data, error } = await authSupabase
        .from('profiles')
        .upsert({
            ...profile,
            updated_at: new Date().toISOString(),
        })
        .select()
        .single();

    if (error) {
        console.error('Error upserting profile:', error);
        return null;
    }
    return data;
}
