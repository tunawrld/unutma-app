import { useThemeColors } from '@/hooks/useThemeColors';
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
    const C = useThemeColors();

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
                <Pressable
                    style={[
                        styles.content,
                        { backgroundColor: C.sheetDark, borderColor: C.border + '10' }
                    ]}
                    onPress={e => e.stopPropagation()}
                >
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            <View style={[styles.iconBadge, { backgroundColor: C.red + '15' }]}>
                                <Ionicons name="warning" size={20} color={C.red} />
                            </View>
                            <Text style={[styles.title, { color: C.textLight }]}>Geciken Görevler</Text>
                        </View>
                        <Pressable onPress={onClose} hitSlop={10}>
                            <Ionicons name="close" size={24} color={C.textMuted} />
                        </Pressable>
                    </View>

                    <Text style={[styles.subtitle, { color: C.textMuted }]}>
                        Tamamlanmamış {tasks.length} göreviniz var. Bunları bugüne taşımak ister misiniz?
                    </Text>

                    <View style={styles.list}>
                        {tasks.map(task => (
                            <Pressable
                                key={task.id}
                                style={[styles.item, { backgroundColor: C.border + '05' }]}
                                onPress={() => handleToggle(task.id)}
                            >
                                <Pressable
                                    onPress={() => handleToggle(task.id)}
                                    style={[
                                        styles.checkbox,
                                        { borderColor: C.textMuted + '50' },
                                        task.status === 'completed' && {
                                            backgroundColor: C.primary + '33',
                                            borderColor: C.primary + '50',
                                        }
                                    ]}
                                >
                                    {task.status === 'completed' && (
                                        <Ionicons name="checkmark" size={16} color={C.primary} />
                                    )}
                                </Pressable>

                                <View style={styles.itemContent}>
                                    <Text
                                        style={[
                                            styles.itemText,
                                            { color: C.textLight },
                                            task.status === 'completed' && {
                                                color: C.textMuted,
                                                textDecorationLine: 'line-through',
                                                textDecorationColor: C.primary + '66',
                                            }
                                        ]}
                                        numberOfLines={1}
                                    >
                                        {task.text}
                                    </Text>
                                    <Text style={[styles.itemDate, { color: C.textMuted }]}>
                                        {format(new Date(task.date), 'd MMMM', { locale: tr })}
                                    </Text>
                                </View>
                            </Pressable>
                        ))}
                    </View>

                    <View style={styles.actions}>
                        <Pressable
                            style={[styles.moveButton, { backgroundColor: C.primary }]}
                            onPress={onMoveAllToToday}
                        >
                            <Text style={[styles.moveButtonText, { color: C.backgroundDark }]}>Hepsini Bugüne Taşı</Text>
                            <Ionicons name="arrow-forward" size={16} color={C.backgroundDark} />
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
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
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
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
    },
    subtitle: {
        fontSize: 14,
        marginBottom: 20,
        lineHeight: 20,
    },
    list: {
        gap: 10,
        marginBottom: 24,
        maxHeight: 200,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: 10,
        borderRadius: 12,
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 1.5,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    itemContent: {
        flex: 1,
    },
    itemText: {
        fontSize: 14,
        fontWeight: '500',
    },
    itemDate: {
        fontSize: 12,
        marginTop: 2,
    },
    actions: {
        flexDirection: 'row',
    },
    moveButton: {
        flex: 1,
        borderRadius: 16,
        paddingVertical: 14,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    moveButtonText: {
        fontSize: 15,
        fontWeight: '600',
    },
});
