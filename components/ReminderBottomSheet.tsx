import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import DateTimePicker from '@react-native-community/datetimepicker';
import { addDays, addHours, format, isToday, isTomorrow, setHours, setMinutes } from 'date-fns';
import { tr } from 'date-fns/locale';
import * as Haptics from 'expo-haptics';
import React, { forwardRef, useCallback, useEffect, useRef, useState } from 'react';
import { Keyboard, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

interface ReminderBottomSheetProps {
    taskText: string;
    isOpen: boolean;
    existingDate?: number;
    onSave: (date: Date) => void;
    onCancel: () => void;
}

const ReminderBottomSheet = forwardRef<BottomSheet, ReminderBottomSheetProps>(
    ({ taskText, onSave, onCancel, isOpen, existingDate }, ref) => {
        const [snapPoints, setSnapPoints] = useState(['90%']);
        const [selectedDate, setSelectedDate] = useState(new Date());
        const [taskInputText, setTaskInputText] = useState(taskText);

        // iOS & Android State unified
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

        // Sync task text whenever it changes
        useEffect(() => {
            setTaskInputText(taskText);
        }, [taskText]);

        // Reset date and picker mode when modal opens
        useEffect(() => {
            if (isOpen) {
                setSelectedDate(new Date());
                setActivePickerMode(null);
            }
        }, [isOpen]);

        // Keyboard handling
        useEffect(() => {
            const keyboardWillShow = Keyboard.addListener(
                Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
                () => setSnapPoints(['95%'])
            );
            const keyboardWillHide = Keyboard.addListener(
                Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
                () => setSnapPoints(['90%'])
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

        const handleDatePress = () => {
            Haptics.selectionAsync();
            // Toggle or switch to date
            setActivePickerMode(activePickerMode === 'date' ? null : 'date');
        };

        const handleTimePress = () => {
            Haptics.selectionAsync();
            // Toggle or switch to time
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

        // Format logic for Display Card
        let dateLabel = format(selectedDate, 'd MMMM EEEE', { locale: tr });
        if (isToday(selectedDate)) dateLabel = 'Bugün';
        if (isTomorrow(selectedDate)) dateLabel = 'Yarın';

        const timeLabel = format(selectedDate, 'HH:mm');

        return (
            <BottomSheet
                ref={ref}
                index={-1}
                snapPoints={snapPoints}
                enablePanDownToClose={!activePickerMode} // Disable closing while picking
                enableContentPanningGesture={!activePickerMode} // Disable sheet pan while picking
                backdropComponent={renderBackdrop}
                backgroundStyle={styles.bottomSheetBackground}
                handleIndicatorStyle={styles.handleIndicator}
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
                            style={styles.taskInput}
                            placeholder="Unutmadan yaz..."
                            placeholderTextColor={Colors.white + '33'}
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
                            <View style={styles.existingReminderBanner}>
                                <Ionicons name="checkmark-circle-outline" size={18} color={Colors.primary} />
                                <Text style={styles.existingReminderText}>
                                    Zamanlandı: {format(existingDate, 'd MMMM HH:mm', { locale: tr })}
                                </Text>
                            </View>
                        )}

                        <View style={styles.reminderHeader}>
                            <Ionicons name="notifications-outline" size={20} color={Colors.primary} />
                            <Text style={styles.reminderLabel}>Zamanlayıcı</Text>
                        </View>

                        {/* Large Date Display Card */}
                        <View style={styles.dateDisplayCard}>
                            <Pressable style={styles.dateInfoLeft} onPress={handleDatePress}>
                                <Text style={styles.dateLabelText}>{dateLabel}</Text>
                                <Text style={styles.fullDateText}>{format(selectedDate, 'd MMMM yyyy', { locale: tr })}</Text>
                            </Pressable>
                            <Pressable style={styles.timeInfoRight} onPress={handleTimePress}>
                                <Text style={styles.timeLabelText}>{timeLabel}</Text>
                            </Pressable>
                        </View>

                        {/* Pickers */}
                        {Platform.OS === 'ios' && activePickerMode && (
                            <View style={styles.pickerWrapper}>
                                <DateTimePicker
                                    value={selectedDate}
                                    mode={activePickerMode}
                                    display={activePickerMode === 'date' ? 'inline' : 'spinner'}
                                    onChange={handleDateChange}
                                    textColor={Colors.white}
                                    themeVariant="dark"
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
                                textColor={Colors.white}
                                themeVariant="dark"
                            />
                        )}

                        {/* Quick Suggestions - Grid Layout */}
                        <View style={styles.suggestionsContainer}>
                            {quickSuggestions.map((suggestion, index) => (
                                <Pressable
                                    key={index}
                                    style={styles.suggestionChip}
                                    onPress={() => {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        suggestion.action();
                                    }}
                                >
                                    <View style={styles.chipContent}>
                                        <Ionicons name="flash-outline" size={12} color={Colors.white + '80'} />
                                        <Text style={styles.suggestionText}>{suggestion.label}</Text>
                                    </View>
                                </Pressable>
                            ))}
                        </View>
                    </View>
                </BottomSheetScrollView>

                {/* Fixed Header at Bottom */}
                <View style={[styles.fixedHeader, { paddingBottom: Platform.OS === 'ios' ? 32 : 24 }]}>
                    <Pressable onPress={onCancel} hitSlop={20} style={styles.cancelButtonContainer}>
                        <Text style={styles.cancelButton}>İptal</Text>
                    </Pressable>
                    <Pressable onPress={handleSave} style={styles.saveButton}>
                        <Text style={styles.saveButtonText}>Kaydet</Text>
                    </Pressable>
                </View>
            </BottomSheet>
        );
    }
);

const styles = StyleSheet.create({
    bottomSheetBackground: {
        backgroundColor: Colors.sheetDark,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
    },
    handleIndicator: {
        backgroundColor: Colors.white + '20',
        width: 40,
        height: 4,
        marginTop: 8
    },
    contentContainer: {
        paddingHorizontal: 24,
    },
    scrollContent: {
        paddingBottom: 120, // Extra padding for fixed header at bottom
    },
    fixedHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 32,
        backgroundColor: Colors.sheetDark,
        borderTopWidth: 1,
        borderTopColor: Colors.white + '08',
    },
    cancelButtonContainer: {
        padding: 8,
    },
    cancelButton: {
        fontSize: 16,
        fontWeight: '500',
        color: Colors.textMuted,
        padding: 8,
    },
    saveButton: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 24,
    },
    saveButtonText: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.backgroundDark, // Dark text on primary button
    },
    inputSection: {
        marginBottom: 24,
    },
    taskInput: {
        fontSize: 22,
        fontWeight: '500',
        color: Colors.white,
        minHeight: 80,
        textAlignVertical: 'top',
        lineHeight: 28,
    },
    reminderSection: {
        gap: 16,
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
        color: Colors.primary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    // New Card Styles
    dateDisplayCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: Colors.white + '08', // Low opacity white
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: Colors.white + '0D',
    },
    dateInfoLeft: {
        flex: 1,
    },
    dateLabelText: {
        fontSize: 20,
        fontWeight: '600',
        color: Colors.white,
        marginBottom: 4,
    },
    fullDateText: {
        fontSize: 14,
        color: Colors.white + '80', // subtitles
    },
    timeInfoRight: {
        backgroundColor: Colors.primary + '1A', // pill bg
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: Colors.primary + '30',
    },
    timeLabelText: {
        fontSize: 28,
        fontWeight: '700',
        color: Colors.primary,
        fontVariant: ['tabular-nums'],
    },
    pickerWrapper: {
        backgroundColor: Colors.white + '05',
        borderRadius: 16,
        overflow: 'hidden',
        padding: 8,
        marginTop: -8, // connect visual
    },
    dateTimePicker: {
        height: 340, // Ensure height for inline picker
        width: '100%',
    },
    // Chips
    suggestionsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        paddingVertical: 8,
    },
    suggestionChip: {
        backgroundColor: Colors.white + '0A',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.white + '08',
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
        color: Colors.white,
    },
    existingReminderBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: Colors.primary + '15',
        padding: 12,
        borderRadius: 16,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: Colors.primary + '20',
    },
    existingReminderText: {
        fontSize: 14,
        color: Colors.primary,
        fontWeight: '600',
    },
});

export default ReminderBottomSheet;
