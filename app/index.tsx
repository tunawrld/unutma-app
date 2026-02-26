import ComboOverlay from '@/components/ComboOverlay';
import DailyQuote from '@/components/DailyQuote';
import DayView from '@/components/DayView';
import ReminderBottomSheet from '@/components/ReminderBottomSheet';
import WelcomeScreen from '@/components/WelcomeScreen';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useTaskStore } from '@/store/taskStore';
import { cancelNotification, manageDailyMotivationalReminder, schedulePushNotification } from '@/utils/notifications';
import BottomSheet from '@gorhom/bottom-sheet';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { addDays, differenceInCalendarDays, format } from 'date-fns';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, AppState, Modal, Platform, Pressable, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import PagerView from 'react-native-pager-view';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HomeScreen() {
    const C = useThemeColors();
    const colorScheme = useColorScheme();
    const [initialDate] = useState(new Date());
    const initialPage = 1000;
    const [activePage, setActivePage] = useState(initialPage);
    const bottomSheetRef = useRef<BottomSheet>(null);
    const pagerRef = useRef<PagerView>(null);
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);
    const [tempDate, setTempDate] = useState(new Date());
    const [targetPage, setTargetPage] = useState<number | null>(null);
    const insets = useSafeAreaInsets();

    const tasks = useTaskStore((state) => state.tasks);
    const setReminderId = useTaskStore((state) => state.setReminderId);
    const moveTaskToDate = useTaskStore((state) => state.moveTaskToDate);
    const deleteTask = useTaskStore((state) => state.deleteTask);
    const restoreLastDeletedTask = useTaskStore((state) => state.restoreLastDeletedTask);
    const updateTask = useTaskStore((state) => state.updateTask);

    useEffect(() => {
        if (targetPage !== null && activePage === targetPage) {
            setTargetPage(null);
        }
    }, [activePage, targetPage]);

    // --- COMBO LOGIC ---
    const [comboCount, setComboCount] = useState(0);
    const [comboVisible, setComboVisible] = useState(false);
    const lastComboTime = useRef(0);
    const comboCountRef = useRef(0);

    const handleTaskComplete = useCallback(async () => {
        const now = Date.now();
        if (now - lastComboTime.current < 2000) {
            comboCountRef.current += 1;
        } else {
            comboCountRef.current = 1;
        }
        lastComboTime.current = now;

        setComboCount(comboCountRef.current);
        setComboVisible(true);

        if (comboCountRef.current === 2) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } else if (comboCountRef.current === 3) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } else if (comboCountRef.current > 3) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
    }, [setComboCount, setComboVisible]);

    // --- Global Undo Logic ---
    const [showUndo, setShowUndo] = useState(false);
    const undoOpacity = useRef(new Animated.Value(0)).current;

    const handleGlobalDeleteTask = useCallback(async (id: string) => {
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

    const handleGlobalUndo = () => {
        restoreLastDeletedTask();
        Animated.timing(undoOpacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
        }).start(() => setShowUndo(false));
    };

    const handleSheetChange = (index: number) => {
        if (index === -1) {
            setIsSheetOpen(false);
            setSelectedTaskId(null);
        } else {
            setIsSheetOpen(true);
        }
    };

    useEffect(() => {
        checkFirstLaunch();

        const syncNotifications = async () => {
            try {
                const scheduled = await Notifications.getAllScheduledNotificationsAsync();
                const currentTasks = useTaskStore.getState().tasks;
                const validIds = new Set(
                    currentTasks
                        .filter(t => t.status === 'pending' && t.reminderId)
                        .map(t => t.reminderId)
                );

                for (const notif of scheduled) {
                    if (!validIds.has(notif.identifier)) {
                        await Notifications.cancelScheduledNotificationAsync(notif.identifier);
                    }
                }
            } catch (e) {
                console.error("Failed to sync notifications", e);
            }
        };

        syncNotifications();

        const subscription = AppState.addEventListener('change', nextAppState => {
            if (nextAppState === 'active') {
                syncNotifications();
            }
        });

        return () => subscription.remove();
    }, []);

    useEffect(() => {
        const todayKey = format(new Date(), 'yyyy-MM-dd');
        const hasPendingForTodayOrPast = tasks.some(t => t.status === 'pending' && t.date <= todayKey);
        manageDailyMotivationalReminder(hasPendingForTodayOrPast);
    }, [tasks]);

    const checkFirstLaunch = async () => {
        try {
            const hasLaunched = await AsyncStorage.getItem('hasLaunched');
            if (hasLaunched === null) {
                setIsFirstLaunch(true);
            } else {
                setIsFirstLaunch(false);
            }
        } catch (e) {
            setIsFirstLaunch(false);
        }
    };

    const handleWelcomeComplete = async () => {
        await AsyncStorage.setItem('hasLaunched', 'true');
        setIsFirstLaunch(false);
    };

    const goToPage = (page: number) => {
        const diff = Math.abs(page - activePage);
        if (diff === 0) return;

        setTargetPage(page);

        requestAnimationFrame(() => {
            if (diff > 1) {
                pagerRef.current?.setPageWithoutAnimation(page);
            } else {
                pagerRef.current?.setPage(page);
            }
        });
    };

    const handleOpenReminder = useCallback((taskId: string) => {
        setSelectedTaskId(taskId);
        setIsSheetOpen(true);
        bottomSheetRef.current?.expand();
    }, [setSelectedTaskId, setIsSheetOpen]);

    const handleSaveReminder = async (reminderDate: Date, taskText: string) => {
        if (selectedTaskId) {
            const task = tasks.find(t => t.id === selectedTaskId);
            if (task) {
                // Update text if changed
                if (taskText !== task.text) {
                    updateTask(selectedTaskId, taskText);
                }

                // Check if reminder needs update (date changed OR text changed for a future reminder)
                const dateChanged = !task.reminderDate || reminderDate.getTime() !== task.reminderDate;
                const textChanged = taskText !== task.text;
                const isFuture = reminderDate.getTime() > Date.now();

                if (dateChanged) {
                    if (task.reminderId) {
                        await cancelNotification(task.reminderId);
                    }

                    if (isFuture) {
                        const id = await schedulePushNotification(
                            `Unutma: ${taskText}`,
                            'Görevin tamamlanmayı bekliyor! 🚀',
                            reminderDate
                        );
                        if (id) {
                            setReminderId(selectedTaskId, id, reminderDate.getTime());
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        }
                    } else {
                        // Only alert if the user effectively changed the date to the past (or left it as default 'now')
                        alert("Cannot schedule reminder in the past!");
                    }
                } else if (textChanged && isFuture && task.reminderId) {
                    // Date didn't change, but text did, and it's a future reminder -> update notification content
                    await cancelNotification(task.reminderId);
                    const id = await schedulePushNotification(
                        `Unutma: ${taskText}`,
                        'Görevin tamamlanmayı bekliyor! 🚀',
                        reminderDate
                    );
                    if (id) {
                        setReminderId(selectedTaskId, id, reminderDate.getTime());
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    }
                }
            }
        }
        bottomSheetRef.current?.close();
        setSelectedTaskId(null);
        setIsSheetOpen(false);
    };

    const handleCancelReminder = () => {
        bottomSheetRef.current?.close();
        setSelectedTaskId(null);
        setIsSheetOpen(false);
    };

    const handleDeleteTask = () => {
        if (selectedTaskId) {
            handleGlobalDeleteTask(selectedTaskId);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        bottomSheetRef.current?.close();
        setSelectedTaskId(null);
        setIsSheetOpen(false);
    };

    const handleMoveToTomorrow = async () => {
        if (selectedTaskId) {
            const task = tasks.find(t => t.id === selectedTaskId);
            if (task) {
                const currentTaskDate = new Date(task.date);
                const tomorrowDate = addDays(currentTaskDate, 1);
                const tomorrowDateKey = format(tomorrowDate, 'yyyy-MM-dd');

                moveTaskToDate(selectedTaskId, tomorrowDateKey);

                if (task.reminderId && task.reminderDate) {
                    await cancelNotification(task.reminderId);

                    const oldReminderDate = new Date(task.reminderDate);
                    const newReminderDate = addDays(oldReminderDate, 1);

                    if (newReminderDate > new Date()) {
                        const newNotifId = await schedulePushNotification(
                            `Unutma: ${task.text}`,
                            'Görevin tamamlanmayı bekliyor! 🚀',
                            newReminderDate
                        );
                        if (newNotifId) {
                            setReminderId(selectedTaskId, newNotifId, newReminderDate.getTime());
                        }
                    }
                }

                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
        }
        bottomSheetRef.current?.close();
        setSelectedTaskId(null);
        setIsSheetOpen(false);
    };

    const handleRemoveReminder = async () => {
        if (selectedTaskId) {
            const task = tasks.find(t => t.id === selectedTaskId);
            if (task && task.reminderId) {
                await cancelNotification(task.reminderId);
                setReminderId(selectedTaskId, undefined, undefined);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
        }
        bottomSheetRef.current?.close();
        setSelectedTaskId(null);
        setIsSheetOpen(false);
    };

    const selectedTask = selectedTaskId ? tasks.find(t => t.id === selectedTaskId) : null;

    const handleDateSelect = (event: any, selectedDate?: Date) => {
        if (selectedDate) {
            setShowDatePicker(false);
            const diff = differenceInCalendarDays(selectedDate, initialDate);
            const newPage = initialPage + diff;
            goToPage(newPage);
        } else {
            setShowDatePicker(false);
        }
    };

    const handleGoToToday = useCallback(() => {
        const today = new Date();
        const diff = differenceInCalendarDays(today, initialDate);
        const todayPage = initialPage + diff;
        goToPage(todayPage);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, [initialDate, initialPage, goToPage]);

    return (
        <GestureHandlerRootView style={[styles.container, { backgroundColor: C.backgroundDark }]}>
            <SafeAreaView style={styles.safeArea}>
                <PagerView
                    ref={pagerRef}
                    style={styles.pager}
                    initialPage={initialPage}
                    onPageSelected={(e) => setActivePage(e.nativeEvent.position)}
                >
                    {Array.from({ length: 2001 }).map((_, index) => {
                        const dayOffset = index - initialPage;
                        const date = addDays(initialDate, dayOffset);
                        const isCloseToActive = Math.abs(index - activePage) <= 2;
                        const isCloseToTarget = targetPage !== null && Math.abs(index - targetPage) <= 2;
                        const shouldRender = isCloseToActive || isCloseToTarget;

                        if (!shouldRender) {
                            return <View key={index} style={{ flex: 1 }} />;
                        }

                        return (
                            <DayView
                                key={index}
                                date={date}
                                onOpenReminder={handleOpenReminder}
                                onGoToToday={handleGoToToday}
                                onOpenCalendar={() => {
                                    setTempDate(date);
                                    setShowDatePicker(true);
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                }}
                                onTaskComplete={handleTaskComplete}
                                onDeleteTask={handleGlobalDeleteTask}
                            />
                        );
                    })}
                </PagerView>

                {showDatePicker && (
                    Platform.OS === 'ios' ? (
                        <Modal
                            transparent
                            animationType="fade"
                            visible={showDatePicker}
                            onRequestClose={() => setShowDatePicker(false)}
                        >
                            <Pressable style={styles.modalOverlay} onPress={() => setShowDatePicker(false)}>
                                <Pressable
                                    style={[styles.modalContent, { backgroundColor: C.sheetDark, borderColor: C.primary + '30' }]}
                                    onPress={e => e.stopPropagation()}
                                >
                                    <View style={styles.modalHeader}>
                                        <Text style={[styles.modalTitle, { color: C.textLight }]}>Tarihe Git</Text>
                                    </View>
                                    <View style={{ position: 'relative', width: '100%' }}>
                                        <DateTimePicker
                                            value={tempDate}
                                            mode="date"
                                            display="inline"
                                            onChange={handleDateSelect}
                                            textColor={C.textLight}
                                            accentColor={C.primary}
                                            themeVariant={colorScheme === 'dark' ? 'dark' : 'light'}
                                            locale="tr-TR"
                                            minimumDate={new Date(new Date().getFullYear() - 1, 0, 1)}
                                            maximumDate={new Date(new Date().getFullYear() + 1, 11, 31)}
                                        />
                                        {/* Overlay to block Month/Year picker tap but allow arrows */}
                                        <Pressable
                                            style={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                width: '70%',
                                                height: 50,
                                            }}
                                        />
                                    </View>
                                </Pressable>
                            </Pressable>
                        </Modal>
                    ) : (
                        <DateTimePicker
                            value={addDays(initialDate, activePage - initialPage)}
                            mode="date"
                            display="default"
                            onChange={handleDateSelect}
                            locale="tr-TR"
                            minimumDate={new Date(new Date().getFullYear() - 1, 0, 1)}
                            maximumDate={new Date(new Date().getFullYear() + 1, 11, 31)}
                        />
                    )
                )}
            </SafeAreaView>

            <DailyQuote />

            <ReminderBottomSheet
                ref={bottomSheetRef}
                isOpen={isSheetOpen}
                taskText={selectedTask?.text || ''}
                existingDate={selectedTask?.reminderDate}
                onSave={handleSaveReminder}
                onCancel={handleCancelReminder}
                onDelete={handleDeleteTask}
                onMoveToTomorrow={handleMoveToTomorrow}
                onRemoveReminder={handleRemoveReminder}
                onSheetChange={handleSheetChange}
            />

            <ComboOverlay
                count={comboCount}
                visible={comboVisible}
                onAnimationFinish={() => setComboVisible(false)}
            />

            {/* Global Undo Toast */}
            {showUndo && (
                <Animated.View style={[styles.undoContainer, { opacity: undoOpacity, backgroundColor: C.cardBg }]}>
                    <Text style={[styles.undoText, { color: C.textLight }]}>Görev silindi</Text>
                    <Pressable onPress={handleGlobalUndo}>
                        <Text style={[styles.undoButton, { color: C.primary }]}>Geri Al</Text>
                    </Pressable>
                </Animated.View>
            )}

            {isFirstLaunch && <WelcomeScreen onStart={handleWelcomeComplete} />}
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    pager: {
        flex: 1,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        borderRadius: 20,
        padding: 16,
        width: '90%',
        maxWidth: 370,
        borderWidth: 1,
        alignItems: 'center',
    },
    modalHeader: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    // Global Undo Styles
    undoContainer: {
        position: 'absolute',
        bottom: 80,
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 10,
        width: '90%',
        maxWidth: 340,
        zIndex: 99999,
    },
    undoText: {
        fontSize: 14,
        fontWeight: '500',
    },
    undoButton: {
        fontSize: 14,
        fontWeight: 'bold',
        marginLeft: 16,
    },
});
