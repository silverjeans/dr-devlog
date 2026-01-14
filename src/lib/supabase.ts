import { createClient } from '@supabase/supabase-js';
import type {
  DevHistory,
  DevHistoryInsert,
  DevHistoryUpdate,
  DevHistoryFilter,
  Schedule,
  ScheduleInsert,
  ScheduleUpdate,
  Comment,
  CommentInsert,
} from '@/types/database';

// Supabase client configuration
// NOTE: Replace these with your actual Supabase project credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

const isConfigured = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

if (!isConfigured && typeof window !== 'undefined') {
  console.warn(
    'Supabase credentials not found. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Dev History CRUD operations
export const devHistoryApi = {
  // Fetch all dev history entries with optional filters
  async getAll(filter?: DevHistoryFilter): Promise<DevHistory[]> {
    if (!isConfigured) return [];

    let query = supabase
      .from('dev_history')
      .select('*')
      .order('event_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (filter) {
      if (filter.dev_phase) {
        if (Array.isArray(filter.dev_phase)) {
          query = query.in('dev_phase', filter.dev_phase);
        } else {
          query = query.eq('dev_phase', filter.dev_phase);
        }
      }

      if (filter.domain) {
        if (Array.isArray(filter.domain)) {
          query = query.in('domain', filter.domain);
        } else {
          query = query.eq('domain', filter.domain);
        }
      }

      if (filter.log_type) {
        if (Array.isArray(filter.log_type)) {
          query = query.in('log_type', filter.log_type);
        } else {
          query = query.eq('log_type', filter.log_type);
        }
      }

      if (filter.author_name) {
        query = query.ilike('author_name', `%${filter.author_name}%`);
      }

      if (filter.search) {
        query = query.or(
          `title.ilike.%${filter.search}%,content.ilike.%${filter.search}%`
        );
      }

      if (filter.date_from) {
        query = query.gte('event_date', filter.date_from);
      }
      if (filter.date_to) {
        query = query.lte('event_date', filter.date_to);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching dev history:', error);
      throw error;
    }

    return data || [];
  },

  // Fetch single dev history entry by ID
  async getById(id: number): Promise<DevHistory | null> {
    if (!isConfigured) return null;

    const { data, error } = await supabase
      .from('dev_history')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching dev history by ID:', error);
      throw error;
    }

    return data;
  },

  // Create new dev history entry
  async create(entry: DevHistoryInsert): Promise<DevHistory> {
    if (!isConfigured) throw new Error('Supabase not configured');

    const { data, error } = await supabase
      .from('dev_history')
      .insert(entry)
      .select()
      .single();

    if (error) {
      console.error('Error creating dev history:', error);
      throw error;
    }

    return data;
  },

  // Update existing dev history entry
  async update(id: number, entry: DevHistoryUpdate): Promise<DevHistory> {
    if (!isConfigured) throw new Error('Supabase not configured');

    const { data, error } = await supabase
      .from('dev_history')
      .update(entry)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating dev history:', error);
      throw error;
    }

    return data;
  },

  // Delete dev history entry
  async delete(id: number): Promise<void> {
    if (!isConfigured) throw new Error('Supabase not configured');

    const { error } = await supabase.from('dev_history').delete().eq('id', id);

    if (error) {
      console.error('Error deleting dev history:', error);
      throw error;
    }
  },

  // Get statistics for dashboard
  async getStats(): Promise<{
    totalCount: number;
    byPhase: Record<string, number>;
    byDomain: Record<string, number>;
    byLogType: Record<string, number>;
  }> {
    if (!isConfigured) {
      return { totalCount: 0, byPhase: {}, byDomain: {}, byLogType: {} };
    }

    const { data, error } = await supabase.from('dev_history').select('*');

    if (error) {
      console.error('Error fetching stats:', error);
      throw error;
    }

    const entries = data || [];
    const totalCount = entries.length;

    const byPhase: Record<string, number> = {};
    const byDomain: Record<string, number> = {};
    const byLogType: Record<string, number> = {};

    entries.forEach((entry) => {
      byPhase[entry.dev_phase] = (byPhase[entry.dev_phase] || 0) + 1;
      byDomain[entry.domain] = (byDomain[entry.domain] || 0) + 1;
      byLogType[entry.log_type] = (byLogType[entry.log_type] || 0) + 1;
    });

    return { totalCount, byPhase, byDomain, byLogType };
  },
};

// Storage operations for image uploads
export const storageApi = {
  // Upload image to Supabase storage
  async uploadImage(file: File, path?: string): Promise<string> {
    if (!isConfigured) throw new Error('Supabase not configured');

    const fileExt = file.name.split('.').pop();
    const timestamp = new Date().getTime();
    const randomStr = Math.random().toString(36).substring(7);
    const fileName = `${timestamp}-${randomStr}.${fileExt}`;
    const filePath = path ? `${path}/${fileName}` : fileName;

    const { error } = await supabase.storage
      .from('dev-history-images')
      .upload(filePath, file);

    if (error) {
      console.error('Error uploading image:', error);
      throw error;
    }

    const { data: urlData } = supabase.storage
      .from('dev-history-images')
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  },

  // Delete image from storage
  async deleteImage(url: string): Promise<void> {
    if (!isConfigured) throw new Error('Supabase not configured');

    const urlParts = url.split('/');
    const filePath = urlParts.slice(-1)[0];

    const { error } = await supabase.storage
      .from('dev-history-images')
      .remove([filePath]);

    if (error) {
      console.error('Error deleting image:', error);
      throw error;
    }
  },
};

// Schedule CRUD operations
export const scheduleApi = {
  // Fetch all schedules
  async getAll(): Promise<Schedule[]> {
    if (!isConfigured) return [];

    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .order('due_date', { ascending: true });

    if (error) {
      console.error('Error fetching schedules:', error);
      throw error;
    }

    return data || [];
  },

  // Fetch single schedule by ID
  async getById(id: number): Promise<Schedule | null> {
    if (!isConfigured) return null;

    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching schedule by ID:', error);
      throw error;
    }

    return data;
  },

  // Create new schedule
  async create(entry: ScheduleInsert): Promise<Schedule> {
    if (!isConfigured) throw new Error('Supabase not configured');

    const { data, error } = await supabase
      .from('schedules')
      .insert(entry)
      .select()
      .single();

    if (error) {
      console.error('Error creating schedule:', error);
      throw error;
    }

    return data;
  },

  // Update existing schedule
  async update(id: number, entry: ScheduleUpdate): Promise<Schedule> {
    if (!isConfigured) throw new Error('Supabase not configured');

    const { data, error } = await supabase
      .from('schedules')
      .update(entry)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating schedule:', error);
      throw error;
    }

    return data;
  },

  // Delete schedule
  async delete(id: number): Promise<void> {
    if (!isConfigured) throw new Error('Supabase not configured');

    const { error } = await supabase.from('schedules').delete().eq('id', id);

    if (error) {
      console.error('Error deleting schedule:', error);
      throw error;
    }
  },

  // Get active schedules (not completed)
  async getActive(): Promise<Schedule[]> {
    if (!isConfigured) return [];

    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .neq('status', '완료')
      .order('due_date', { ascending: true });

    if (error) {
      console.error('Error fetching active schedules:', error);
      throw error;
    }

    return data || [];
  },
};

