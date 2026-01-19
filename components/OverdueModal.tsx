import { Colors } from '@/constants/Colors';
import { Task } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

interface OverdueModalProps {
    visible: boolean;
    tasks: Task[];
    onClose: () => void;
    onMoveAllToToday: () => void;
    onToggleTask?: (id: string) => void;
}

export default function OverdueModal({ visible, tasks, onClose, onMoveAllToToday, onToggleTask }: OverdueModalProps) {
    if (tasks.length === 0) return null;

    const handleToggle = (id: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onToggleTask?.(id);
    };

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <Pressable style={styles.overlay} onPress={onClose}>
                <Pressable style={styles.content} onPress={e => e.stopPropagation()}>
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            <View style={styles.iconBadge}>
                                <Ionicons name="warning" size={20} color={Colors.red} />
                            </View>
                            <Text style={styles.title}>Geciken Görevler</Text>
                        </View>
                        <Pressable onPress={onClose} hitSlop={10}>
                            <Ionicons name="close" size={24} color={Colors.textMuted} />
                        </Pressable>
                    </View>

                    <Text style={styles.subtitle}>
                        Tamamlanmamış {tasks.length} göreviniz var. Bunları bugüne taşımak ister misiniz?
                    </Text>

                    <View style={styles.list}>
                        {tasks.map(task => (
                            <Pressable
                                key={task.id}
                                style={styles.item}
                                onPress={() => handleToggle(task.id)}
                            >
                                {/* Checkbox */}
                                <Pressable
                                    onPress={() => handleToggle(task.id)}
                                    style={[
                                        styles.checkbox,
                                        task.status === 'completed' && styles.checkboxCompleted
                                    ]}
                                >
                                    {task.status === 'completed' && (
                                        <Ionicons name="checkmark" size={16} color={Colors.primary} />
                                    )}
                                </Pressable>

                                <View style={styles.itemContent}>
                                    <Text
                                        style={[
                                            styles.itemText,
                                            task.status === 'completed' && styles.itemTextCompleted
                                        ]}
                                        numberOfLines={1}
                                    >
                                        {task.text}
                                    </Text>
                                    <Text style={styles.itemDate}>
                                        {format(new Date(task.date), 'd MMMM', { locale: tr })}
                                    </Text>
                                </View>
                            </Pressable>
                        ))}
                    </View>

                    <View style={styles.actions}>
                        <Pressable style={styles.moveButton} onPress={onMoveAllToToday}>
                            <Text style={styles.moveButtonText}>Hepsini Bugüne Taşı</Text>
                            <Ionicons name="arrow-forward" size={16} color={Colors.white} />
                        </Pressable>
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    content: {
        width: '100%',
        maxWidth: 340,
        backgroundColor: Colors.backgroundDark,
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: Colors.white + '10',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    iconBadge: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: Colors.red + '15',
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.white,
    },
    subtitle: {
        fontSize: 14,
        color: Colors.textMuted,
        marginBottom: 20,
        lineHeight: 20,
    },
    list: {
        gap: 10,
        marginBottom: 24,
        maxHeight: 200, // Limit height if many tasks
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: 10,
        backgroundColor: Colors.white + '05',
        borderRadius: 12,
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 1.5,
        borderColor: Colors.textMuted + '50',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    checkboxCompleted: {
        backgroundColor: Colors.primary + '33',
        borderColor: Colors.primary + '50',
    },
    itemContent: {
        flex: 1,
    },
    itemText: {
        fontSize: 14,
        color: Colors.textLight,
        fontWeight: '500',
    },
    itemTextCompleted: {
        color: Colors.textMuted,
        textDecorationLine: 'line-through',
        textDecorationColor: Colors.primary + '66',
    },
    itemDate: {
        fontSize: 12,
        color: Colors.textMuted,
        marginTop: 2,
    },
    actions: {
        flexDirection: 'row',
    },
    moveButton: {
        flex: 1,
        backgroundColor: Colors.primary,
        borderRadius: 16,
        paddingVertical: 14,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    moveButtonText: {
        color: Colors.backgroundDark, // Dark text on primary button usually looks better
        fontSize: 15,
        fontWeight: '600',
    },
});

