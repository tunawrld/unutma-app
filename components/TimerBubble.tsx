import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/theme';

import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { addDays, addHours, format, isToday, isTomorrow, setHours, setMinutes } from 'date-fns';
import { tr } from 'date-fns/locale';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useState } from 'react';
import { Dimensions, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BUBBLE_WIDTH = SCREEN_WIDTH * 0.9;
const MAX_HEIGHT = 500;

interface TimerBubbleProps {
    visible: boolean;
    initialY: number;
    taskText: string;
    existingDate?: number;
    onSave: (date: Date) => void;
    onCancel: () => void;
    onDelete?: () => void;
}

export default function TimerBubble({
    visible,
    initialY,
    taskText,
    existingDate,
    onSave,
    onCancel,
    onDelete
}: TimerBubbleProps) {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showPicker, setShowPicker] = useState(false);
    const [pickerMode, setPickerMode] = useState<'date' | 'time'>('time');

    // Animation values
    const translateY = useSharedValue(0);
    const scale = useSharedValue(0);
    const opacity = useSharedValue(0);

    // Initial setup
    useEffect(() => {
        if (visible) {
            setSelectedDate(existingDate ? new Date(existingDate) : new Date());

            // Calculate start position to center the bubble relatively, but respect initialY
            // We want the bubble to appear near the touch, but clamped to screen
            let startY = initialY - 200; // Shift up a bit to show above finger
            if (startY < 50) startY = 50;
            if (startY > SCREEN_HEIGHT - 400) startY = SCREEN_HEIGHT - 400;

            translateY.value = startY;

            scale.value = withSpring(1, { damping: 12 });
            opacity.value = withTiming(1, { duration: 200 });
        } else {
            scale.value = withTiming(0, { duration: 200 });
            opacity.value = withTiming(0, { duration: 200 });
        }
    }, [visible, existingDate, initialY]);

    const pan = Gesture.Pan()
        .onChange((event) => {
            translateY.value += event.changeY;
        })
        .onFinalize(() => {
            // Clamp to screen bounds logic could go here
        });

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateY: translateY.value },
            { scale: scale.value }
        ],
        opacity: opacity.value,
    }));

    const handleSave = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onSave(selectedDate);
    };

    const handleQuickAction = (action: () => void) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        action();
    };

    const quickSuggestions = [
        { label: '+1 Saat', action: () => setSelectedDate(addHours(new Date(), 1)) },
        { label: 'Bu Akşam', action: () => setSelectedDate(setHours(setMinutes(new Date(), 0), 21)) },
        { label: 'Yarın', action: () => setSelectedDate(setHours(addDays(new Date(), 1), 9)) },
        { label: 'Haftaya', action: () => setSelectedDate(addDays(new Date(), 7)) },
    ];



    if (!visible) return null;

    let dateLabel = format(selectedDate, 'd MMM', { locale: tr });
    if (isToday(selectedDate)) dateLabel = 'Bugün';
    if (isTomorrow(selectedDate)) dateLabel = 'Yarın';

    return (
        <View style={[styles.overlay]} pointerEvents="box-none">
            {/* Backdrop to cancel */}
            <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />

            <GestureDetector gesture={pan}>
                <Animated.View style={[styles.bubble, animatedStyle]}>
                    {/* Header: Date + Time */}
                    <View style={styles.header}>
                        <Pressable
                            style={styles.timeDisplay}
                            onPress={() => {
                                setPickerMode('time');
                                setShowPicker(!showPicker);
                                Haptics.selectionAsync();
                            }}
                        >
                            <Text style={styles.timeText}>
                                {format(selectedDate, 'HH:mm')}
                            </Text>
                            <Text style={styles.dateLabel}>{dateLabel}</Text>
                        </Pressable>

                        <Pressable
                            style={styles.calendarButton}
                            onPress={() => {
                                setPickerMode('date');
                                setShowPicker(!showPicker);
                                Haptics.selectionAsync();
                            }}
                        >
                            <Ionicons name="calendar" size={20} color={Colors.primary} />
                        </Pressable>
                    </View>

                    {/* Picker (Collapsible) */}
                    {showPicker && (
                        <View style={styles.pickerContainer}>
                            <DateTimePicker
                                value={selectedDate}
                                mode={pickerMode}
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                onChange={(event, date) => {
                                    if (date) setSelectedDate(date);
                                    if (Platform.OS === 'android') setShowPicker(false);
                                }}
                                textColor={Colors.white}
                                themeVariant="dark"
                                locale="tr-TR"
                                style={{ height: 120 }}
                            />
                        </View>
                    )}

                    {/* Quick Suggestions */}
                    <View style={styles.chipsContainer}>
                        {quickSuggestions.map((item, idx) => (
                            <Pressable
                                key={idx}
                                style={styles.chip}
                                onPress={() => handleQuickAction(item.action)}
                            >
                                <Text style={styles.chipText}>{item.label}</Text>
                            </Pressable>
                        ))}
                    </View>



                    {/* Footer Actions */}
                    <View style={styles.footer}>
                        <Pressable
                            style={styles.deleteButton}
                            onPress={() => {
                                onDelete && onDelete();
                                onCancel();
                            }}
                        >
                            <Ionicons name="trash-outline" size={20} color={Colors.red} />
                        </Pressable>

                        <Pressable style={styles.saveButton} onPress={handleSave}>
                            <Text style={styles.saveButtonText}>Zamanla</Text>
                            <Ionicons name="arrow-forward" size={16} color={Colors.backgroundDark} />
                        </Pressable>
                    </View>

                    {/* Drag Handle Indicator */}
                    <View style={styles.dragHandle} />
                </Animated.View>
            </GestureDetector>
        </View>
    );
}

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 1000,
        elevation: 1000,
        justifyContent: 'flex-start',
        alignItems: 'center',
    },
    bubble: {
        width: BUBBLE_WIDTH,
        backgroundColor: '#1E1E1E',
        borderRadius: 24,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 16,
        elevation: 20,
        borderWidth: 1,
        borderColor: '#333',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    timeDisplay: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 8,
    },
    timeText: {
        fontFamily: Fonts.rounded,
        fontSize: 42,
        fontWeight: 'bold',
        color: Colors.white,
        fontVariant: ['tabular-nums'],
    },
    dateLabel: {
        fontSize: 16,
        color: Colors.primary,
        fontWeight: '600',
    },
    calendarButton: {
        padding: 8,
        backgroundColor: Colors.primary + '20',
        borderRadius: 12,
    },
    pickerContainer: {
        marginBottom: 16,
        backgroundColor: '#00000030',
        borderRadius: 12,
        overflow: 'hidden',
    },
    chipsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
    },
    chip: {
        backgroundColor: '#333',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 12,
    },
    chipText: {
        color: '#ccc',
        fontSize: 13,
        fontWeight: '500',
    },

    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    deleteButton: {
        padding: 12,
        backgroundColor: Colors.red + '20',
        borderRadius: 14,
    },
    saveButton: {
        flex: 1,
        marginLeft: 12,
        backgroundColor: Colors.primary,
        paddingVertical: 12,
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    saveButtonText: {
        color: Colors.backgroundDark,
        fontSize: 16,
        fontWeight: '700',
    },
    dragHandle: {
        width: 32,
        height: 4,
        backgroundColor: '#444',
        borderRadius: 2,
        alignSelf: 'center',
        marginTop: 12,
    },
});
