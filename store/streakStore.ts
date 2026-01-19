import AsyncStorage from '@react-native-async-storage/async-storage';
import { differenceInCalendarDays, format, parseISO } from 'date-fns';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { StreakData } from '../types';

interface StreakState {
    streakData: StreakData;
    updateStreak: (completedToday: boolean) => void;
    calculateStreak: (tasks: any[]) => void;
}

export const useStreakStore = create<StreakState>()(
    persist(
        (set, get) => ({
            streakData: {
                currentStreak: 0,
                longestStreak: 0,
                lastCompletionDate: '',
            },
            updateStreak: (completedToday) => {
                const today = format(new Date(), 'yyyy-MM-dd');
                const { streakData } = get();

                if (!completedToday) return;

                let newStreak = 1;

                if (streakData.lastCompletionDate) {
                    const lastDate = parseISO(streakData.lastCompletionDate);
                    const todayDate = parseISO(today);
                    const daysDiff = differenceInCalendarDays(todayDate, lastDate);

                    if (daysDiff === 1) {
                        // Consecutive day
                        newStreak = streakData.currentStreak + 1;
                    } else if (daysDiff === 0) {
                        // Same day, keep current
                        newStreak = streakData.currentStreak;
                    }
                }

                set({
                    streakData: {
                        currentStreak: newStreak,
                        longestStreak: Math.max(newStreak, streakData.longestStreak),
                        lastCompletionDate: today,
                    },
                });
            },
            calculateStreak: (tasks) => {
                // Calculate streak from tasks history
                const completedTasksByDate: { [key: string]: boolean } = {};

                tasks.forEach((task: any) => {
                    if (task.status === 'completed') {
                        completedTasksByDate[task.date] = true;
                    }
                });

                const dates = Object.keys(completedTasksByDate).sort().reverse();
                if (dates.length === 0) {
                    set({
                        streakData: {
                            currentStreak: 0,
                            longestStreak: 0,
                            lastCompletionDate: '',
                        },
                    });
                    return;
                }

                let currentStreak = 0;
                let longestStreak = 0;
                let tempStreak = 1;

                const today = format(new Date(), 'yyyy-MM-dd');
                const latestDate = dates[0];

                // Check if there's activity today or yesterday
                const daysSinceLatest = differenceInCalendarDays(parseISO(today), parseISO(latestDate));
                if (daysSinceLatest <= 1) {
                    currentStreak = 1;
                }

                // Calculate longest and current streak
                for (let i = 0; i < dates.length - 1; i++) {
                    const current = parseISO(dates[i]);
                    const next = parseISO(dates[i + 1]);
                    const diff = differenceInCalendarDays(current, next);

                    if (diff === 1) {
                        tempStreak++;
                        if (i === 0 && daysSinceLatest <= 1) {
                            currentStreak = tempStreak;
                        }
                    } else {
                        longestStreak = Math.max(longestStreak, tempStreak);
                        tempStreak = 1;
                    }
                }

                longestStreak = Math.max(longestStreak, tempStreak);

                set({
                    streakData: {
                        currentStreak,
                        longestStreak,
                        lastCompletionDate: latestDate,
                    },
                });
            },
        }),
        {
            name: 'streak-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
