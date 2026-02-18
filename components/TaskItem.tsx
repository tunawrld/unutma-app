import { useThemeColors } from '@/hooks/useThemeColors';
import { Task } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

interface TaskItemProps {
    task: Task;
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
    onLongPress: (id: string, y?: number) => void;
    onUpdate: (id: string, text: string) => void;
    onEditStart?: (id: string) => void;
    onEditEnd?: () => void;
    onDrag?: () => void;
    isDragging?: boolean;
}

const ITEM_HEIGHT = 56;

function TaskItem({ task, onToggle, onDelete, onLongPress, onUpdate, onEditStart, onEditEnd, onDrag, isDragging }: TaskItemProps) {
    const C = useThemeColors();
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(task.text);
    const [now, setNow] = useState(Date.now());

    const dragProgress = useSharedValue(0);

    useEffect(() => {
        dragProgress.value = withTiming(isDragging ? 1 : 0, {
            duration: isDragging ? 150 : 120,
            easing: isDragging
                ? Easing.out(Easing.cubic)
                : Easing.out(Easing.quad),
        });
    }, [isDragging]);

    const animatedStyle = useAnimatedStyle(() => ({
        shadowColor: '#000',
        shadowOffset: { width: 0, height: dragProgress.value * 8 },
        shadowOpacity: dragProgress.value * 0.28,
        shadowRadius: dragProgress.value * 12,
        elevation: dragProgress.value * 12,
        opacity: 1 - dragProgress.value * 0.1,
    }));

    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 10000);
        return () => clearInterval(interval);
    }, []);

    const handleToggle = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onToggle(task.id);
    };

    const handleLongPress = (event: any) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const { pageY } = event.nativeEvent;
        onLongPress(task.id, pageY);
    };

    const handleTextPress = () => {
        setIsEditing(true);
        setEditText(task.text);
        onEditStart?.(task.id);
    };

    const handleSaveEdit = () => {
        const trimmedText = editText.trim();
        if (trimmedText) {
            onUpdate(task.id, trimmedText);
        } else {
            onDelete(task.id);
        }
        setIsEditing(false);
        onEditEnd?.();
    };

    const reminderInfo = useMemo(() => {
        const hasReminder = !!task.reminderId && !!task.reminderDate;
        const showReminder = hasReminder && task.status !== 'completed';

        if (!showReminder || !task.reminderDate) {
            return { showReminder: false, timeLeft: '', color: C.primary, icon: 'alarm-outline' as const };
        }

        let timeLeft = '';
        let color = C.primary;
        let icon: keyof typeof Ionicons.glyphMap = 'alarm-outline';

        if (task.reminderDate <= now) {
            color = C.textMuted;
            timeLeft = 'Süre Doldu';
            icon = 'checkmark-circle-outline';
        } else {
            const diffMins = Math.ceil((task.reminderDate - now) / 60000);

            if (diffMins <= 60) color = C.red;
            else if (diffMins <= 360) color = C.yellow;
            else color = C.primary;

            if (diffMins < 60) timeLeft = `${diffMins}dk`;
            else if (diffMins < 24 * 60) timeLeft = `${Math.floor(diffMins / 60)}sa`;
            else timeLeft = `${Math.floor(diffMins / (24 * 60))}g`;
        }

        return { showReminder, timeLeft, color, icon };
    }, [task.reminderId, task.reminderDate, task.status, now, C]);

    const { showReminder, timeLeft, color: reminderColor, icon: iconName } = reminderInfo;

    return (
        <Animated.View style={[styles.taskContainer, isDragging && styles.taskContainerDragging, animatedStyle]}>
            <View style={styles.contentContainer}>
                {/* Checkbox */}
                <Pressable
                    onPress={handleToggle}
                    onLongPress={handleLongPress}
                    delayLongPress={500}
                    style={[
                        styles.checkbox,
                        { borderColor: C.textMuted + '50' },
                        task.status === 'completed' && { backgroundColor: C.primary + '33', borderColor: C.primary + '50' }
                    ]}
                >
                    {task.status === 'completed' && (
                        <Ionicons name="checkmark" size={18} color={C.primary} />
                    )}
                </Pressable>

                {/* Task Text */}
                {isEditing ? (
                    <TextInput
                        style={[
                            styles.taskInput,
                            {
                                color: C.textLight,
                                backgroundColor: C.inputBg,
                                borderColor: C.primary + '50',
                            }
                        ]}
                        value={editText}
                        onChangeText={setEditText}
                        onBlur={handleSaveEdit}
                        onSubmitEditing={handleSaveEdit}
                        autoFocus
                        returnKeyType="done"
                    />
                ) : (
                    <Pressable
                        style={styles.textContainer}
                        onPress={handleTextPress}
                        onLongPress={handleLongPress}
                        delayLongPress={500}
                    >
                        <Text style={[
                            styles.taskText,
                            { color: C.textLight },
                            task.status === 'completed' && { color: C.textMuted, textDecorationLine: 'line-through', textDecorationColor: C.primary + '66' }
                        ]}>
                            {task.text}
                        </Text>

                        <View style={styles.metaContainer}>
                            {showReminder && (
                                <View style={[styles.reminderContainer, { backgroundColor: reminderColor + '15' }]}>
                                    <Text style={[styles.reminderText, { color: reminderColor }]}>{timeLeft}</Text>
                                    <Ionicons name={iconName} size={14} color={reminderColor} />
                                </View>
                            )}
                        </View>
                    </Pressable>
                )}

                {/* Drag Handle */}
                {onDrag && (
                    <Pressable
                        onPressIn={onDrag}
                        style={styles.dragHandle}
                    >
                        <Ionicons name="menu" size={20} color={isDragging ? C.primary : C.textMuted + '60'} />
                    </Pressable>
                )}
            </View>
        </Animated.View>
    );
}

export default React.memo(TaskItem);

const styles = StyleSheet.create({
    taskContainer: {
        width: '100%',
        justifyContent: 'center',
        marginBottom: 8,
    },
    taskContainerDragging: {},
    dragHandle: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        marginLeft: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    contentContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
    },
    textContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    taskInput: {
        flex: 1,
        fontSize: 17,
        fontWeight: '400',
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 4,
        borderWidth: 1,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 1.5,
        marginRight: 16,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    taskText: {
        fontSize: 17,
        fontWeight: '400',
        flex: 1,
        lineHeight: 24,
    },
    reminderContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
    },
    reminderText: {
        fontSize: 11,
        fontWeight: '700',
    },
    metaContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginLeft: 8,
    },
});
