import { CategoryConfig } from '@/constants/CategoryConfig';
import { Colors } from '@/constants/Colors';
import { TaskCategory } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

interface CategorySelectorProps {
    selectedCategory: TaskCategory;
    onSelectCategory: (category: TaskCategory) => void;
    compact?: boolean;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({
    selectedCategory,
    onSelectCategory,
    compact = false
}) => {
    const categories: TaskCategory[] = ['work', 'personal', 'shopping', 'urgent', 'none'];

    const handleCategoryPress = (category: TaskCategory) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onSelectCategory(category);
    };

    if (compact) {
        return (
            <View style={styles.compactContainer}>
                {categories.map((category) => {
                    const config = CategoryConfig[category];
                    const isSelected = selectedCategory === category;

                    return (
                        <Pressable
                            key={category}
                            style={[
                                styles.compactChip,
                                isSelected && {
                                    backgroundColor: config.color + '20',
                                    borderColor: config.color
                                },
                            ]}
                            onPress={() => handleCategoryPress(category)}
                        >
                            <Ionicons
                                name={config.icon as any}
                                size={16}
                                color={isSelected ? config.color : Colors.textMuted}
                            />
                        </Pressable>
                    );
                })}
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Kategori</Text>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {categories.map((category) => {
                    const config = CategoryConfig[category];
                    const isSelected = selectedCategory === category;

                    return (
                        <Pressable
                            key={category}
                            style={[
                                styles.chip,
                                isSelected && {
                                    backgroundColor: config.color + '20',
                                    borderColor: config.color
                                },
                            ]}
                            onPress={() => handleCategoryPress(category)}
                        >
                            <Ionicons
                                name={config.icon as any}
                                size={18}
                                color={isSelected ? config.color : Colors.textMuted}
                            />
                            <Text style={[
                                styles.chipText,
                                isSelected && { color: config.color }
                            ]}>
                                {config.label}
                            </Text>
                        </Pressable>
                    );
                })}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    title: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.textMuted,
        marginBottom: 12,
        paddingHorizontal: 24,
    },
    scrollContent: {
        paddingHorizontal: 24,
        gap: 8,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 16,
        backgroundColor: Colors.white + '0A',
        borderWidth: 1.5,
        borderColor: Colors.white + '08',
    },
    chipText: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.textMuted,
    },
    compactContainer: {
        flexDirection: 'row',
        gap: 6,
    },
    compactChip: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.white + '0A',
        borderWidth: 1.5,
        borderColor: Colors.white + '08',
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default CategorySelector;
