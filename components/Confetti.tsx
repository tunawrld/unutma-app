import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';

const { width, height } = Dimensions.get('window');

interface ConfettiProps {
    count?: number;
    duration?: number;
    colors?: string[];
}

const Confetti: React.FC<ConfettiProps> = ({
    count = 50,
    duration = 3000,
    colors = ['#33c758', '#FFD60A', '#FF453A', '#00C7BE', '#FF2D55']
}) => {
    const pieces = Array.from({ length: count });

    return (
        <View style={styles.container} pointerEvents="none">
            {pieces.map((_, index) => (
                <ConfettiPiece
                    key={index}
                    duration={duration}
                    color={colors[Math.floor(Math.random() * colors.length)]}
                    delay={Math.random() * 300}
                />
            ))}
        </View>
    );
};

interface ConfettiPieceProps {
    duration: number;
    color: string;
    delay: number;
}

const ConfettiPiece: React.FC<ConfettiPieceProps> = ({ duration, color, delay }) => {
    const translateY = useRef(new Animated.Value(0)).current;
    const translateX = useRef(new Animated.Value(0)).current;
    const rotate = useRef(new Animated.Value(0)).current;
    const opacity = useRef(new Animated.Value(1)).current;

    const startX = Math.random() * width;
    const endX = startX + (Math.random() - 0.5) * 200;
    const rotations = Math.random() * 4 + 2;

    useEffect(() => {
        const animations = Animated.parallel([
            Animated.timing(translateY, {
                toValue: height,
                duration,
                delay,
                useNativeDriver: true,
            }),
            Animated.timing(translateX, {
                toValue: endX - startX,
                duration,
                delay,
                useNativeDriver: true,
            }),
            Animated.timing(rotate, {
                toValue: rotations,
                duration,
                delay,
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 0,
                duration: duration * 0.8,
                delay: delay + duration * 0.2,
                useNativeDriver: true,
            }),
        ]);

        animations.start();
    }, []);

    const spin = rotate.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <Animated.View
            style={[
                styles.confettiPiece,
                {
                    backgroundColor: color,
                    left: startX,
                    transform: [
                        { translateY },
                        { translateX },
                        { rotate: spin },
                    ],
                    opacity,
                },
            ]}
        />
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
    },
    confettiPiece: {
        position: 'absolute',
        width: 8,
        height: 8,
        borderRadius: 2,
    },
});

export default Confetti;
