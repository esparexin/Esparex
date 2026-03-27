import { redirect } from "next/navigation";

import { AccountPageShell } from "../_shell/AccountPageShell";
import { buildAccountListingRoute, normalizeAccountListingStatus } from "@/lib/accountListingRoutes";

export default async function AccountSparePartsPage(props: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const searchParams = await props.searchParams;
    const rawStatus = typeof searchParams.status === "string" ? searchParams.status : undefined;
    const normalizedStatus = normalizeAccountListingStatus("spare-parts", rawStatus);

    if (rawStatus !== normalizedStatus) {
        redirect(buildAccountListingRoute("spare-parts", normalizedStatus));
    }

    return <AccountPageShell tab="spareparts" />;
}
