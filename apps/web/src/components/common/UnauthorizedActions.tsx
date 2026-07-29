"use client";

import Link from "next/link";
import { Button } from "@esparex/ui";
import { useAuthModal } from "@/context/AuthModalContext";

export function UnauthorizedActions() {
    const { showLogin } = useAuthModal();

    return (
        <div className="flex justify-center gap-3">
            <Button asChild>
                <Link href="/">
                    Go Home
                </Link>
            </Button>

            <Button variant="outline" onClick={() => showLogin("/")}>
                Login
            </Button>
        </div>
    );
}