// Comment CRUD operations
export const commentApi = {
  // Fetch comments for a dev history entry
  async getByDevHistoryId(devHistoryId: number): Promise<Comment[]> {
    if (!isConfigured) return [];

    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('dev_history_id', devHistoryId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching comments:', error);
      throw error;
    }

    return data || [];
  },

  // Create new comment
  async create(comment: CommentInsert): Promise<Comment> {
    if (!isConfigured) throw new Error('Supabase not configured');

    const { data, error } = await supabase
      .from('comments')
      .insert(comment)
      .select()
      .single();

    if (error) {
      console.error('Error creating comment:', error);
      throw error;
    }

    return data;
  },

  // Delete comment
  async delete(id: number): Promise<void> {
    if (!isConfigured) throw new Error('Supabase not configured');

    const { error } = await supabase.from('comments').delete().eq('id', id);

    if (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  },

  // Get comment count for multiple dev history entries
  async getCountsByDevHistoryIds(devHistoryIds: number[]): Promise<Record<number, number>> {
    if (!isConfigured) return {};

    const { data, error } = await supabase
      .from('comments')
      .select('dev_history_id')
      .in('dev_history_id', devHistoryIds);

    if (error) {
      console.error('Error fetching comment counts:', error);
      throw error;
    }

    const counts: Record<number, number> = {};
    (data || []).forEach((row) => {
      counts[row.dev_history_id] = (counts[row.dev_history_id] || 0) + 1;
    });

    return counts;
  },
};

// Related issues helper - fetch entries by IDs for issue linking
export const relatedIssuesApi = {
  // Get brief info for multiple entries by IDs (for displaying linked issues)
  async getByIds(ids: number[]): Promise<Pick<DevHistory, 'id' | 'title' | 'log_type' | 'domain' | 'event_date'>[]> {
    if (!isConfigured || ids.length === 0) return [];

    const { data, error } = await supabase
      .from('dev_history')
      .select('id, title, log_type, domain, event_date')
      .in('id', ids)
      .order('event_date', { ascending: false });

    if (error) {
      console.error('Error fetching related issues:', error);
      throw error;
    }

    return data || [];
  },

  // Search issues for linking (exclude current entry)
  async searchForLinking(searchTerm: string, excludeId?: number): Promise<Pick<DevHistory, 'id' | 'title' | 'log_type' | 'domain' | 'event_date'>[]> {
    if (!isConfigured) return [];

    let query = supabase
      .from('dev_history')
      .select('id, title, log_type, domain, event_date')
      .order('event_date', { ascending: false })
      .limit(20);

    if (searchTerm) {
      query = query.or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`);
    }

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error searching issues:', error);
      throw error;
    }

    return data || [];
  },

  // Get recent issues for quick linking (exclude current entry)
  async getRecent(excludeId?: number, limit: number = 10): Promise<Pick<DevHistory, 'id' | 'title' | 'log_type' | 'domain' | 'event_date'>[]> {
    if (!isConfigured) return [];

    let query = supabase
      .from('dev_history')
      .select('id, title, log_type, domain, event_date')
      .order('event_date', { ascending: false })
      .limit(limit);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching recent issues:', error);
      throw error;
    }

    return data || [];
  },
};
