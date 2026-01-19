import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { Task, TaskCategory } from '../types';

interface TaskState {
    tasks: Task[];
    addTask: (text: string, date: string, category?: TaskCategory) => string;
    toggleTask: (id: string) => void;
    deleteTask: (id: string) => void;
    updateTask: (id: string, text: string) => void;
    setReminderId: (id: string, reminderId: string | undefined, reminderDate: number | undefined) => void;
    updateCategory: (id: string, category: TaskCategory) => void;
    moveTaskToDate: (id: string, newDate: string) => void;
}

export const useTaskStore = create<TaskState>()(
    persist(
        (set) => ({
            tasks: [],
            addTask: (text, date, category = 'none') => {
                const id = uuidv4();
                set((state) => ({
                    tasks: [
                        ...state.tasks,
                        {
                            id,
                            text,
                            date,
                            status: 'pending',
                            createdAt: Date.now(),
                            category,
                        },
                    ],
                }));
                return id;
            },
            toggleTask: (id) =>
                set((state) => ({
                    tasks: state.tasks.map((task) =>
                        task.id === id
                            ? { ...task, status: task.status === 'pending' ? 'completed' : 'pending' }
                            : task
                    ),
                })),
            deleteTask: (id) =>
                set((state) => ({
                    tasks: state.tasks.filter((task) => task.id !== id),
                })),
            updateTask: (id, text) =>
                set((state) => ({
                    tasks: state.tasks.map((task) =>
                        task.id === id ? { ...task, text } : task
                    ),
                })),
            setReminderId: (id, reminderId, reminderDate) =>
                set((state) => ({
                    tasks: state.tasks.map((task) =>
                        task.id === id ? { ...task, reminderId, reminderDate } : task
                    ),
                })),
            updateCategory: (id, category) =>
                set((state) => ({
                    tasks: state.tasks.map((task) =>
                        task.id === id ? { ...task, category } : task
                    ),
                })),
            moveTaskToDate: (id, newDate) =>
                set((state) => ({
                    tasks: state.tasks.map((task) =>
                        task.id === id ? { ...task, date: newDate } : task
                    ),
                })),
        }),
        {
            name: 'unutma-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
