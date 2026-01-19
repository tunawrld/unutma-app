export type TaskStatus = 'pending' | 'completed';

export type TaskCategory = 'work' | 'personal' | 'shopping' | 'urgent' | 'none';

export type RecurrenceType = 'daily' | 'weekly' | 'monthly' | null;

export interface Task {
    id: string;
    text: string;
    date: string; // ISO Date string YYYY-MM-DD
    status: TaskStatus;
    createdAt: number;
    reminderId?: string; // Notification ID
    reminderDate?: number; // Timestamp for when the reminder triggers
    category: TaskCategory;
    recurrence?: RecurrenceType;
}

export type MoodType = 'very-sad' | 'sad' | 'neutral' | 'happy' | 'very-happy';

export interface MoodEntry {
    date: string; // ISO Date string YYYY-MM-DD
    mood: MoodType;
    timestamp: number;
}

export interface StreakData {
    currentStreak: number;
    longestStreak: number;
    lastCompletionDate: string; // ISO Date string
}
