import { TaskCategory } from '@/types';
import { Colors } from './Colors';

export const CategoryConfig: {
    [key in TaskCategory]: {
        label: string;
        color: string;
        icon: string;
    };
} = {
    work: {
        label: 'İş',
        color: '#0A84FF',
        icon: 'briefcase-outline',
    },
    personal: {
        label: 'Kişisel',
        color: '#34C759',
        icon: 'person-outline',
    },
    shopping: {
        label: 'Alışveriş',
        color: '#FFD60A',
        icon: 'cart-outline',
    },
    urgent: {
        label: 'Acil',
        color: '#FF453A',
        icon: 'flash-outline',
    },
    none: {
        label: 'Kategori Yok',
        color: Colors.textMuted,
        icon: 'ellipse-outline',
    },
};
