import { Colors } from '@/constants/Colors';
import { MoodType } from '@/types';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface MoodSelectorProps {
    selectedMood: MoodType | null;
    onSelectMood: (mood: MoodType) => void;
}

const moodEmojis: { [key in MoodType]: string } = {
    'very-sad': '😞',
    'sad': '😐',
    'neutral': '😊',
    'happy': '😄',
    'very-happy': '🤩',
};

const MoodSelector: React.FC<MoodSelectorProps> = ({ selectedMood, onSelectMood }) => {
    const handleMoodPress = (mood: MoodType) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onSelectMood(mood);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Bugün nasıl hissediyorsun?</Text>
            <View style={styles.moodRow}>
                {(Object.keys(moodEmojis) as MoodType[]).map((mood) => (
                    <Pressable
                        key={mood}
                        style={[
                            styles.moodButton,
                            selectedMood === mood && styles.moodButtonSelected,
                        ]}
                        onPress={() => handleMoodPress(mood)}
                    >
                        <Text style={styles.moodEmoji}>{moodEmojis[mood]}</Text>
                    </Pressable>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 24,
        paddingVertical: 16,
        backgroundColor: Colors.sheetDark + '80',
        borderRadius: 20,
        marginHorizontal: 24,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Colors.white + '08',
    },
    title: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.textMuted,
        marginBottom: 12,
        textAlign: 'center',
    },
    moodRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 8,
    },
    moodButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: Colors.white + '0A',
        borderWidth: 2,
        borderColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
    },
    moodButtonSelected: {
        borderColor: Colors.primary,
        backgroundColor: Colors.primary + '20',
        transform: [{ scale: 1.1 }],
    },
    moodEmoji: {
        fontSize: 28,
    },
});

export default MoodSelector;
