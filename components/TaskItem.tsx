import { Colors } from '@/constants/Colors';
import { Task } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

interface TaskItemProps {
    task: Task;
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
    onLongPress: (id: string) => void;
    onUpdate: (id: string, text: string) => void;
    onEditStart?: (id: string) => void;
    onEditEnd?: () => void;
}

const ITEM_HEIGHT = 56;

function TaskItem({ task, onToggle, onDelete, onLongPress, onUpdate, onEditStart, onEditEnd }: TaskItemProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(task.text);

    const handleToggle = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onToggle(task.id);
    };

    const handleLongPress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onLongPress(task.id);
    };

    const handleTextPress = () => {
        setIsEditing(true);
        setEditText(task.text);
        onEditStart?.(task.id);
    };

    const handleSaveEdit = () => {
        if (editText.trim()) {
            onUpdate(task.id, editText.trim());
        }
        setIsEditing(false);
        onEditEnd?.();
    };

    return (
        <View style={styles.taskContainer}>
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
                        {!!task.reminderId && (
                            <Ionicons name="alarm-outline" size={16} color={Colors.textMuted} style={{ marginLeft: 8 }} />
                        )}
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
        borderColor: Colors.textMuted + '50', // 30% opacity
        marginRight: 16,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    checkboxCompleted: {
        backgroundColor: Colors.primary + '33', // 20% opacity
        borderColor: Colors.primary + '50', // 30% opacity
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
        textDecorationColor: Colors.primary + '66', // 40% opacity
    },
});



