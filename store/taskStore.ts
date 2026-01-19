import AsyncStorage from '@react-native-async-storage/async-storage';
import { addDays, addMonths, addWeeks, format } from 'date-fns';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { RecurrenceType, Task, TaskCategory } from '../types';

interface TaskState {
    tasks: Task[];
    lastDeletedTask: Task | null;
    addTask: (text: string, date: string, category?: TaskCategory, recurrence?: RecurrenceType) => string;
    toggleTask: (id: string) => void;
    deleteTask: (id: string) => void;
    restoreLastDeletedTask: () => void;
    updateTask: (id: string, text: string) => void;
    setReminderId: (id: string, reminderId: string | undefined, reminderDate: number | undefined) => void;
    updateCategory: (id: string, category: TaskCategory) => void;
    setRecurrence: (id: string, recurrence: RecurrenceType) => void;
    moveTaskToDate: (id: string, newDate: string) => void;
}

export const useTaskStore = create<TaskState>()(
    persist(
        (set) => ({
            tasks: [],
            lastDeletedTask: null,
            addTask: (text, date, category = 'none', recurrence = null) => {
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
                            recurrence,
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

                    // Handle Recurrence (Only if completing)
                    if (newStatus === 'completed' && task.recurrence) {
                        const currentTaskDate = new Date(task.date);
                        let nextDate: Date;

                        switch (task.recurrence) {
                            case 'daily':
                                nextDate = addDays(currentTaskDate, 1);
                                break;
                            case 'weekly':
                                nextDate = addWeeks(currentTaskDate, 1);
                                break;
                            case 'monthly':
                                nextDate = addMonths(currentTaskDate, 1);
                                break;
                            default:
                                nextDate = addDays(currentTaskDate, 1);
                        }

                        const nextDateStr = format(nextDate, 'yyyy-MM-dd');

                        // Create next task instance
                        const newNextTask: Task = {
                            id: uuidv4(),
                            text: task.text,
                            date: nextDateStr,
                            status: 'pending',
                            createdAt: Date.now(),
                            category: task.category,
                            recurrence: task.recurrence,
                        };
                        newTasks.push(newNextTask);
                    }

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
            setRecurrence: (id, recurrence) =>
                set((state) => ({
                    tasks: state.tasks.map((task) =>
                        task.id === id ? { ...task, recurrence } : task
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
