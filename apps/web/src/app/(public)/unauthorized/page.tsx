import type { Metadata } from "next";
import { ShieldOff } from "@/icons/IconRegistry";
import { UnauthorizedActions } from "@/components/common/UnauthorizedActions";

export const metadata: Metadata = {
    title: "Unauthorized Access | Esparex",
    robots: { index: false, follow: false },
};

export default function UnauthorizedPage() {
    return (
        <main className="min-h-dvh flex items-center justify-center px-4">
            <div
                role="alert"
                className="text-center space-y-4 max-w-md"
            >
                <div className="flex justify-center">
                    <ShieldOff className="h-12 w-12 text-destructive/60" />
                </div>

                <h1 className="text-3xl font-bold text-foreground">
                    Unauthorized Access
                </h1>

                <p className="text-muted-foreground">
                    You do not have permission to access this page.
                    Please login with the correct account.
                </p>

                <UnauthorizedActions />
            </div>
        </main>
    );
}