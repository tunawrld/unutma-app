import ComboOverlay from '@/components/ComboOverlay';
import DayView from '@/components/DayView';
import ReminderBottomSheet from '@/components/ReminderBottomSheet';
import WelcomeScreen from '@/components/WelcomeScreen';
import { Colors } from '@/constants/Colors';
import { useTaskStore } from '@/store/taskStore';
import { cancelNotification, schedulePushNotification } from '@/utils/notifications';
import BottomSheet from '@gorhom/bottom-sheet';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { addDays, differenceInCalendarDays, format } from 'date-fns';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import PagerView from 'react-native-pager-view';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HomeScreen() {
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

    const handleTaskComplete = async () => {
        const now = Date.now();
        // Reset combo if more than 2 seconds passed
        if (now - lastComboTime.current < 2000) {
            comboCountRef.current += 1;
        } else {
            comboCountRef.current = 1;
        }
        lastComboTime.current = now;

        setComboCount(comboCountRef.current);
        setComboVisible(true);

        // Haptic Feedback (increasing intensity)
        if (comboCountRef.current === 2) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } else if (comboCountRef.current === 3) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } else if (comboCountRef.current > 3) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
    };
    // -------------------

    useEffect(() => {
        checkFirstLaunch();
    }, []);

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

    const handleOpenReminder = (taskId: string) => {
        setSelectedTaskId(taskId);
        setIsSheetOpen(true);
        bottomSheetRef.current?.expand();
    };

    const handleSaveReminder = async (reminderDate: Date) => {
        if (selectedTaskId) {
            const task = tasks.find(t => t.id === selectedTaskId);
            if (task) {
                if (task.reminderId) {
                    await cancelNotification(task.reminderId);
                }
                const id = await schedulePushNotification(
                    `Reminder: ${task.text}`,
                    'Don\'t forget!',
                    reminderDate
                );
                if (id) {
                    setReminderId(selectedTaskId, id, reminderDate.getTime());
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                } else {
                    alert("Cannot schedule reminder in the past!");
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
            deleteTask(selectedTaskId);
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

                // Eğer bildirim varsa, onu da yarına taşı
                if (task.reminderId && task.reminderDate) {
                    await cancelNotification(task.reminderId);

                    const oldReminderDate = new Date(task.reminderDate);
                    const newReminderDate = addDays(oldReminderDate, 1);

                    if (newReminderDate > new Date()) {
                        const newNotifId = await schedulePushNotification(
                            `Hatırlatıcı: ${task.text}`,
                            'Unutma!',
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

    const handleGoToToday = () => {
        const today = new Date();
        const diff = differenceInCalendarDays(today, initialDate);
        const todayPage = initialPage + diff;
        goToPage(todayPage);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    return (
        <GestureHandlerRootView style={styles.container}>
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
                                <Pressable style={styles.modalContent} onPress={e => e.stopPropagation()}>
                                    <View style={styles.modalHeader}>
                                        <Text style={styles.modalTitle}>Tarihe Git</Text>
                                    </View>
                                    <DateTimePicker
                                        value={tempDate}
                                        mode="date"
                                        display="inline"
                                        onChange={handleDateSelect}
                                        textColor={Colors.textLight}
                                        accentColor={Colors.primary}
                                        themeVariant="dark"
                                        locale="tr-TR"
                                    />
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
                        />
                    )
                )}
            </SafeAreaView>

            <ReminderBottomSheet
                ref={bottomSheetRef}
                isOpen={isSheetOpen}
                taskText={selectedTask?.text || ''}
                onSave={handleSaveReminder}
                onCancel={handleCancelReminder}
                onDelete={handleDeleteTask}
                onMoveToTomorrow={handleMoveToTomorrow}
                onRemoveReminder={handleRemoveReminder}
                existingDate={selectedTask?.reminderDate}
            />

            <ComboOverlay
                count={comboCount}
                visible={comboVisible}
                onAnimationFinish={() => setComboVisible(false)}
            />

            {isFirstLaunch && <WelcomeScreen onStart={handleWelcomeComplete} />}
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.backgroundDark,
    },
    safeArea: {
        flex: 1,
    },
    pager: {
        flex: 1,
    },
    calendarButton: {
        position: 'absolute',
        right: 24,
        zIndex: 10,
        padding: 8,
        backgroundColor: Colors.backgroundDark + '80',
        borderRadius: 20,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: Colors.backgroundDark,
        borderRadius: 20,
        padding: 16,
        width: '90%',
        maxWidth: 370,
        borderWidth: 1,
        borderColor: Colors.primary + '30',
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
        color: Colors.textLight,
    },
    modalConfirm: {
        fontSize: 17,
        fontWeight: '600',
        color: Colors.primary,
    },
    todayButton: {
        position: 'absolute',
        left: 24,
        zIndex: 10,
        padding: 8,
        backgroundColor: Colors.backgroundDark + '80', // semi-transparent
        borderRadius: 20,
    },
    todayButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.primary,
    },
});
