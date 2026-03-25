"use client";
import { useRouter } from "next/navigation";
import { ListingSuccessMessage } from "@/components/user/shared/ListingSuccessMessage";

export default function PostServiceSuccessPage() {
    const router = useRouter();

    return (
        <ListingSuccessMessage
            title="Service Submitted Successfully"
            description="🕒 Your service listing is under admin review. It will go live after approval."
            primaryActionLabel="Go to My Listings"
            onPrimaryAction={() => router.push("/account/business?tab=pending")}
            secondaryActionLabel="Post Another Service"
            onSecondaryAction={() => router.push("/post-service")}
        />
    );
}
