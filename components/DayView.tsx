import { Colors } from '@/constants/Colors';
// Smart Parsing Logic V3 Implemented
import { useTaskStore } from '@/store/taskStore';
import { schedulePushNotification } from '@/utils/notifications';
import { Ionicons } from '@expo/vector-icons';
import { addDays, addMonths, addWeeks, addYears, differenceInCalendarDays, format, isToday, isTomorrow, isYesterday, setHours, setMinutes } from 'date-fns';
import { tr } from 'date-fns/locale';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, FlatList, Keyboard, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
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
    const setReminderId = useTaskStore((state) => state.setReminderId);

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
    const isPast = date < new Date();

    const handleAddTask = async () => {
        if (!newTaskText.trim()) {
            setNewTaskText('');
            return;
        }

        const originalText = newTaskText.trim();
        const lowerText = originalText.toLowerCase();

        // Varsayılan olarak date prop'u (seçili gün)
        let targetDate = date;
        let reminderDate: Date | null = null;
        let finalTaskText = originalText;

        const now = new Date();

        // Yardımcı: Eğer kelime "için" ile kullanıldıysa (örn: "yarın için"), tarih değiştirme.
        const isForContext = (text: string, keyword: string) => {
            return text.includes(`${keyword} için`) || text.includes(`için ${keyword}`);
        };

        // 1. TARİH TESPİTİ (Gelişmiş versiyon)
        let dayFound = false;
        let weekOffset = 0;

        // "Haftaya" veya "Gelecek hafta" kontrolü (Offset belirle)
        if ((lowerText.includes('haftaya') || lowerText.includes('gelecek hafta')) && !isForContext(lowerText, 'haftaya')) {
            weekOffset = 1;
        }

        const daysMap: { [key: string]: number } = {
            'pazartesi': 1, 'salı': 2, 'çarşamba': 3, 'perşembe': 4, 'cuma': 5, 'cumartesi': 6, 'pazar': 0
        };

        // Gün isimlerini kontrol et ve Offset ile birleştir
        for (const [dayName, dayIndex] of Object.entries(daysMap)) {
            if (lowerText.includes(dayName) && !isForContext(lowerText, dayName)) {
                const currentDay = now.getDay();
                let daysToAdd = (dayIndex - currentDay + 7) % 7;

                // Eğer gün bugünse ve weekOffset yoksa, "gelecek [gün]" kastedilmiştir (7 gün sonra)
                // Ama weekOffset varsa (Haftaya Pazartesi), o zaman 0 + 7 = 7 gün sonra olur ki bu doğrudur.
                if (daysToAdd === 0 && weekOffset === 0) {
                    daysToAdd = 7;
                }

                // Offset'i ekle (Haftaya Salı = En yakın Salı + 7 gün)
                targetDate = addDays(now, daysToAdd + (weekOffset * 7));
                dayFound = true;
                break;
            }
        }

        // Gün ismi bulunamadıysa standart kelimeleri kontrol et
        if (!dayFound) {
            if (weekOffset > 0) {
                // Sadece "Haftaya" denmişse, bugünden 1 hafta sonra
                targetDate = addWeeks(now, weekOffset);
            } else if (lowerText.includes('yarın') && !isForContext(lowerText, 'yarın')) {
                targetDate = addDays(now, 1);
            } else if ((lowerText.includes('ertesi gün') || lowerText.includes('yarından sonra')) && !isForContext(lowerText, 'ertesi gün')) {
                targetDate = addDays(now, 2);
            } else if ((lowerText.includes('gelecek ay') || lowerText.includes('öbür ay')) && !isForContext(lowerText, 'gelecek ay')) {
                targetDate = addMonths(now, 1);
            } else if ((lowerText.includes('seneye') || lowerText.includes('gelecek yıl')) && !isForContext(lowerText, 'seneye')) {
                targetDate = addYears(now, 1);
            }
        }

        // Tarih değiştiyse varsayılan saat ayarla (Sabah 9)
        if (differenceInCalendarDays(targetDate, date) !== 0) {
            reminderDate = setHours(setMinutes(targetDate, 0), 9);
        }

        // 2. VAKİT TESPİTİ (Sabah, Öğle, Akşam)
        if (lowerText.includes('akşam')) {
            const baseDate = targetDate;
            reminderDate = setHours(setMinutes(baseDate, 0), 21); // 21:00
        } else if (lowerText.includes('sabah')) {
            const baseDate = targetDate;
            reminderDate = setHours(setMinutes(baseDate, 0), 9); // 09:00
        } else if (lowerText.includes('öğle')) {
            const baseDate = targetDate;
            reminderDate = setHours(setMinutes(baseDate, 0), 12); // 12:00
        }

        // 3. SAAT TESPİTİ (Örn: 14:15, 14.30, 9'da, 8de)
        const specificTimeMatch = lowerText.match(/\b(\d{1,2})[:.](\d{2})\b/);
        const suffixTimeMatch = lowerText.match(/\b(\d{1,2})('?)(da|de|te|ta|:00)\b/);

        if (specificTimeMatch) {
            const hour = parseInt(specificTimeMatch[1]);
            const minute = parseInt(specificTimeMatch[2]);

            if (hour >= 0 && hour < 24 && minute >= 0 && minute < 60) {
                reminderDate = setHours(setMinutes(targetDate, minute), hour);
            }
        } else if (suffixTimeMatch) {
            let hour = parseInt(suffixTimeMatch[1]);

            // "Akşam 9" dediğinde 21 olması için
            if (lowerText.includes('akşam') && hour < 12) {
                hour += 12;
            }
            // "Öğleden sonra 2" -> 14
            if ((lowerText.includes('öğleden sonra') || lowerText.includes('öğlen')) && hour < 12) {
                hour += 12;
            }

            reminderDate = setHours(setMinutes(targetDate, 0), hour);
        }

        // Akıllı düzeltme ve doğrulama (Geçmiş Zaman Kontrolü)
        if (reminderDate) {
            if (reminderDate < now) {
                // 1. İhtimal: Saat PM olabilir mi? (Örn: "8de" dendi ama sabah 8 geçti, akşam 8 mi?)
                const pmDate = new Date(reminderDate);
                pmDate.setHours(pmDate.getHours() + 12);

                if (reminderDate.getHours() < 12 && pmDate > now) {
                    reminderDate = pmDate; // PM yaptık
                } else {
                    // 2. İhtimal: Tarih geçmişte kaldı, yarına/ertesi güne erteleyelim
                    // Sadece targetDate spesifik olarak değişmediyse
                    if (differenceInCalendarDays(targetDate, date) === 0) {
                        targetDate = addDays(targetDate, 1);
                        reminderDate = addDays(reminderDate, 1);
                    }
                }
            }
        }

        // Target Date Key'i güncelle
        const targetDateKey = format(targetDate, 'yyyy-MM-dd');

        // Store'a ekle
        const taskId = addTask(finalTaskText, targetDateKey);

        // Bildirim kur
        if (reminderDate && taskId) {
            if (reminderDate > new Date()) {
                const notifId = await schedulePushNotification(
                    `Hatırlatıcı: ${finalTaskText}`,
                    'Unutma!',
                    reminderDate
                );
                if (notifId) {
                    setReminderId(taskId, notifId, reminderDate.getTime());
                }
            }
        }

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setNewTaskText('');

        // Kullanıcı Bildirimi
        if (differenceInCalendarDays(targetDate, date) !== 0) {
            const dateStr = format(targetDate, 'd MMMM EEEE', { locale: tr });
            Alert.alert(
                "Planlandı 📅",
                `"${finalTaskText}" görevi ${dateStr} tarihine eklendi.`,
                [{ text: "Tamam" }]
            );
        }
    };

    const handleLongPress = (id: string) => {
        onOpenReminder(id);
    };

    const handleEditStart = (taskId: string) => {
        setIsAnyTaskEditing(true);
        const index = dayTasks.findIndex(t => t.id === taskId);
        if (index !== -1 && flatListRef.current) {
            setTimeout(() => {
                flatListRef.current?.scrollToIndex({
                    index,
                    animated: true,
                    viewPosition: 0.5,
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
                        <Ionicons name="add-circle" size={22} color={Colors.primary} />
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
        backgroundColor: Colors.primary + '18',
        paddingVertical: 18,
        paddingHorizontal: 32,
        borderRadius: 40,
        borderWidth: 2,
        borderColor: Colors.primary + '60',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    inputPlaceholderText: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.primary,
        letterSpacing: 0.5,
    },
    inputActive: {
        minHeight: 40,
        backgroundColor: Colors.primary + '10',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: Colors.primary + '40',
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
