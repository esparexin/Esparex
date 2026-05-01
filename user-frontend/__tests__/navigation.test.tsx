import { render, screen, fireEvent } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { ProfileSettingsSidebar } from '@/components/user/ProfileSettingsSidebar';

// Mock Next.js router
jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
}));

describe('Profile Navigation', () => {
    const mockRouter = {
        push: jest.fn(),
        replace: jest.fn(),
    };

    const mockUser = {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        mobile: '+1234567890',
        businessStatus: 'NONE' as const,
    };

    const mockNavigateTo = jest.fn();
    const mockOnUpdateUser = jest.fn();
    const mockOnLogout = jest.fn();

    beforeEach(() => {
        (useRouter as jest.Mock).mockReturnValue(mockRouter);
        jest.clearAllMocks();
    });

    describe('Desktop Tab Switching', () => {
        it('should update tab state without navigation on desktop', () => {
            render(
                <ProfileSettingsSidebar
                    navigateTo={mockNavigateTo}
                    user={mockUser}
                    onUpdateUser={mockOnUpdateUser}
                    onLogout={mockOnLogout}
                    initialTab="personal"
                />
            );

            // Find and click Settings tab
            const settingsButton = screen.getByText('Settings');
            fireEvent.click(settingsButton);

            // Assert: activeTab state updated (check if Settings content is visible)
            expect(screen.getByText(/Notification Settings/i)).toBeInTheDocument();

            // Assert: No router.replace called
            expect(mockRouter.replace).not.toHaveBeenCalled();

            // Assert: URL updated with query param
            expect(window.location.search).toContain('tab=settings');
        });

        it('should switch between multiple tabs correctly', () => {
            render(
                <ProfileSettingsSidebar
                    navigateTo={mockNavigateTo}
                    user={mockUser}
                    onUpdateUser={mockOnUpdateUser}
                    onLogout={mockOnLogout}
                    initialTab="personal"
                />
            );

            // Click Settings
            fireEvent.click(screen.getByText('Settings'));
            expect(screen.getByText(/Notification Settings/i)).toBeInTheDocument();

            // Click Plans
            fireEvent.click(screen.getByText('Plans'));
            expect(screen.getByText(/Plans & Boosting/i)).toBeInTheDocument();

            // Click back to Account
            fireEvent.click(screen.getByText('Account'));
            expect(screen.getByText(/Personal Information/i)).toBeInTheDocument();

            // No navigation should have occurred
            expect(mockRouter.replace).not.toHaveBeenCalled();
            expect(mockRouter.push).not.toHaveBeenCalled();
        });
    });

    describe('Mobile Tab Switching', () => {
        beforeEach(() => {
            // Mock mobile viewport
            global.innerWidth = 375;
            global.dispatchEvent(new Event('resize'));
        });

        it('should hide menu and show content on mobile tab click', () => {
            render(
                <ProfileSettingsSidebar
                    navigateTo={mockNavigateTo}
                    user={mockUser}
                    onUpdateUser={mockOnUpdateUser}
                    onLogout={mockOnLogout}
                />
            );

            // On mobile, should show menu initially
            expect(screen.getByText('Account Management')).toBeInTheDocument();

            // Click Settings in menu
            fireEvent.click(screen.getByText('Settings'));

            // Should hide menu and show Settings content
            expect(screen.getByText(/Notification Settings/i)).toBeInTheDocument();
            expect(screen.queryByText('Account Management')).not.toBeInTheDocument();
        });
    });

    describe('Desktop/Mobile Parity', () => {
        it('should use same click handler for both viewports', () => {
            const { rerender } = render(
                <ProfileSettingsSidebar
                    navigateTo={mockNavigateTo}
                    user={mockUser}
                    onUpdateUser={mockOnUpdateUser}
                    onLogout={mockOnLogout}
                    initialTab="personal"
                />
            );

            // Desktop: Click Settings
            fireEvent.click(screen.getByText('Settings'));
            const desktopURL = window.location.search;

            // Switch to mobile
            global.innerWidth = 375;
            global.dispatchEvent(new Event('resize'));

            rerender(
                <ProfileSettingsSidebar
                    navigateTo={mockNavigateTo}
                    user={mockUser}
                    onUpdateUser={mockOnUpdateUser}
                    onLogout={mockOnLogout}
                    initialTab="personal"
                />
            );

            // Mobile: Click Settings
            fireEvent.click(screen.getByText('Settings'));
            const mobileURL = window.location.search;

            // Assert: Same URL update behavior
            expect(desktopURL).toBe(mobileURL);

            // Assert: Same state changes (both show Settings content)
            expect(screen.getByText(/Notification Settings/i)).toBeInTheDocument();
        });
    });

    describe('URL Ownership', () => {
        it('should not navigate when clicking different tabs', () => {
            render(
                <ProfileSettingsSidebar
                    navigateTo={mockNavigateTo}
                    user={mockUser}
                    onUpdateUser={mockOnUpdateUser}
                    onLogout={mockOnLogout}
                    initialTab="personal"
                />
            );

            const tabs = ['Settings', 'Plans', 'My Ads', 'Account'];

            tabs.forEach((tab) => {
                fireEvent.click(screen.getByText(tab));

                // Assert: No navigation occurred
                expect(mockNavigateTo).not.toHaveBeenCalled();
                expect(mockRouter.push).not.toHaveBeenCalled();
                expect(mockRouter.replace).not.toHaveBeenCalled();
            });
        });
    });
});
