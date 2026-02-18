import { useThemeColors } from '@/hooks/useThemeColors';
import { useTaskStore } from '@/store/taskStore';
import { Task } from '@/types';
import { cancelNotification, schedulePushNotification } from '@/utils/notifications';
import { Ionicons } from '@expo/vector-icons';
import { addDays, addMonths, addWeeks, addYears, differenceInCalendarDays, format, isToday, isTomorrow, isYesterday, setHours, setMinutes } from 'date-fns';
import { tr } from 'date-fns/locale';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, Keyboard, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import OverdueModal from './OverdueModal';
import TaskItem from './TaskItem';

interface DayViewProps {
    date: Date;
    onOpenReminder: (taskId: string, y?: number) => void;
    onGoToToday?: () => void;
    onOpenCalendar?: () => void;
    onTaskComplete?: () => void;
    onDeleteTask?: (taskId: string) => void;
}

function DayView({ date, onOpenReminder, onGoToToday, onOpenCalendar, onTaskComplete, onDeleteTask }: DayViewProps) {
    const C = useThemeColors();
    const dateKey = format(date, 'yyyy-MM-dd');
    const tasks = useTaskStore((state) => state.tasks);
    const addTask = useTaskStore((state) => state.addTask);
    const toggleTaskStore = useTaskStore((state) => state.toggleTask);
    const deleteTask = useTaskStore((state) => state.deleteTask);
    const updateTask = useTaskStore((state) => state.updateTask);
    const setReminderId = useTaskStore((state) => state.setReminderId);
    const moveTaskToDate = useTaskStore((state) => state.moveTaskToDate);
    const restoreLastDeletedTask = useTaskStore((state) => state.restoreLastDeletedTask);
    const reorderTasks = useTaskStore((state) => state.reorderTasks);
    const insets = useSafeAreaInsets();

    const [showOverdueModal, setShowOverdueModal] = useState(false);

    const handleToggleTask = useCallback(async (id: string) => {
        const task = tasks.find(t => t.id === id);
        const isCompleting = task?.status === 'pending';

        if (isCompleting && task?.reminderId) {
            await cancelNotification(task.reminderId);
            setReminderId(id, undefined, undefined);
        }

        toggleTaskStore(id);

        if (isCompleting && onTaskComplete) {
            onTaskComplete();
        }
    }, [tasks, setReminderId, toggleTaskStore, onTaskComplete]);

    // --- Undo Logic (Toast) ---
    const [showUndo, setShowUndo] = useState(false);
    const undoOpacity = useRef(new Animated.Value(0)).current;

    const handleDeleteWithUndo = useCallback(async (id: string) => {
        const task = tasks.find(t => t.id === id);
        if (task?.reminderId) {
            await cancelNotification(task.reminderId);
        }

        deleteTask(id);
        setShowUndo(true);
        undoOpacity.setValue(0);

        Animated.timing(undoOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
        }).start();

        setTimeout(() => {
            Animated.timing(undoOpacity, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start(() => setShowUndo(false));
        }, 4000);
    }, [tasks, deleteTask, undoOpacity]);

    const handleUndo = useCallback(() => {
        restoreLastDeletedTask();
        Animated.timing(undoOpacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
        }).start(() => setShowUndo(false));
    }, [restoreLastDeletedTask, undoOpacity]);

    const [newTaskText, setNewTaskText] = useState('');
    const [isInputFocused, setIsInputFocused] = useState(false);
    const [isAnyTaskEditing, setIsAnyTaskEditing] = useState(false);
    const flatListRef = useRef<any>(null);

    const inputOpacity = useRef(new Animated.Value(1)).current;
    const inputTranslateY = useRef(new Animated.Value(0)).current;

    const dayTasks = useMemo(() =>
        tasks.filter((t) => t.date === dateKey).sort((a, b) => (a.order ?? a.createdAt) - (b.order ?? b.createdAt)),
        [tasks, dateKey]);

    const overdueTasks = useMemo(() => {
        const todayKey = format(new Date(), 'yyyy-MM-dd');
        return tasks.filter(t => t.date < todayKey && t.status === 'pending');
    }, [tasks]);

    const handleMoveOverdueToToday = () => {
        const todayKey = format(new Date(), 'yyyy-MM-dd');
        overdueTasks.forEach(task => {
            moveTaskToDate(task.id, todayKey);
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setShowOverdueModal(false);
    };

    let headerTitle = format(date, 'EEEE', { locale: tr });
    if (isToday(date)) headerTitle = 'Bugün';
    if (isYesterday(date)) headerTitle = 'Dün';
    if (isTomorrow(date)) headerTitle = 'Yarın';

    const dateDisplay = format(date, 'd MMM', { locale: tr });
    const showGoToToday = !isToday(date) && onGoToToday;
    const isPast = date < new Date();

    const handleAddTask = async () => {
        if (!newTaskText.trim()) {
            setNewTaskText('');
            return;
        }

        const originalText = newTaskText.trim();
        const lowerText = originalText.toLowerCase();

        let targetDate = date;
        let reminderDate: Date | null = null;
        let finalTaskText = originalText;

        const now = new Date();

        const isForContext = (text: string, keyword: string) => {
            return text.includes(`${keyword} için`) || text.includes(`için ${keyword}`);
        };

        let dayFound = false;
        let weekOffset = 0;

        if ((lowerText.includes('haftaya') || lowerText.includes('gelecek hafta')) && !isForContext(lowerText, 'haftaya')) {
            weekOffset = 1;
        }

        const daysMap: { [key: string]: number } = {
            'pazartesi': 1, 'salı': 2, 'çarşamba': 3, 'perşembe': 4, 'cuma': 5, 'cumartesi': 6, 'pazar': 0
        };

        if ((lowerText.includes('hafta sonu') || lowerText.includes('haftasonu')) && !isForContext(lowerText, 'haftasonu')) {
            const currentDay = now.getDay();
            let daysToSat = (6 - currentDay + 7) % 7;
            if (daysToSat === 0 && weekOffset === 0) daysToSat = 7;
            targetDate = addDays(now, daysToSat + (weekOffset * 7));
            dayFound = true;
        }

        if (!dayFound) {
            for (const [dayName, dayIndex] of Object.entries(daysMap)) {
                if (lowerText.includes(dayName) && !isForContext(lowerText, dayName)) {
                    const currentDay = now.getDay();
                    let daysToAdd = (dayIndex - currentDay + 7) % 7;

                    if (daysToAdd === 0 && weekOffset === 0) {
                        daysToAdd = 7;
                    }

                    targetDate = addDays(now, daysToAdd + (weekOffset * 7));
                    dayFound = true;
                    break;
                }
            }
        }

        if (!dayFound) {
            if (weekOffset > 0) {
                targetDate = addWeeks(now, weekOffset);
            } else if (lowerText.includes('yarın') && !isForContext(lowerText, 'yarın')) {
                targetDate = addDays(now, 1);
            } else if ((lowerText.includes('ertesi gün') || lowerText.includes('yarından sonra')) && !isForContext(lowerText, 'ertesi gün')) {
                if (lowerText.includes('yarından sonra')) {
                    targetDate = addDays(now, 2);
                } else {
                    targetDate = addDays(now, 1);
                }
            } else if ((lowerText.includes('gelecek ay') || lowerText.includes('öbür ay')) && !isForContext(lowerText, 'gelecek ay')) {
                targetDate = addMonths(now, 1);
            } else if ((lowerText.includes('seneye') || lowerText.includes('gelecek yıl')) && !isForContext(lowerText, 'seneye')) {
                targetDate = addYears(now, 1);
            }
        }

        if (differenceInCalendarDays(targetDate, date) !== 0) {
            reminderDate = setHours(setMinutes(targetDate, 0), 9);
        }

        if (lowerText.includes('akşam')) {
            const baseDate = targetDate;
            reminderDate = setHours(setMinutes(baseDate, 0), 21);
        } else if (lowerText.includes('sabah')) {
            const baseDate = targetDate;
            reminderDate = setHours(setMinutes(baseDate, 0), 9);
        } else if (lowerText.includes('öğle')) {
            const baseDate = targetDate;
            reminderDate = setHours(setMinutes(baseDate, 0), 12);
        }

        const specificTimeMatch = lowerText.match(/\b(\d{1,2})[:.:](\d{2})\b/);
        const suffixTimeMatch = lowerText.match(/\b(\d{1,2})('?)(da|de|te|ta|:00)\b/);

        if (specificTimeMatch) {
            const hour = parseInt(specificTimeMatch[1]);
            const minute = parseInt(specificTimeMatch[2]);

            if (hour >= 0 && hour < 24 && minute >= 0 && minute < 60) {
                reminderDate = setHours(setMinutes(targetDate, minute), hour);
            }
        } else if (suffixTimeMatch) {
            let hour = parseInt(suffixTimeMatch[1]);

            if (lowerText.includes('akşam') && hour < 12) {
                hour += 12;
            }
            if ((lowerText.includes('öğleden sonra') || lowerText.includes('öğlen')) && hour < 12) {
                hour += 12;
            }

            reminderDate = setHours(setMinutes(targetDate, 0), hour);
        }

        if (reminderDate) {
            if (reminderDate < now) {
                const pmDate = new Date(reminderDate);
                pmDate.setHours(pmDate.getHours() + 12);

                if (reminderDate.getHours() < 12 && pmDate > now) {
                    reminderDate = pmDate;
                } else {
                    if (differenceInCalendarDays(targetDate, date) === 0) {
                        targetDate = addDays(targetDate, 1);
                        reminderDate = addDays(reminderDate, 1);
                    }
                }
            }
        }

        const targetDateKey = format(targetDate, 'yyyy-MM-dd');

        const taskId = addTask(finalTaskText, targetDateKey, 'none');

        if (reminderDate && taskId) {
            if (reminderDate > new Date()) {
                const notifId = await schedulePushNotification(
                    `Hatırlatıcı: ${finalTaskText}`,
                    'Unutma!',
                    reminderDate
                );
                if (notifId) {
                    setReminderId(taskId, notifId, reminderDate.getTime());
                }
            }
        }

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setNewTaskText('');

        if (differenceInCalendarDays(targetDate, date) !== 0) {
            const dateStr = format(targetDate, 'd MMMM EEEE', { locale: tr });
            Alert.alert(
                "Planlandı 📅",
                `"${finalTaskText}" görevi ${dateStr} tarihine eklendi.`,
                [{ text: "Tamam" }]
            );
        }
    };

    const handleLongPress = useCallback((id: string, y?: number) => {
        onOpenReminder(id, y);
    }, [onOpenReminder]);

    const handleEditStart = useCallback((taskId: string) => {
        setIsAnyTaskEditing(true);
        const index = dayTasks.findIndex(t => t.id === taskId);
        if (index !== -1 && flatListRef.current) {
            setTimeout(() => {
                if (flatListRef.current?.scrollToIndex) {
                    flatListRef.current?.scrollToIndex({
                        index,
                        animated: true,
                        viewPosition: 0.5,
                    });
                }
            }, 100);
        }
    }, [dayTasks]);

    const handleEditEnd = useCallback(() => {
        setIsAnyTaskEditing(false);
    }, []);

    const handleDragEnd = useCallback(({ data }: { data: Task[] }) => {
        reorderTasks(dateKey, data);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, [reorderTasks, dateKey]);

    const renderItem = useCallback(({ item, drag, isActive }: RenderItemParams<Task>) => (
        <TaskItem
            task={item}
            onToggle={handleToggleTask}
            onDelete={handleDeleteWithUndo}
            onLongPress={handleLongPress}
            onUpdate={updateTask}
            onEditStart={handleEditStart}
            onEditEnd={handleEditEnd}
            onDrag={drag}
            isDragging={isActive}
        />
    ), [handleToggleTask, handleDeleteWithUndo, handleLongPress, updateTask, handleEditStart, handleEditEnd]);

    const keyExtractor = useCallback((item: Task) => item.id, []);

    useEffect(() => {
        const keyboardWillShowListener = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
            (e) => {
                if (isAnyTaskEditing) {
                    Animated.parallel([
                        Animated.timing(inputOpacity, {
                            toValue: 0,
                            duration: Platform.OS === 'ios' ? e.duration : 200,
                            useNativeDriver: true,
                        }),
                        Animated.timing(inputTranslateY, {
                            toValue: 20,
                            duration: Platform.OS === 'ios' ? e.duration : 200,
                            useNativeDriver: true,
                        }),
                    ]).start();
                }
            }
        );

        const keyboardWillHideListener = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
            (e) => {
                Animated.parallel([
                    Animated.timing(inputOpacity, {
                        toValue: 1,
                        duration: Platform.OS === 'ios' ? e.duration : 200,
                        useNativeDriver: true,
                    }),
                    Animated.timing(inputTranslateY, {
                        toValue: 0,
                        duration: Platform.OS === 'ios' ? e.duration : 200,
                        useNativeDriver: true,
                    }),
                ]).start();
            }
        );

        return () => {
            keyboardWillShowListener.remove();
            keyboardWillHideListener.remove();
        };
    }, [isAnyTaskEditing]);

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: C.backgroundDark }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
            <View style={styles.titleSection}>
                {showGoToToday && (
                    <Pressable
                        style={[styles.goToTodayButton, { flexDirection: isPast ? 'row-reverse' : 'row' }]}
                        onPress={onGoToToday}
                    >
                        <Ionicons
                            name={isPast ? "arrow-forward" : "arrow-back"}
                            size={16}
                            color={C.primary}
                        />
                        <Text style={[styles.goToTodayText, { color: C.primary }]}>Bugüne Git</Text>
                    </Pressable>
                )}

                <Text style={[styles.title, { color: C.textLight }]}>{headerTitle}</Text>
                <Text style={[styles.dateText, { color: C.textMuted }]}>{dateDisplay}</Text>

                {overdueTasks.length > 0 && (
                    <Pressable
                        style={styles.overdueButton}
                        onPress={() => {
                            Haptics.selectionAsync();
                            setShowOverdueModal(true);
                        }}
                    >
                        <Ionicons name="time-outline" size={24} color={C.textLight} />
                    </Pressable>
                )}

                <Pressable style={styles.calendarButton} onPress={onOpenCalendar}>
                    <Ionicons name="calendar-outline" size={24} color={C.textLight} />
                </Pressable>
            </View>

            <View style={{ flex: 1 }}>
                <DraggableFlatList
                    ref={flatListRef}
                    data={dayTasks}
                    keyExtractor={keyExtractor}
                    onDragEnd={handleDragEnd}
                    onDragBegin={() => Haptics.selectionAsync()}
                    renderItem={renderItem}
                    initialNumToRender={12}
                    maxToRenderPerBatch={12}
                    windowSize={7}
                    removeClippedSubviews={Platform.OS === 'android'}
                    activationDistance={8}
                    containerStyle={styles.list}
                    contentContainerStyle={[styles.listContent, dayTasks.length === 0 && styles.listContentEmpty]}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                    showsVerticalScrollIndicator={false}
                    autoscrollThreshold={60}
                    autoscrollSpeed={120}
                    animationConfig={{
                        damping: 28,
                        stiffness: 100,
                        mass: 0.5,
                    }}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="sparkles-outline" size={48} color={C.textMuted + '40'} />
                            <Text style={[styles.emptyText, { color: C.textMuted }]}>Henüz bir plan yok</Text>
                        </View>
                    }
                />
                <LinearGradient
                    colors={[C.backgroundDark, C.backgroundDark + '00']}
                    style={styles.topGradient}
                    pointerEvents="none"
                />
                <LinearGradient
                    colors={[C.backgroundDark + '00', C.backgroundDark]}
                    style={styles.bottomGradient}
                    pointerEvents="none"
                />
            </View>

            <Animated.View
                style={[
                    styles.bottomInputContainer,
                    {
                        opacity: inputOpacity,
                        transform: [{ translateY: inputTranslateY }],
                        paddingBottom: isInputFocused ? 0 : (insets.bottom || 24),
                    }
                ]}
                pointerEvents={isAnyTaskEditing ? 'none' : 'auto'}
            >
                {!isInputFocused && newTaskText.length === 0 ? (
                    <Pressable
                        style={[
                            styles.inputPlaceholder,
                            {
                                backgroundColor: C.primary + '18',
                                borderColor: C.primary + '60',
                                shadowColor: C.primary,
                            }
                        ]}
                        onPress={() => setIsInputFocused(true)}
                    >
                        <Ionicons name="add-circle" size={22} color={C.primary} />
                        <Text style={[styles.inputPlaceholderText, { color: C.primary }]}>Unutmadan yaz...</Text>
                    </Pressable>
                ) : (
                    <View style={[
                        styles.inputActive,
                        {
                            backgroundColor: C.primary + '10',
                            borderColor: C.primary + '40',
                        }
                    ]}>
                        <TextInput
                            style={[styles.input, { color: C.textLight }]}
                            placeholder="Unutmadan yaz..."
                            placeholderTextColor={C.textMuted + '80'}
                            value={newTaskText}
                            onChangeText={setNewTaskText}
                            onSubmitEditing={handleAddTask}
                            onFocus={() => setIsInputFocused(true)}
                            onBlur={() => {
                                if (newTaskText.trim().length === 0) {
                                    setIsInputFocused(false);
                                    setNewTaskText('');
                                }
                            }}
                            returnKeyType="done"
                            autoFocus={isInputFocused}
                        />
                    </View>
                )}
            </Animated.View>

            <OverdueModal
                visible={showOverdueModal}
                tasks={overdueTasks}
                onClose={() => setShowOverdueModal(false)}
                onMoveAllToToday={handleMoveOverdueToToday}
                onToggleTask={handleToggleTask}
            />
        </KeyboardAvoidingView>
    );
}

