import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { Task, TaskCategory } from '../types';

interface TaskState {
    tasks: Task[];
    addTask: (text: string, date: string, category?: TaskCategory) => void;
    toggleTask: (id: string) => void;
    deleteTask: (id: string) => void;
    updateTask: (id: string, text: string) => void;
    setReminderId: (id: string, reminderId: string, reminderDate: number) => void;
    updateCategory: (id: string, category: TaskCategory) => void;
}

export const useTaskStore = create<TaskState>()(
    persist(
        (set) => ({
            tasks: [],
            addTask: (text, date, category = 'none') =>
                set((state) => ({
                    tasks: [
                        ...state.tasks,
                        {
                            id: uuidv4(),
                            text,
                            date,
                            status: 'pending',
                            createdAt: Date.now(),
                            category,
                        },
                    ],
                })),
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
        }),
        {
            name: 'unutma-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
