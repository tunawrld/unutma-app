import { MOTIVATION_QUOTES } from '@/constants/Quotes';
import { useThemeColors } from '@/hooks/useThemeColors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const STORAGE_KEY = 'daily_motivation_quote';

interface StoredQuoteData {
    date: string;
    quoteIndex: number;
    shownIndices: number[];
}

export default function DailyQuote() {
    const C = useThemeColors();
    const [quote, setQuote] = useState<string>("");
    const insets = useSafeAreaInsets();

    useEffect(() => {
        loadQuote();
    }, []);

    const loadQuote = async () => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const storedDataJson = await AsyncStorage.getItem(STORAGE_KEY);
            let storedData: StoredQuoteData | null = storedDataJson ? JSON.parse(storedDataJson) : null;

            if (storedData && storedData.date === today) {
                setQuote(MOTIVATION_QUOTES[storedData.quoteIndex]);
            } else {
                let shownIndices = storedData ? storedData.shownIndices : [];

                if (shownIndices.length > 30) {
                    shownIndices = shownIndices.slice(shownIndices.length - 30);
                }

                const allIndices = MOTIVATION_QUOTES.map((_, i) => i);
                const availableIndices = allIndices.filter(i => !shownIndices.includes(i));

                let newIndex;
                if (availableIndices.length > 0) {
                    const randomIndex = Math.floor(Math.random() * availableIndices.length);
                    newIndex = availableIndices[randomIndex];
                } else {
                    newIndex = Math.floor(Math.random() * MOTIVATION_QUOTES.length);
                    shownIndices = [];
                }

                const newData: StoredQuoteData = {
                    date: today,
                    quoteIndex: newIndex,
                    shownIndices: [...shownIndices, newIndex]
                };

                await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
                setQuote(MOTIVATION_QUOTES[newIndex]);
            }
        } catch (e) {
            console.error("Failed to load quote", e);
            setQuote(MOTIVATION_QUOTES[0]);
        }
    };

    if (!quote) return null;

    return (
        <View style={[styles.container, { bottom: insets.bottom + 15 }]}>
            <Text style={[styles.text, { color: C.textMuted }]}>{quote}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 0,
        right: 0,
        alignItems: 'center',
        paddingHorizontal: 20,
        opacity: 0.7,
    },
    text: {
        fontSize: 12,
        textAlign: 'center',
        fontStyle: 'italic',
        fontWeight: '300',
    }
});
