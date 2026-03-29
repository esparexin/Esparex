"use client";


import { useBottomBar } from '../context/BottomBarContext';
import type { ButtonProps } from './ui/button';
import { Button } from './ui/button';
import { useRouter, usePathname } from 'next/navigation';

export function BottomActionsBar({ enabled = true }: { enabled?: boolean }) {
    const { actions, isVisible } = useBottomBar();
    const router = useRouter();
    const pathname = usePathname();

    // Don't show bottom bar on admin pages
    if (!enabled || pathname?.startsWith('/admin')) {
        return null;
    }

    if (!isVisible || actions.length === 0) {
        return null;
    }

    return (
        <div className="fixed bottom-0 inset-x-0 z-50 bg-white border-t border-gray-200 p-4 md:hidden shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
            <div className="flex gap-3 max-w-md mx-auto">
                {actions.map((action, index) => {
                    const variant: ButtonProps["variant"] = action.variant ?? "outline";
                    return (
                    <Button
                        key={index}
                        variant={variant}
                        className={`flex-1 ${action.variant === 'primary' ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}`}
                        onClick={() => {
                            if (action.onClick) {
                                action.onClick();
                            } else if (action.href) {
                                void router.push(action.href);
                            }
                        }}
                        disabled={action.disabled}
                    >
                        {action.icon && <span className="mr-2">{action.icon}</span>}
                        {action.label}
                    </Button>
                );
                })}
            </div>
        </div>
    );
}