export default React.memo(DayView);

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    dateText: {
        fontSize: 14,
        fontWeight: '500',
        textAlign: 'center',
        marginTop: 4,
        marginBottom: 2,
    },
    titleSection: {
        position: 'relative',
        paddingHorizontal: 24,
        paddingTop: 16,
        marginBottom: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: '600',
        letterSpacing: -0.5,
        lineHeight: 38,
        textAlign: 'center',
    },
    list: {
        flex: 1,
        paddingHorizontal: 24,
    },
    listContent: {
        paddingBottom: 90,
    },
    bottomInputContainer: {
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 32,
        width: '100%',
    },
    inputPlaceholder: {
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 18,
        paddingHorizontal: 32,
        borderRadius: 40,
        borderWidth: 2,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    inputPlaceholderText: {
        fontSize: 16,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    inputActive: {
        minHeight: 40,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 20,
        borderWidth: 1.5,
    },
    input: {
        fontSize: 17,
        fontWeight: '400',
    },
    calendarButton: {
        position: 'absolute',
        right: 24,
        top: 23,
        zIndex: 10,
    },
    overdueButton: {
        position: 'absolute',
        right: 64,
        top: 23,
        zIndex: 10,
    },
    goToTodayButton: {
        position: 'absolute',
        left: 24,
        top: 23,
        zIndex: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        paddingVertical: 4,
    },
    goToTodayText: {
        fontSize: 12,
        fontWeight: '600',
    },
    listContentEmpty: {
        flex: 1,
        justifyContent: 'center',
        paddingBottom: 0,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        opacity: 0.8,
        transform: [{ translateY: -40 }],
    },
    emptyText: {
        fontSize: 16,
        marginTop: 12,
        fontWeight: '500',
    },
    topGradient: {
        position: 'absolute',
        top: -20,
        left: 0,
        right: 0,
        height: 50,
        zIndex: 1,
    },
    bottomGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 60,
        zIndex: 1,
    },
});
