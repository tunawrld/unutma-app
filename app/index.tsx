import DayView from '@/components/DayView';
import ReminderBottomSheet from '@/components/ReminderBottomSheet';
import { Colors } from '@/constants/Colors';
import { useTaskStore } from '@/store/taskStore';
import { cancelNotification, schedulePushNotification } from '@/utils/notifications';
import BottomSheet from '@gorhom/bottom-sheet';
import DateTimePicker from '@react-native-community/datetimepicker';
import { addDays, differenceInCalendarDays } from 'date-fns';
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
    const [tempDate, setTempDate] = useState(new Date());
    const [targetPage, setTargetPage] = useState<number | null>(null);
    const insets = useSafeAreaInsets();

    const tasks = useTaskStore((state) => state.tasks);
    const setReminderId = useTaskStore((state) => state.setReminderId);

    // Reset targetPage when we reach the destination
    useEffect(() => {
        if (targetPage !== null && activePage === targetPage) {
            setTargetPage(null);
        }
    }, [activePage, targetPage]);

    const goToPage = (page: number) => {
        const diff = Math.abs(page - activePage);
        if (diff === 0) return;

        // If distance is large, snap instantly to avoid scrolling through empty pages
        // But render it first (via targetPage) so it's not white
        if (diff > 5) {
            setTargetPage(page);
            // Wait a frame for render, then snap
            requestAnimationFrame(() => {
                pagerRef.current?.setPageWithoutAnimation(page);
            });
        } else {
            // Smooth scroll for short distances
            pagerRef.current?.setPage(page);
        }
    };

    const handleOpenReminder = (taskId: string) => {
        setSelectedTaskId(taskId);
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
                    setReminderId(selectedTaskId, id);
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                } else {
                    alert("Cannot schedule reminder in the past!");
                }
            }
        }
        bottomSheetRef.current?.close();
        setSelectedTaskId(null);
    };

    const handleCancelReminder = () => {
        bottomSheetRef.current?.close();
        setSelectedTaskId(null);
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

    const isCurrentPageToday = (() => {
        const today = new Date();
        const diff = differenceInCalendarDays(today, initialDate);
        const todayPage = initialPage + diff;
        return activePage === todayPage;
    })();

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

                        // Only render components close to current page (Windowing)
                        // OR close to the target page we are jumping to
                        const isCloseToActive = Math.abs(index - activePage) <= 2;
                        const isCloseToTarget = targetPage !== null && Math.abs(index - targetPage) <= 2;

                        // We render if it's close to EITHER the current view or the destination
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
                            />
                        );
                    })}
                </PagerView>

                {/* Date Picker (Modal for iOS, Inline for Android) */}
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
                taskText={selectedTask?.text || ''}
                onSave={handleSaveReminder}
                onCancel={handleCancelReminder}
            />
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
        backgroundColor: Colors.backgroundDark + '80', // semi-transparent
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
        alignItems: 'center', // Center children (calendar)
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
