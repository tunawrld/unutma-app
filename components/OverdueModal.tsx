import { Colors } from '@/constants/Colors';
import { Task } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

interface OverdueModalProps {
    visible: boolean;
    tasks: Task[];
    onClose: () => void;
    onMoveAllToToday: () => void;
}

export default function OverdueModal({ visible, tasks, onClose, onMoveAllToToday }: OverdueModalProps) {
    if (tasks.length === 0) return null;

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
                            <View key={task.id} style={styles.item}>
                                <View style={styles.itemDot} />
                                <View style={styles.itemContent}>
                                    <Text style={styles.itemText} numberOfLines={1}>{task.text}</Text>
                                    <Text style={styles.itemDate}>
                                        {format(new Date(task.date), 'd MMMM', { locale: tr })}
                                    </Text>
                                </View>
                            </View>
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
    itemDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: Colors.red,
    },
    itemContent: {
        flex: 1,
    },
    itemText: {
        fontSize: 14,
        color: Colors.textLight,
        fontWeight: '500',
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
