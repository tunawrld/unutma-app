import { Colors } from '@/constants/Colors';
import { Task } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

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
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(task.text);
    const [now, setNow] = useState(Date.now());

    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 10000); // Check every 10s for updates
        return () => clearInterval(interval);
    }, []);

    const handleToggle = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onToggle(task.id);
    };

    const handleLongPress = (event: any) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        // Get the absolute Y position of the touch
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
            // If text is cleared, delete the task
            onDelete(task.id);
        }
        setIsEditing(false);
        onEditEnd?.();
    };

    // Memoize reminder calculations to avoid recalculating on every render
    const reminderInfo = useMemo(() => {
        const hasReminder = !!task.reminderId && !!task.reminderDate;
        const showReminder = hasReminder && task.status !== 'completed';

        if (!showReminder || !task.reminderDate) {
            return { showReminder: false, timeLeft: '', color: Colors.primary, icon: 'alarm-outline' as const };
        }

        let timeLeft = '';
        let color = Colors.primary;
        let icon: keyof typeof Ionicons.glyphMap = 'alarm-outline';

        if (task.reminderDate <= now) {
            color = Colors.textMuted;
            timeLeft = 'Süre Doldu';
            icon = 'checkmark-circle-outline';
        } else {
            const diffMins = Math.ceil((task.reminderDate - now) / 60000);

            if (diffMins <= 60) color = Colors.red;
            else if (diffMins <= 360) color = Colors.yellow;
            else color = Colors.primary;

            if (diffMins < 60) timeLeft = `${diffMins}dk`;
            else if (diffMins < 24 * 60) timeLeft = `${Math.floor(diffMins / 60)}sa`;
            else timeLeft = `${Math.floor(diffMins / (24 * 60))}g`;
        }

        return { showReminder, timeLeft, color, icon };
    }, [task.reminderId, task.reminderDate, task.status, now]);

    const { showReminder, timeLeft, color: reminderColor, icon: iconName } = reminderInfo;

    return (
        <View style={[styles.taskContainer, isDragging && styles.taskContainerDragging]}>
            <View style={styles.contentContainer}>
                {/* Checkbox - Only this toggles task */}
                <Pressable
                    onPress={handleToggle}
                    onLongPress={handleLongPress}
                    delayLongPress={500}
                    style={[
                        styles.checkbox,
                        task.status === 'completed' && styles.checkboxCompleted
                    ]}
                >
                    {task.status === 'completed' && (
                        <Ionicons name="checkmark" size={18} color={Colors.primary} />
                    )}
                </Pressable>

                {/* Task Text - Clicking opens edit mode */}
                {isEditing ? (
                    <TextInput
                        style={styles.taskInput}
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
                            task.status === 'completed' && styles.taskTextCompleted
                        ]}>
                            {task.text}
                        </Text>

                        {/* Reminder Indicator */}
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

                {/* Drag Handle - Right side icon */}
                {onDrag && (
                    <Pressable
                        onPressIn={onDrag}
                        style={styles.dragHandle}
                    >
                        <Ionicons name="menu" size={20} color={isDragging ? Colors.primary : Colors.textMuted + '60'} />
                    </Pressable>
                )}
            </View>
        </View>
    );
}

export default React.memo(TaskItem);

const styles = StyleSheet.create({
    taskContainer: {
        width: '100%',
        justifyContent: 'center',
        marginBottom: 8,
    },
    taskContainerDragging: {
        opacity: 0.9,
        backgroundColor: Colors.backgroundDark,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.primary + '60',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 5,
        },
        shadowOpacity: 0.34,
        shadowRadius: 6.27,
        elevation: 10,
    },
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
        color: Colors.textLight,
        fontSize: 17,
        fontWeight: '400',
        paddingVertical: 4,
        paddingHorizontal: 8,
        backgroundColor: Colors.backgroundDark,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: Colors.primary + '50',
    },

    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: Colors.textMuted + '50',
        marginRight: 16,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    checkboxCompleted: {
        backgroundColor: Colors.primary + '33',
        borderColor: Colors.primary + '50',
    },
    taskText: {
        color: Colors.textLight,
        fontSize: 17,
        fontWeight: '400',
        flex: 1,
        lineHeight: 24,
    },
    taskTextCompleted: {
        color: Colors.textMuted,
        textDecorationLine: 'line-through',
        textDecorationColor: Colors.primary + '66',
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
