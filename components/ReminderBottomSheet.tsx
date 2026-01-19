import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import DateTimePicker from '@react-native-community/datetimepicker';
import { addDays, addHours, format, setHours, setMinutes } from 'date-fns';
import React, { forwardRef, useCallback, useEffect, useRef, useState } from 'react';
import { Keyboard, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

interface ReminderBottomSheetProps {
    taskText: string;
    onSave: (date: Date) => void;
    onCancel: () => void;
}

const ReminderBottomSheet = forwardRef<BottomSheet, ReminderBottomSheetProps>(
    ({ taskText, onSave, onCancel }, ref) => {
        const [snapPoints, setSnapPoints] = useState(['90%']);
        const [selectedDate, setSelectedDate] = useState(new Date());
        const [taskInputText, setTaskInputText] = useState(taskText);
        const [showDatePicker, setShowDatePicker] = useState(false);
        const [showTimePicker, setShowTimePicker] = useState(false);
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

        // Sync task text when modal opens with a new task
        useEffect(() => {
            setTaskInputText(taskText);
        }, [taskText]);

        // Handle keyboard show/hide to adjust bottom sheet
        useEffect(() => {
            const keyboardWillShow = Keyboard.addListener(
                Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
                (e) => {
                    // When keyboard shows, increase snap point to push sheet higher
                    setSnapPoints(['95%']);
                }
            );

            const keyboardWillHide = Keyboard.addListener(
                Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
                () => {
                    // When keyboard hides, return to normal size
                    setSnapPoints(['90%']);
                }
            );

            return () => {
                keyboardWillShow.remove();
                keyboardWillHide.remove();
            };
        }, []);

        const handleSave = () => {
            onSave(selectedDate);
        };

        const quickSuggestions = [
            { label: '1 saat sonra', action: () => setSelectedDate(addHours(new Date(), 1)) },
            { label: 'Akşam 21:00', action: () => setSelectedDate(setHours(setMinutes(new Date(), 0), 21)) },
            { label: 'Yarın sabah', action: () => setSelectedDate(setHours(addDays(new Date(), 1), 9)) },
            { label: 'Haftaya', action: () => setSelectedDate(addDays(new Date(), 7)) },
        ];

        return (
            <BottomSheet
                ref={ref}
                index={-1}
                snapPoints={snapPoints}
                enablePanDownToClose
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
                    {/* Header */}
                    <View style={styles.header}>
                        <Pressable onPress={onCancel}>
                            <Text style={styles.cancelButton}>İptal</Text>
                        </Pressable>
                        <Pressable onPress={handleSave} style={styles.saveButton}>
                            <Text style={styles.saveButtonText}>Kaydet</Text>
                        </Pressable>
                    </View>

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
                                // Scroll to top to show input when keyboard opens
                                setTimeout(() => {
                                    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
                                }, 100);
                            }}
                        />
                    </View>

                    {/* Reminder Section */}
                    <View style={styles.reminderSection}>
                        <View style={styles.reminderHeader}>
                            <Ionicons name="notifications-outline" size={18} color={Colors.primary} />
                            <Text style={styles.reminderLabel}>Hatırlatıcı</Text>
                        </View>

                        {/* Date/Time Pickers - Interactive */}
                        <View style={styles.pickerContainer}>
                            <Pressable
                                style={styles.pickerBox}
                                onPress={() => setShowDatePicker(true)}
                            >
                                <Text style={styles.pickerLabel}>Tarih</Text>
                                <Text style={styles.pickerValue}>{format(selectedDate, 'dd MMM')}</Text>
                            </Pressable>
                            <Pressable
                                style={styles.pickerBox}
                                onPress={() => setShowTimePicker(true)}
                            >
                                <Text style={styles.pickerLabel}>Saat</Text>
                                <Text style={styles.pickerValue}>{format(selectedDate, 'HH:mm')}</Text>
                            </Pressable>
                        </View>

                        {/* Date Picker Modal */}
                        {showDatePicker && (
                            <DateTimePicker
                                value={selectedDate}
                                mode="date"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                onChange={(_event, date) => {
                                    setShowDatePicker(Platform.OS === 'ios');
                                    if (date) setSelectedDate(date);
                                }}
                                textColor={Colors.white}
                                themeVariant="dark"
                            />
                        )}

                        {/* Time Picker Modal */}
                        {showTimePicker && (
                            <DateTimePicker
                                value={selectedDate}
                                mode="time"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                onChange={(_event, date) => {
                                    setShowTimePicker(Platform.OS === 'ios');
                                    if (date) setSelectedDate(date);
                                }}
                                textColor={Colors.white}
                                themeVariant="dark"
                            />
                        )}

                        {/* Quick Suggestions */}
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.suggestionsContainer}
                        >
                            {quickSuggestions.map((suggestion, index) => (
                                <Pressable
                                    key={index}
                                    style={styles.suggestionChip}
                                    onPress={suggestion.action}
                                >
                                    <Text style={styles.suggestionText}>{suggestion.label}</Text>
                                </Pressable>
                            ))}
                        </ScrollView>
                    </View>
                </BottomSheetScrollView>
            </BottomSheet>
        );
    }
);

const styles = StyleSheet.create({
    bottomSheetBackground: {
        backgroundColor: Colors.sheetDark,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
    },
    handleIndicator: {
        backgroundColor: Colors.white + '1A',
        width: 40,
        height: 4,
    },
    contentContainer: {
        paddingHorizontal: 24,
    },
    scrollContent: {
        paddingBottom: 200,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        marginBottom: 16,
    },
    cancelButton: {
        fontSize: 14,
        fontWeight: '500',
        color: '#9ac1a4',
    },
    saveButton: {
        backgroundColor: Colors.primary + '1A',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
    },
    saveButtonText: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.primary,
    },
    inputSection: {
        marginBottom: 32,
    },
    taskInput: {
        fontSize: 20,
        fontWeight: '500',
        color: Colors.white,
        minHeight: 120,
        textAlignVertical: 'top',
    },
    reminderSection: {
        gap: 16,
    },
    reminderHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    reminderLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.white + '66',
    },
    pickerContainer: {
        flexDirection: 'row',
        gap: 16,
    },
    pickerBox: {
        flex: 1,
        backgroundColor: '#29422f' + '4D',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.white + '0D',
        paddingVertical: 12,
        paddingHorizontal: 8,
        alignItems: 'center',
        gap: 4,
    },
    pickerLabel: {
        fontSize: 12,
        color: Colors.white + '4D',
    },
    pickerValue: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.white,
    },
    suggestionsContainer: {
        flexDirection: 'row',
        gap: 8,
        paddingVertical: 12,
    },
    suggestionChip: {
        backgroundColor: Colors.white + '0D',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    suggestionText: {
        fontSize: 12,
        fontWeight: '500',
        color: Colors.white + 'B3',
    },
});

export default ReminderBottomSheet;
