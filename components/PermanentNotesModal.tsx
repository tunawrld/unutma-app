import { useThemeColors } from '@/hooks/useThemeColors';
import { useNotesStore } from '@/store/notesStore';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import React, { forwardRef, useCallback, useEffect, useState } from 'react';
import { Keyboard, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

interface PermanentNotesModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const PermanentNotesModal = forwardRef<BottomSheet, PermanentNotesModalProps>(
    ({ isOpen, onClose }, ref) => {
        const C = useThemeColors();
        const storeNote = useNotesStore((state) => state.note);
        const setStoreNote = useNotesStore((state) => state.setNote);

        const [localNote, setLocalNote] = useState(storeNote);
        const [snapPoints, setSnapPoints] = useState(['90%']);

        useEffect(() => {
            if (isOpen) {
                setLocalNote(storeNote);
            } else {
                setStoreNote(localNote);
            }
        }, [isOpen]);

        useEffect(() => {
            const kbShow = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setSnapPoints(['96%']));
            const kbHide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setSnapPoints(['90%']));
            return () => { kbShow.remove(); kbHide.remove(); };
        }, []);

        const renderBackdrop = useCallback(
            (props: any) => (
                <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.4} />
            ),
            []
        );

        const handleTextChange = (text: string) => {
            setLocalNote(text);
            setStoreNote(text);
        };

        const handleSheetChange = (index: number) => {
            if (index === -1) {
                onClose();
            }
        };

        return (
            <BottomSheet
                ref={ref}
                index={-1}
                snapPoints={snapPoints}
                onChange={handleSheetChange}
                enablePanDownToClose={true}
                backdropComponent={renderBackdrop}
                backgroundStyle={{ backgroundColor: C.backgroundDark }}
                handleIndicatorStyle={{ backgroundColor: C.border + '20' }}
                keyboardBehavior="fillParent"
                keyboardBlurBehavior="restore"
                android_keyboardInputMode="adjustResize"
            >
                <View style={styles.container}>
                    {/* Dekoratif Glow Efektleri */}
                    <View style={[styles.glowLeft, { backgroundColor: C.primary }]} pointerEvents="none" />
                    <View style={[styles.glowRight, { backgroundColor: C.primary }]} pointerEvents="none" />

                    <View style={styles.header}>
                        <Pressable style={styles.closeButton} onPress={() => {
                            if (ref && 'current' in ref && ref.current) {
                                ref.current.close();
                            } else {
                                onClose();
                            }
                        }} hitSlop={12}>
                            <Ionicons name="close" size={28} color={C.textLight} />
                        </Pressable>
                        <Text style={[styles.title, { color: C.textLight }]}>Kalıcı Notlar</Text>
                        <View style={{ width: 44 }} />
                    </View>

                    <View style={[styles.divider, { backgroundColor: C.border + '15' }]} />

                    <BottomSheetScrollView
                        keyboardShouldPersistTaps="handled"
                        contentContainerStyle={{ flexGrow: 1, paddingBottom: 60 }}
                        showsVerticalScrollIndicator={true}
                    >
                        <View style={styles.notebookContainer}>
                            <View style={[styles.marginLine, { backgroundColor: C.red + '40' }]} pointerEvents="none" />
                            {Array.from({ length: Math.max(150, localNote.split('\n').length + 50) }).map((_, i) => (
                                <View
                                    key={i}
                                    style={[
                                        styles.horizontalLine,
                                        { backgroundColor: C.textMuted + '20', top: 32 + (i + 1) * 28 }
                                    ]}
                                    pointerEvents="none"
                                />
                            ))}
                            <BottomSheetTextInput
                                style={[styles.input, { color: C.textLight }]}
                                placeholder="Silinmeyecek satırlar, unutulmayacak fikirler..."
                                placeholderTextColor={C.textMuted + '60'}
                                multiline
                                value={localNote}
                                onChangeText={handleTextChange}
                                textAlignVertical="top"
                                cursorColor={C.primary}
                                selectionColor={C.primary + '30'}
                            />
                        </View>
                    </BottomSheetScrollView>
                </View>
            </BottomSheet>
        );
    }
);

PermanentNotesModal.displayName = 'PermanentNotesModal';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        zIndex: 10,
    },
    closeButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    title: {
        fontSize: 22,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    divider: {
        height: 1,
        width: '100%',
        zIndex: 10,
    },
    input: {
        flex: 1,
        paddingTop: 32,
        paddingBottom: 40,
        paddingLeft: 64,
        paddingRight: 24,
        fontSize: 18,
        lineHeight: 28,
        fontWeight: '400',
        minHeight: 400,
    },
    notebookContainer: {
        flex: 1,
        minHeight: '100%',
    },
    marginLine: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 48,
        width: 2,
        zIndex: 0,
    },
    horizontalLine: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: 1,
        zIndex: 0,
    },
    glowLeft: {
        position: 'absolute',
        width: 300,
        height: 300,
        borderRadius: 150,
        top: -100,
        left: -100,
        opacity: 0.08,
    },
    glowRight: {
        position: 'absolute',
        width: 250,
        height: 250,
        borderRadius: 125,
        bottom: 50,
        right: -80,
        opacity: 0.08,
    },
});

export default PermanentNotesModal;
