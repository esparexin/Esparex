export interface CategoryFilter {
    id: string;
    name: string;
    type: 'checkbox' | 'select' | 'range';
    options?: { value: string; label: string }[];
    min?: number;
    max?: number;
    unit?: string;
}

export const categorySpecificFilters: Record<string, CategoryFilter[]> = {
    'mobiles': [
        {
            id: 'ram',
            name: 'RAM',
            type: 'checkbox',
            options: [
                { value: '2gb', label: '2 GB' },
                { value: '3gb', label: '3 GB' },
                { value: '4gb', label: '4 GB' },
                { value: '6gb', label: '6 GB' },
                { value: '8gb', label: '8 GB' },
                { value: '12gb', label: '12 GB' },
                { value: '16gb', label: '16 GB' },
            ]
        },
        {
            id: 'storage',
            name: 'Storage',
            type: 'checkbox',
            options: [
                { value: '32gb', label: '32 GB' },
                { value: '64gb', label: '64 GB' },
                { value: '128gb', label: '128 GB' },
                { value: '256gb', label: '256 GB' },
                { value: '512gb', label: '512 GB' },
                { value: '1tb', label: '1 TB' },
            ]
        }
    ],
    'mobile-phones': [
        // Duplicate for compatibility with both slugs found in DB
        {
            id: 'ram',
            name: 'RAM',
            type: 'checkbox',
            options: [
                { value: '2gb', label: '2 GB' },
                { value: '3gb', label: '3 GB' },
                { value: '4gb', label: '4 GB' },
                { value: '6gb', label: '6 GB' },
                { value: '8gb', label: '8 GB' },
                { value: '12gb', label: '12 GB' },
                { value: '16gb', label: '16 GB' },
            ]
        },
        {
            id: 'storage',
            name: 'Storage',
            type: 'checkbox',
            options: [
                { value: '32gb', label: '32 GB' },
                { value: '64gb', label: '64 GB' },
                { value: '128gb', label: '128 GB' },
                { value: '256gb', label: '256 GB' },
                { value: '512gb', label: '512 GB' },
                { value: '1tb', label: '1 TB' },
            ]
        }
    ],
    'laptops': [
        {
            id: 'processor',
            name: 'Processor',
            type: 'checkbox',
            options: [
                { value: 'intel-i3', label: 'Intel i3' },
                { value: 'intel-i5', label: 'Intel i5' },
                { value: 'intel-i7', label: 'Intel i7' },
                { value: 'intel-i9', label: 'Intel i9' },
                { value: 'amd-ryzen-3', label: 'AMD Ryzen 3' },
                { value: 'amd-ryzen-5', label: 'AMD Ryzen 5' },
                { value: 'amd-ryzen-7', label: 'AMD Ryzen 7' },
                { value: 'amd-ryzen-9', label: 'AMD Ryzen 9' },
                { value: 'apple-m1', label: 'Apple M1' },
                { value: 'apple-m2', label: 'Apple M2' },
                { value: 'apple-m3', label: 'Apple M3' },
            ]
        },
        {
            id: 'ram',
            name: 'RAM',
            type: 'checkbox',
            options: [
                { value: '4gb', label: '4 GB' },
                { value: '8gb', label: '8 GB' },
                { value: '16gb', label: '16 GB' },
                { value: '32gb', label: '32 GB' },
                { value: '64gb', label: '64 GB' },
            ]
        }
    ],
    'tablets': [
        {
            id: 'screen-size-tab',
            name: 'Screen Size',
            type: 'checkbox',
            options: [
                { value: 'below-8', label: 'Below 8"' },
                { value: '8-10', label: '8" - 10"' },
                { value: '10-11', label: '10" - 11"' },
                { value: '11-13', label: '11" - 13"' },
                { value: 'above-13', label: 'Above 13"' },
            ]
        }
    ],
    'led-tvs': [
        {
            id: 'screen-size-tv',
            name: 'Screen Size',
            type: 'checkbox',
            options: [
                { value: '32', label: '32"' },
                { value: '40-43', label: '40" - 43"' },
                { value: '50-55', label: '50" - 55"' },
                { value: '65', label: '65"' },
                { value: '75-above', label: '75" & Above' },
            ]
        },
        {
            id: 'resolution',
            name: 'Resolution',
            type: 'checkbox',
            options: [
                { value: 'hd', label: 'HD Ready' },
                { value: 'fhd', label: 'Full HD' },
                { value: '4k', label: '4K Ultra HD' },
                { value: '8k', label: '8K' },
            ]
        }
    ],
    'accessories': [
        {
            id: 'accessory-type',
            name: 'Accessory Type',
            type: 'checkbox',
            options: [
                { value: 'charger', label: 'Chargers' },
                { value: 'cable', label: 'Cables' },
                { value: 'earphone', label: 'Earphones' },
                { value: 'headphone', label: 'Headphones' },
                { value: 'case', label: 'Cases & Covers' },
                { value: 'screen-protector', label: 'Screen Protectors' },
                { value: 'power-bank', label: 'Power Banks' },
                { value: 'mouse', label: 'Mouse' },
                { value: 'keyboard', label: 'Keyboard' },
                { value: 'speaker', label: 'Speakers' },
            ]
        }
    ]
};

