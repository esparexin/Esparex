import Link from "next/link";
import type { Metadata } from "next";
import { ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
    title: "Unauthorized | Esparex",
    robots: {
        index: false,
        follow: false
    },
    alternates: {
        canonical: "/"
    }
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

                <div className="flex justify-center gap-3">

                    <Button asChild>
                        <Link href="/">
                            Go Home
                        </Link>
                    </Button>

                    <Button variant="outline" asChild>
                        <Link href="/login">
                            Login
                        </Link>
                    </Button>

                </div>

            </div>

        </main>

    );
}