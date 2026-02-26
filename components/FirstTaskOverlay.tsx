import Confetti from '@/components/Confetti';
import { Colors } from '@/constants/Colors';
import { BlurView } from 'expo-blur';
import React, { useEffect } from 'react';
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

interface FirstTaskOverlayProps {
    visible: boolean;
    onAnimationFinish?: () => void;
}

export default function FirstTaskOverlay({ visible, onAnimationFinish }: FirstTaskOverlayProps) {
    const scale = useSharedValue(0.5);
    const opacity = useSharedValue(0);
    const rotate = useSharedValue(0);

    useEffect(() => {
        if (visible) {
            scale.value = 0.5;
            opacity.value = 0;
            rotate.value = Math.random() * 0.08 - 0.04;

            scale.value = withSpring(1.0, { damping: 10, stiffness: 140 });
            opacity.value = withTiming(1, { duration: 250 });

            const timeout = setTimeout(() => {
                opacity.value = withTiming(0, { duration: 300 }, (finished) => {
                    if (finished && onAnimationFinish) {
                        runOnJS(onAnimationFinish)();
                    }
                });
            }, 1800);

            return () => clearTimeout(timeout);
        }
    }, [visible, scale, opacity, rotate, onAnimationFinish]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: scale.value },
            { rotate: `${rotate.value}rad` }
        ],
        opacity: opacity.value,
    }));

    if (!visible) return null;

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <Animated.View
                entering={FadeIn.duration(200)}
                exiting={FadeOut.duration(300)}
                style={StyleSheet.absoluteFill}
            >
                <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
            </Animated.View>

            <View style={styles.centerContainer}>
                <Animated.View style={[styles.textContainer, animatedStyle]}>
                    <Text style={[styles.mainText, { color: '#6ee7b7', textShadowColor: '#6ee7b7' }]}>
                        Harika!
                    </Text>
                    <Text style={[styles.subText, { color: Colors.white }]}>
                        İlk adım atıldı
                    </Text>
                </Animated.View>
            </View>

            <View style={StyleSheet.absoluteFill} pointerEvents="none">
                <Confetti
                    count={45}
                    duration={2800}
                    colors={['#6ee7b7', '#34d399', '#ffffff', '#10b981', '#a7f3d0']}
                />
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
    mainText: {
        fontSize: 72,
        fontWeight: '800',
        // @ts-ignore
        fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-rounded',
        // @ts-ignore
        fontDesign: 'rounded',
        letterSpacing: -2,
        marginBottom: -5,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 20, // Glow effect
    },
    subText: {
        fontSize: 26,
        fontWeight: '700',
        letterSpacing: 1,
        // @ts-ignore
        fontDesign: 'rounded',
        opacity: 0.95,
        textAlign: 'center',
    },
});
