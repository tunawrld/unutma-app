import { useThemeColors } from '@/hooks/useThemeColors';

import { Ionicons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import DateTimePicker from '@react-native-community/datetimepicker';
import { addDays, addHours, format, isToday, isTomorrow, setHours, setMinutes } from 'date-fns';
import { tr } from 'date-fns/locale';
import * as Haptics from 'expo-haptics';
import React, { forwardRef, useCallback, useEffect, useRef, useState } from 'react';
import { Keyboard, Platform, Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';

interface ReminderBottomSheetProps {
    taskText: string;
    isOpen?: boolean;
    existingDate?: number;
    onSave: (date: Date) => void;
    onCancel: () => void;
    onDelete?: () => void;
    onMoveToTomorrow?: () => void;
    onRemoveReminder?: () => void;
    onSheetChange?: (index: number) => void;
}

const ReminderBottomSheet = forwardRef<BottomSheet, ReminderBottomSheetProps>(
    ({ taskText, onSave, onCancel, isOpen, existingDate, onMoveToTomorrow, onDelete, onRemoveReminder, onSheetChange }, ref) => {
        const C = useThemeColors();
        const colorScheme = useColorScheme();
        const [snapPoints, setSnapPoints] = useState(['65%']);
        const [selectedDate, setSelectedDate] = useState(new Date());
        const [taskInputText, setTaskInputText] = useState(taskText);

        const [activePickerMode, setActivePickerMode] = useState<'date' | 'time' | null>(null);

        const scrollViewRef = useRef<any>(null);
        const inputRef = useRef<any>(null);

        const renderBackdrop = useCallback(
            (props: any) => (
                <BottomSheetBackdrop
                    {...props}
                    disappearsOnIndex={-1}
                    appearsOnIndex={0}
                    opacity={0.4}
                />
            ),
            []
        );

        useEffect(() => {
            setTaskInputText(taskText);
        }, [taskText]);

        useEffect(() => {
            if (isOpen) {
                setSelectedDate(new Date());
                setActivePickerMode(null);
            }
        }, [isOpen]);

        useEffect(() => {
            const keyboardWillShow = Keyboard.addListener(
                Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
                () => setSnapPoints(['95%'])
            );
            const keyboardWillHide = Keyboard.addListener(
                Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
                () => setSnapPoints(['65%'])
            );
            return () => {
                keyboardWillShow.remove();
                keyboardWillHide.remove();
            };
        }, []);

        const handleSave = () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onSave(selectedDate);
        };

        const handleMoveToTomorrow = () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            if (onMoveToTomorrow) {
                onMoveToTomorrow();
            }
        };

        const handleDatePress = () => {
            Haptics.selectionAsync();
            setActivePickerMode(activePickerMode === 'date' ? null : 'date');
        };

        const handleTimePress = () => {
            Haptics.selectionAsync();
            setActivePickerMode(activePickerMode === 'time' ? null : 'time');
        };

        const handleDateChange = (event: any, date?: Date) => {
            if (Platform.OS === 'android') {
                setActivePickerMode(null);
            }
            if (date) {
                setSelectedDate(date);
            }
        };

        const quickSuggestions = [
            { label: '1 saat sonra', action: () => setSelectedDate(addHours(new Date(), 1)) },
            { label: 'Bu akşam 21:00', action: () => setSelectedDate(setHours(setMinutes(new Date(), 0), 21)) },
            { label: 'Yarın sabah', action: () => setSelectedDate(setHours(addDays(new Date(), 1), 9)) },
            { label: 'Haftaya', action: () => setSelectedDate(addDays(new Date(), 7)) },
        ];

        let dateLabel = format(selectedDate, 'd MMMM EEEE', { locale: tr });
        if (isToday(selectedDate)) dateLabel = 'Bugün';
        if (isTomorrow(selectedDate)) dateLabel = 'Yarın';

        const timeLabel = format(selectedDate, 'HH:mm');

        return (
            <BottomSheet
                ref={ref}
                index={-1}
                snapPoints={snapPoints}
                onChange={onSheetChange}
                enablePanDownToClose={!activePickerMode}
                enableContentPanningGesture={!activePickerMode}
                backdropComponent={renderBackdrop}
                backgroundStyle={[styles.bottomSheetBackground, { backgroundColor: C.sheetDark }]}
                handleIndicatorStyle={[styles.handleIndicator, { backgroundColor: C.border + '20' }]}
                keyboardBehavior="fillParent"
                keyboardBlurBehavior="restore"
                android_keyboardInputMode="adjustResize"
            >
                <BottomSheetScrollView
                    ref={scrollViewRef}
                    style={styles.contentContainer}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Task Input */}
                    <View style={styles.inputSection}>
                        <BottomSheetTextInput
                            ref={inputRef}
                            style={[styles.taskInput, { color: C.textLight }]}
                            placeholder="Unutmadan yaz..."
                            placeholderTextColor={C.textMuted + '80'}
                            value={taskInputText}
                            onChangeText={setTaskInputText}
                            multiline
                            onFocus={() => {
                                setTimeout(() => {
                                    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
                                }, 100);
                            }}
                        />
                    </View>

                    {/* Reminder Section */}
                    <View style={styles.reminderSection}>
                        {!!existingDate && existingDate > Date.now() && (
                            <View style={styles.existingReminderContainer}>
                                <View style={[styles.existingReminderBanner, { backgroundColor: C.primary + '15', borderColor: C.primary + '20' }]}>
                                    <Ionicons name="checkmark-circle-outline" size={18} color={C.primary} />
                                    <Text style={[styles.existingReminderText, { color: C.primary }]}>
                                        Zamanlandı: {format(existingDate, 'd MMMM HH:mm', { locale: tr })}
                                    </Text>
                                </View>
                                {onRemoveReminder && (
                                    <Pressable
                                        style={[styles.removeReminderButton, { backgroundColor: C.border + '08' }]}
                                        onPress={() => {
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                            onRemoveReminder();
                                        }}
                                    >
                                        <Ionicons name="close-circle" size={20} color={C.textMuted} />
                                    </Pressable>
                                )}
                            </View>
                        )}

                        <View style={styles.reminderHeader}>
                            <Ionicons name="notifications-outline" size={20} color={C.primary} />
                            <Text style={[styles.reminderLabel, { color: C.primary }]}>Zamanlayıcı</Text>
                        </View>

                        {/* Large Date Display Card */}
                        <View style={[styles.dateDisplayCard, { backgroundColor: C.border + '08', borderColor: C.border + '0D' }]}>
                            <Pressable style={styles.dateInfoLeft} onPress={handleDatePress}>
                                <Text style={[styles.dateLabelText, { color: C.textLight }]}>{dateLabel}</Text>
                                <Text style={[styles.fullDateText, { color: C.textMuted }]}>{format(selectedDate, 'd MMMM yyyy', { locale: tr })}</Text>
                            </Pressable>
                            <Pressable
                                style={[styles.timeInfoRight, { backgroundColor: C.primary + '1A', borderColor: C.primary + '30' }]}
                                onPress={handleTimePress}
                            >
                                <Text style={[styles.timeLabelText, { color: C.primary }]}>{timeLabel}</Text>
                            </Pressable>
                        </View>

                        {/* Pickers */}
                        {Platform.OS === 'ios' && activePickerMode && (
                            <View style={[styles.pickerWrapper, { backgroundColor: C.border + '05' }]}>
                                <DateTimePicker
                                    value={selectedDate}
                                    mode={activePickerMode}
                                    display={activePickerMode === 'date' ? 'inline' : 'spinner'}
                                    onChange={handleDateChange}
                                    textColor={C.textLight}
                                    themeVariant={colorScheme === 'dark' ? 'dark' : 'light'}
                                    locale="tr-TR"
                                    style={styles.dateTimePicker}
                                />
                            </View>
                        )}
                        {Platform.OS === 'android' && activePickerMode && (
                            <DateTimePicker
                                value={selectedDate}
                                mode={activePickerMode}
                                display="default"
                                onChange={handleDateChange}
                                textColor={C.textLight}
                                themeVariant={colorScheme === 'dark' ? 'dark' : 'light'}
                            />
                        )}

                        {/* Quick Suggestions */}
                        <View style={styles.suggestionsContainer}>
                            {quickSuggestions.map((suggestion, index) => (
                                <Pressable
                                    key={index}
                                    style={[
                                        styles.suggestionChip,
                                        { backgroundColor: C.border + '0A', borderColor: C.border + '10' }
                                    ]}
                                    onPress={() => {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        suggestion.action();
                                    }}
                                >
                                    <View style={styles.chipContent}>
                                        <Ionicons name="flash-outline" size={12} color={C.textMuted} />
                                        <Text style={[styles.suggestionText, { color: C.textLight }]}>{suggestion.label}</Text>
                                    </View>
                                </Pressable>
                            ))}
                        </View>

                        {/* Move to Tomorrow Action */}
                        {onMoveToTomorrow && (
                            <Pressable
                                style={[
                                    styles.moveToTomorrowButton,
                                    { backgroundColor: C.primary + '20', borderColor: C.primary + '40' }
                                ]}
                                onPress={handleMoveToTomorrow}
                            >
                                <Ionicons name="arrow-forward-outline" size={18} color={C.primary} />
                                <Text style={[styles.moveToTomorrowText, { color: C.primary }]}>Yarına Aktar</Text>
                                <Text style={[styles.moveToTomorrowSubtext, { color: C.primary + 'AA' }]}>Görevi yarın için planla</Text>
                            </Pressable>
                        )}
                    </View>
                </BottomSheetScrollView>

                {/* Fixed Footer */}
                <View style={[
                    styles.fixedHeader,
                    {
                        paddingBottom: Platform.OS === 'ios' ? 32 : 24,
                        backgroundColor: C.sheetDark,
                        borderTopColor: C.border + '08',
                    }
                ]}>
                    <Pressable
                        onPress={() => {
                            if (onDelete) {
                                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                                onDelete();
                            }
                        }}
                        hitSlop={20}
                        style={styles.deleteButtonContainer}
                    >
                        <Ionicons name="trash-outline" size={18} color={C.red} />
                        <Text style={[styles.deleteButton, { color: C.red }]}>Sil</Text>
                    </Pressable>
                    <Pressable onPress={handleSave} style={[styles.saveButton, { backgroundColor: C.primary }]}>
                        <Text style={[styles.saveButtonText, { color: C.backgroundDark }]}>Kaydet</Text>
                    </Pressable>
                </View>
            </BottomSheet>
        );
    }
);

