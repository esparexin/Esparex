import { redirect } from "next/navigation";

import { AccountPageShell } from "../_shell/AccountPageShell";
import { buildAccountListingRoute, normalizeAccountListingStatus } from "@/lib/accountListingRoutes";

export default async function AccountServicesPage(props: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const searchParams = await props.searchParams;
    const rawStatus = typeof searchParams.status === "string" ? searchParams.status : undefined;
    const normalizedStatus = normalizeAccountListingStatus("services", rawStatus);

    const pageParam = typeof searchParams.page === "string" ? parseInt(searchParams.page, 10) : undefined;

    if (rawStatus !== normalizedStatus) {
        redirect(buildAccountListingRoute("services", normalizedStatus, pageParam));
    }

    return <AccountPageShell tab="mylistings" listingSubTab="services" />;
}
