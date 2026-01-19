import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { Task, TaskCategory } from '../types';

interface TaskState {
    tasks: Task[];
    lastDeletedTask: Task | null;
    addTask: (text: string, date: string, category?: TaskCategory) => string;
    toggleTask: (id: string) => void;
    deleteTask: (id: string) => void;
    restoreLastDeletedTask: () => void;
    updateTask: (id: string, text: string) => void;
    setReminderId: (id: string, reminderId: string | undefined, reminderDate: number | undefined) => void;
    updateCategory: (id: string, category: TaskCategory) => void;
    moveTaskToDate: (id: string, newDate: string) => void;
    reorderTasks: (date: string, orderedTasks: Task[]) => void;
}

export const useTaskStore = create<TaskState>()(
    persist(
        (set) => ({
            tasks: [],
            lastDeletedTask: null,
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
                set((state) => {
                    const taskIndex = state.tasks.findIndex((t) => t.id === id);
                    if (taskIndex === -1) return { tasks: state.tasks };

                    const task = state.tasks[taskIndex];
                    const newStatus = task.status === 'pending' ? 'completed' : 'pending';
                    let newTasks = [...state.tasks];

                    // Update status
                    newTasks[taskIndex] = { ...task, status: newStatus };

                    return { tasks: newTasks };
                }),
            deleteTask: (id) =>
                set((state) => {
                    const taskToDelete = state.tasks.find((t) => t.id === id);
                    if (!taskToDelete) return {};
                    return {
                        tasks: state.tasks.filter((task) => task.id !== id),
                        lastDeletedTask: taskToDelete,
                    };
                }),
            restoreLastDeletedTask: () =>
                set((state) => {
                    if (!state.lastDeletedTask) return {};
                    return {
                        tasks: [...state.tasks, state.lastDeletedTask],
                        lastDeletedTask: null,
                    };
                }),
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
            reorderTasks: (date, orderedTasks) =>
                set((state) => {
                    // Update createdAt timestamps to maintain the new order
                    const baseTime = Date.now();
                    const updatedOrderedTasks = orderedTasks.map((task, index) => ({
                        ...task,
                        createdAt: baseTime + index,
                    }));

                    // Replace tasks for this date with the reordered ones
                    const otherTasks = state.tasks.filter((t) => t.date !== date);
                    return {
                        tasks: [...otherTasks, ...updatedOrderedTasks],
                    };
                }),
        }),
        {
            name: 'unutma-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
