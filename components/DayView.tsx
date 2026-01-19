import { Colors } from '@/constants/Colors';
import { useTaskStore } from '@/store/taskStore';
import { Ionicons } from '@expo/vector-icons';
import { format, isToday, isTomorrow, isYesterday } from 'date-fns';
import { tr } from 'date-fns/locale';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, FlatList, Keyboard, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import TaskItem from './TaskItem';

interface DayViewProps {
    date: Date;
    onOpenReminder: (taskId: string) => void;
    onGoToToday?: () => void;
    onOpenCalendar?: () => void;
}

function DayView({ date, onOpenReminder, onGoToToday, onOpenCalendar }: DayViewProps) {
    const dateKey = format(date, 'yyyy-MM-dd');
    const tasks = useTaskStore((state) => state.tasks);
    const addTask = useTaskStore((state) => state.addTask);
    const toggleTask = useTaskStore((state) => state.toggleTask);
    const deleteTask = useTaskStore((state) => state.deleteTask);
    const updateTask = useTaskStore((state) => state.updateTask);

    const [newTaskText, setNewTaskText] = useState('');
    const [isInputFocused, setIsInputFocused] = useState(false);
    const [isAnyTaskEditing, setIsAnyTaskEditing] = useState(false);
    const flatListRef = useRef<any>(null);

    // Animated values for smooth bottom input show/hide
    const inputOpacity = useRef(new Animated.Value(1)).current;
    const inputTranslateY = useRef(new Animated.Value(0)).current;

    const dayTasks = useMemo(() =>
        tasks.filter((t) => t.date === dateKey).sort((a, b) => a.createdAt - b.createdAt),
        [tasks, dateKey]);

    let headerTitle = format(date, 'EEEE', { locale: tr });
    if (isToday(date)) headerTitle = 'Bugün';
    if (isYesterday(date)) headerTitle = 'Dün';
    if (isTomorrow(date)) headerTitle = 'Yarın';

    const dateDisplay = format(date, 'd MMM', { locale: tr });
    const showGoToToday = !isToday(date) && onGoToToday;
    const isPast = date < new Date(); // Since !isToday, this correctly separates past/future days relative to now

    const handleAddTask = () => {
        if (newTaskText.trim()) {
            addTask(newTaskText.trim(), dateKey);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        setNewTaskText('');
        // Dismiss keyboard if desired, or keep it open for multiple entries
        // But if empty, we definitely want to reset focus state if user pressed done
        // However, onSubmitEditing usually keeps focus. 
        // Let's rely on the fact that if it was empty, we cleared it.
    };

    const handleLongPress = (id: string) => {
        onOpenReminder(id);
    };

    const handleEditStart = (taskId: string) => {
        setIsAnyTaskEditing(true);
        const index = dayTasks.findIndex(t => t.id === taskId);
        if (index !== -1 && flatListRef.current) {
            // Small delay to ensure keyboard opens first
            setTimeout(() => {
                flatListRef.current?.scrollToIndex({
                    index,
                    animated: true,
                    viewPosition: 0.5, // Center the item
                });
            }, 100);
        }
    };

    const handleEditEnd = () => {
        setIsAnyTaskEditing(false);
    };

    // Animate bottom input visibility with keyboard
    useEffect(() => {
        const keyboardWillShowListener = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
            (e) => {
                // Only hide if editing a task (not when adding new task)
                if (isAnyTaskEditing) {
                    Animated.parallel([
                        Animated.timing(inputOpacity, {
                            toValue: 0,
                            duration: Platform.OS === 'ios' ? e.duration : 200,
                            useNativeDriver: true,
                        }),
                        Animated.timing(inputTranslateY, {
                            toValue: 20,
                            duration: Platform.OS === 'ios' ? e.duration : 200,
                            useNativeDriver: true,
                        }),
                    ]).start();
                }
            }
        );

        const keyboardWillHideListener = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
            (e) => {
                Animated.parallel([
                    Animated.timing(inputOpacity, {
                        toValue: 1,
                        duration: Platform.OS === 'ios' ? e.duration : 200,
                        useNativeDriver: true,
                    }),
                    Animated.timing(inputTranslateY, {
                        toValue: 0,
                        duration: Platform.OS === 'ios' ? e.duration : 200,
                        useNativeDriver: true,
                    }),
                ]).start();
            }
        );

        return () => {
            keyboardWillShowListener.remove();
            keyboardWillHideListener.remove();
        };
    }, [isAnyTaskEditing]);

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 30}
        >
            {/* Main Title with Date */}
            <View style={styles.titleSection}>
                {showGoToToday && (
                    <Pressable
                        style={[styles.goToTodayButton, { flexDirection: isPast ? 'row-reverse' : 'row' }]}
                        onPress={onGoToToday}
                    >
                        <Ionicons
                            name={isPast ? "arrow-forward" : "arrow-back"}
                            size={16}
                            color={Colors.primary}
                        />
                        <Text style={styles.goToTodayText}>Bugüne Git</Text>
                    </Pressable>
                )}
                <Text style={styles.title}>{headerTitle}</Text>
                <Text style={styles.dateText}>{dateDisplay}</Text>
                <Pressable style={styles.calendarButton} onPress={onOpenCalendar}>
                    <Ionicons name="calendar-outline" size={24} color={Colors.textLight} />
                </Pressable>
            </View>

            {/* Task List */}
            <FlatList
                ref={flatListRef}
                data={dayTasks}
                keyExtractor={(item) => item.id}
                initialNumToRender={10}
                maxToRenderPerBatch={10}
                windowSize={5}
                removeClippedSubviews={false}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="sparkles-outline" size={48} color={Colors.textMuted + '40'} />
                        <Text style={styles.emptyText}>Henüz bir plan yok</Text>
                    </View>
                }
                renderItem={({ item }) => (
                    <TaskItem
                        task={item}
                        onToggle={toggleTask}
                        onDelete={deleteTask}
                        onLongPress={handleLongPress}
                        onUpdate={updateTask}
                        onEditStart={handleEditStart}
                        onEditEnd={handleEditEnd}
                    />
                )}
                style={styles.list}
                contentContainerStyle={[styles.listContent, dayTasks.length === 0 && styles.listContentEmpty]}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                onScrollToIndexFailed={() => { }}
            />

            {/* Bottom Input - Always rendered, animated visibility */}
            {/* Bottom Input - Always rendered, animated visibility */}
            <Animated.View
                style={[
                    styles.bottomInputContainer,
                    {
                        opacity: inputOpacity,
                        transform: [{ translateY: inputTranslateY }],
                    }
                ]}
                pointerEvents={isAnyTaskEditing ? 'none' : 'auto'}
            >
                {!isInputFocused && newTaskText.length === 0 ? (
                    <Pressable
                        style={styles.inputPlaceholder}
                        onPress={() => setIsInputFocused(true)}
                    >
                        <Ionicons name="add" size={20} color={Colors.textMuted + '80'} />
                        <Text style={styles.inputPlaceholderText}>Unutmadan yaz</Text>
                    </Pressable>
                ) : (
                    <View style={styles.inputActive}>
                        <TextInput
                            style={styles.input}
                            placeholder="Unutmadan yaz"
                            placeholderTextColor={Colors.textMuted + '80'}
                            value={newTaskText}
                            onChangeText={setNewTaskText}
                            onSubmitEditing={handleAddTask}
                            onFocus={() => setIsInputFocused(true)}
                            onBlur={() => {
                                if (newTaskText.trim().length === 0) {
                                    setIsInputFocused(false);
                                    setNewTaskText('');
                                }
                            }}
                            returnKeyType="done"
                            autoFocus={isInputFocused}
                        />
                    </View>
                )}
            </Animated.View>


        </KeyboardAvoidingView>
    );
}

