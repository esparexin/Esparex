import React from 'react';
import { KeyboardScreen, Container, Stack, AppText, Spacer } from '@esparex/mobile-ui';

interface AuthLayoutProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  title,
  description,
  children,
  footer,
}) => {
  return (
    <KeyboardScreen>
      <Container maxWidth="sm" className="flex-1 py-12">
        <Stack spacing="lg" className="flex-1 justify-center">
          <Stack spacing="xs" className="mb-4">
            <AppText variant="h1" className="text-center text-sky-500">Esparex</AppText>
            <AppText variant="h3" className="text-center">{title}</AppText>
            {description && (
              <AppText variant="body" className="text-center text-slate-500 mt-2">
                {description}
              </AppText>
            )}
          </Stack>
          
          <Stack spacing="md" className="w-full">
            {children}
          </Stack>

          {footer && (
            <>
              <Spacer size={32} />
              <Stack align="center" className="w-full">
                {footer}
              </Stack>
            </>
          )}
        </Stack>
      </Container>
    </KeyboardScreen>
  );
};
