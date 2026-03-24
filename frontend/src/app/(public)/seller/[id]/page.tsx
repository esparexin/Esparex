import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getUserProfile } from "@/lib/api/user/users";
import { SellerProfilePage } from "@/components/user/SellerProfilePage";

type SellerProfileRouteProps = {
    params: Promise<{ id: string }>;
};

export const revalidate = 60;

export const metadata: Metadata = {
    title: "Seller Profile | Esparex",
    description: "View verified seller profile and active listings on Esparex.",
};

export default async function SellerProfileRoute({
    params,
}: SellerProfileRouteProps) {
    const { id } = await params;
    if (!id) {
        notFound();
    }

    const profile = await getUserProfile(id, {
        fetchOptions: { next: { revalidate } },
    });

    if (!profile) {
        notFound();
    }

    return <SellerProfilePage profile={profile} />;
}