export default React.memo(DayView);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.backgroundDark,
    },
    dateText: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.textMuted,
        textAlign: 'center',
        marginTop: 4,
        marginBottom: 2,
    },
    titleSection: {
        position: 'relative',
        paddingHorizontal: 24,
        paddingTop: 16,
        marginBottom: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: '600',
        color: Colors.textLight,
        letterSpacing: -0.5,
        lineHeight: 38,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: Colors.textMuted,
        marginTop: 4,
    },
    list: {
        flex: 1,
        paddingHorizontal: 24,
    },
    listContent: {
        paddingBottom: 120,
    },
    bottomInputContainer: {
        paddingHorizontal: 24,
        paddingVertical: 24,
        width: '100%',
    },
    inputPlaceholder: {
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: Colors.white + '0B',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 40,
        borderWidth: 1,
        borderColor: Colors.white + '0D',
    },
    inputPlaceholderText: {
        fontSize: 16,
        fontWeight: '500',
        color: Colors.textMuted,
        letterSpacing: 0.5,
    },
    inputActive: {
        minHeight: 40,
    },
    input: {
        color: Colors.textLight,
        fontSize: 17,
        fontWeight: '400',
    },
    calendarButton: {
        position: 'absolute',
        right: 24,
        top: 23,
        zIndex: 10,
    },
    goToTodayButton: {
        position: 'absolute',
        left: 24,
        top: 23,
        zIndex: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        paddingVertical: 4,
    },
    goToTodayText: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.primary,
    },
    listContentEmpty: {
        flex: 1,
        justifyContent: 'center',
        paddingBottom: 0,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        opacity: 0.8,
        transform: [{ translateY: -40 }],
    },
    emptyText: {
        fontSize: 16,
        color: Colors.textMuted,
        marginTop: 12,
        fontWeight: '500',
    },
});
