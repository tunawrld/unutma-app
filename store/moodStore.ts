import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { MoodEntry, MoodType } from '../types';

interface MoodState {
    moods: MoodEntry[];
    setMood: (date: string, mood: MoodType) => void;
    getMood: (date: string) => MoodType | null;
}

export const useMoodStore = create<MoodState>()(
    persist(
        (set, get) => ({
            moods: [],
            setMood: (date, mood) =>
                set((state) => ({
                    moods: [
                        ...state.moods.filter((m) => m.date !== date),
                        {
                            date,
                            mood,
                            timestamp: Date.now(),
                        },
                    ],
                })),
            getMood: (date) => {
                const entry = get().moods.find((m) => m.date === date);
                return entry ? entry.mood : null;
            },
        }),
        {
            name: 'mood-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
