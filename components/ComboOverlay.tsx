import { Colors } from '@/constants/Colors';
import { BlurView } from 'expo-blur';
import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import Animated, {
    FadeIn,
    FadeOut,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming
} from 'react-native-reanimated';

interface ComboOverlayProps {
    count: number;
    visible: boolean;
    onAnimationFinish?: () => void;
}

const COMBO_DATA = [
    { text: '', color: Colors.primary }, // 0
    { text: '', color: Colors.primary }, // 1
    { text: 'Güzel!', color: '#6ee7b7' }, // 2
    { text: 'Süper!', color: '#93c5fd' }, // 3
    { text: 'Harika!', color: '#c4b5fd' }, // 4
    { text: 'Müthiş!', color: '#fcd34d' }, // 5
    { text: 'Efsane!', color: '#f87171' }, // 6
];

export default function ComboOverlay({ count, visible, onAnimationFinish }: ComboOverlayProps) {
    const [currentCombo, setCurrentCombo] = useState(COMBO_DATA[2]);
    const scale = useSharedValue(0.5);
    const opacity = useSharedValue(0);
    const rotate = useSharedValue(0);

    useEffect(() => {
        if (visible && count > 1) {
            // Data Setup
            const dataIndex = Math.min(count, COMBO_DATA.length - 1);
            setCurrentCombo(COMBO_DATA[dataIndex]);

            // Animation Reset
            scale.value = 0.5;
            opacity.value = 0;
            rotate.value = Math.random() * 0.1 - 0.05; // Gentle random tilt

            // Animate In (Bouncy & Cute)
            scale.value = withSpring(1.0, { damping: 8, stiffness: 150 });
            opacity.value = withTiming(1, { duration: 150 });

            // Auto Hide
            const timeout = setTimeout(() => {
                opacity.value = withTiming(0, { duration: 300 }, (finished) => {
                    if (finished && onAnimationFinish) {
                        runOnJS(onAnimationFinish)();
                    }
                });
            }, 800);

            return () => clearTimeout(timeout);
        }
    }, [count, visible]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: scale.value },
            { rotate: `${rotate.value}rad` }
        ],
        opacity: opacity.value,
    }));

    if (!visible || count < 2) return null;

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {/* Full Screen Blur Background */}
            <Animated.View
                entering={FadeIn.duration(200)}
                exiting={FadeOut.duration(200)}
                style={StyleSheet.absoluteFill}
            >
                <BlurView intensity={15} tint="dark" style={StyleSheet.absoluteFill} />
            </Animated.View>

            {/* Centered Combo Text */}
            <View style={styles.centerContainer}>
                <Animated.View style={[styles.textContainer, animatedStyle]}>
                    <Text style={[styles.comboCount, { color: currentCombo.color, textShadowColor: currentCombo.color }]}>
                        {count}x
                    </Text>
                    <Text style={[styles.comboText, { color: Colors.white }]}>
                        {currentCombo.text}
                    </Text>
                </Animated.View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    centerContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
    },
    textContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    comboCount: {
        fontSize: 90,
        fontWeight: '800',
        // @ts-ignore: 'rounded' is a valid value for system font on iOS but typescript definition might lag strictly
        fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-rounded',
        // @ts-ignore
        fontDesign: 'rounded', // This makes it look "cute" on iOS 13+
        letterSpacing: -2,
        marginBottom: -10,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 15, // Soft glow
    },
    comboText: {
        fontSize: 32,
        fontWeight: '700',
        letterSpacing: 1,
        // @ts-ignore
        fontDesign: 'rounded',
        opacity: 0.95,
        textTransform: 'capitalize', // "Harika" instead of "HARİKA"
    },
});