const styles = StyleSheet.create({
    bottomSheetBackground: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
    },
    handleIndicator: {
        width: 40,
        height: 4,
        marginTop: 8
    },
    contentContainer: {
        paddingHorizontal: 24,
    },
    scrollContent: {
        paddingBottom: 120,
    },
    fixedHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 32,
        borderTopWidth: 1,
    },
    deleteButtonContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        padding: 8,
    },
    deleteButton: {
        fontSize: 16,
        fontWeight: '600',
    },
    saveButton: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 24,
    },
    saveButtonText: {
        fontSize: 15,
        fontWeight: '700',
    },
    inputSection: {
        marginBottom: 8,
    },
    taskInput: {
        fontSize: 20,
        fontWeight: '500',
        minHeight: 60,
        textAlignVertical: 'top',
        lineHeight: 28,
        paddingTop: 0,
    },
    reminderSection: {
        gap: 12,
    },
    reminderHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    reminderLabel: {
        fontSize: 14,
        fontWeight: '600',
    },
    dateDisplayCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
    },
    dateInfoLeft: {
        flex: 1,
    },
    dateLabelText: {
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 4,
    },
    fullDateText: {
        fontSize: 14,
    },
    timeInfoRight: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 14,
        borderWidth: 1,
    },
    timeLabelText: {
        fontSize: 28,
        fontWeight: '700',
        fontVariant: ['tabular-nums'],
    },
    pickerWrapper: {
        borderRadius: 16,
        overflow: 'hidden',
        padding: 8,
        marginTop: -8,
    },
    dateTimePicker: {
        height: 340,
        width: '100%',
    },
    suggestionsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        paddingVertical: 8,
    },
    suggestionChip: {
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 16,
        borderWidth: 1,
        flexGrow: 1,
        minWidth: '45%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    chipContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    suggestionText: {
        fontSize: 14,
        fontWeight: '500',
    },
    existingReminderText: {
        fontSize: 14,
        fontWeight: '600',
    },
    existingReminderContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    existingReminderBanner: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: 12,
        borderRadius: 16,
        borderWidth: 1,
    },
    removeReminderButton: {
        padding: 8,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    moveToTomorrowButton: {
        borderRadius: 20,
        padding: 20,
        marginTop: 8,
        borderWidth: 1.5,
        alignItems: 'center',
        gap: 6,
    },
    moveToTomorrowText: {
        fontSize: 16,
        fontWeight: '700',
        marginTop: 4,
    },
    moveToTomorrowSubtext: {
        fontSize: 13,
        fontWeight: '500',
    },
});

ReminderBottomSheet.displayName = 'ReminderBottomSheet';

export default ReminderBottomSheet;
