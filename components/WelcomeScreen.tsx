import { useThemeColors } from '@/hooks/useThemeColors';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

interface WelcomeScreenProps {
    onStart: () => void;
}

export default function WelcomeScreen({ onStart }: WelcomeScreenProps) {
    const C = useThemeColors();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000,
                delay: 200,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 1000,
                delay: 200,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const handlePress = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: -20,
                duration: 500,
                useNativeDriver: true,
            }),
        ]).start(() => onStart());
    };

    return (
        <Animated.View style={[styles.container, { opacity: fadeAnim, backgroundColor: C.backgroundDark }]}>
            <View style={styles.content}>
                <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>
                    <View style={[
                        styles.iconContainer,
                        {
                            backgroundColor: C.primary + '15',
                            borderColor: C.primary + '30',
                        }
                    ]}>
                        <Ionicons name="leaf" size={64} color={C.primary} />
                    </View>
                    <Text style={[styles.title, { color: C.textLight }]}>Hayatını Düzene{"\n"}Koymaya Hazır mısın?</Text>
                    <Text style={[styles.subtitle, { color: C.textMuted }]}>
                        Küçük adımlarla büyük hedeflere ulaş. Her gün yeni bir başlangıçtır.
                    </Text>
                </Animated.View>

                <Animated.View style={[styles.buttonContainer, { transform: [{ translateY: slideAnim }] }]}>
                    <Pressable
                        style={[
                            styles.button,
                            {
                                backgroundColor: C.primary,
                                shadowColor: C.primary,
                            }
                        ]}
                        onPress={handlePress}
                    >
                        <Text style={[styles.buttonText, { color: C.backgroundDark }]}>Evet, Başlayalım</Text>
                        <Ionicons name="arrow-forward" size={24} color={C.backgroundDark} />
                    </Pressable>
                </Animated.View>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 9999,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        width: '100%',
        paddingHorizontal: 32,
        alignItems: 'center',
        gap: 40,
    },
    iconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
        alignSelf: 'center',
        borderWidth: 1,
    },
    title: {
        fontSize: 34,
        fontWeight: '700',
        textAlign: 'center',
        lineHeight: 42,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 17,
        textAlign: 'center',
        lineHeight: 26,
        marginTop: 16,
    },
    buttonContainer: {
        width: '100%',
        marginTop: 48,
    },
    button: {
        paddingVertical: 20,
        borderRadius: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 12,
    },
    buttonText: {
        fontSize: 18,
        fontWeight: '700',
    },
});
