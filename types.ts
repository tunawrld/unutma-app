export type TaskStatus = 'pending' | 'completed';

export interface Task {
    id: string;
    text: string;
    date: string; // ISO Date string YYYY-MM-DD
    status: TaskStatus;
    createdAt: number;
    reminderId?: string; // Notification ID
    reminderDate?: number; // Timestamp for when the reminder triggers
}
