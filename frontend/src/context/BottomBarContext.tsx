"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface BottomBarAction {
    label: string;
    onClick?: () => void;
    href?: string;
    variant?: 'primary' | 'secondary' | 'destructive' | 'ghost';
    disabled?: boolean;
    icon?: React.ReactNode;
}

interface BottomBarContextType {
    actions: BottomBarAction[];
    setActions: (actions: BottomBarAction[]) => void;
    isVisible: boolean;
    setIsVisible: (visible: boolean) => void;
}

const BottomBarContext = createContext<BottomBarContextType | undefined>(undefined);

export function BottomBarProvider({ children }: { children: ReactNode }) {
    const [actions, setActions] = useState<BottomBarAction[]>([]);
    const [isVisible, setIsVisible] = useState(true);

    const value = React.useMemo(() => ({
        actions,
        setActions,
        isVisible,
        setIsVisible
    }), [actions, isVisible]);

    return (
        <BottomBarContext.Provider value={value}>
            {children}
        </BottomBarContext.Provider>
    );
}

export function useBottomBar() {
    const context = useContext(BottomBarContext);
    if (context === undefined) {
        throw new Error('useBottomBar must be used within a BottomBarProvider');
    }
    return context;
}
