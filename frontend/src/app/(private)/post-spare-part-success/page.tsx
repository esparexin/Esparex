"use client";

import { useRouter } from "next/navigation";
import { ListingSuccessMessage } from "@/components/user/shared/ListingSuccessMessage";

export default function PostSparePartSuccessPage() {
    const router = useRouter();
    return (
        <ListingSuccessMessage
            title="Spare Part Submitted!"
            description={
                <>
                    Your spare part listing is now <span className="font-semibold text-amber-600">under review</span>. We typically approve listings within 24 hours.
                </>
            }
            primaryActionLabel="Go to My Listings"
            onPrimaryAction={() => router.push("/account/business")}
            secondaryActionLabel="Post Another Part"
            onSecondaryAction={() => router.push("/post-spare-part-listing")}
        />
    );
}
