import { redirect } from "next/navigation";

import { AccountPageShell } from "../_shell/AccountPageShell";
import { buildAccountListingRoute, normalizeAccountListingStatus } from "@/lib/accountListingRoutes";

export default async function AccountServicesPage(props: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const searchParams = await props.searchParams;
    const rawStatus = typeof searchParams.status === "string" ? searchParams.status : undefined;
    const normalizedStatus = normalizeAccountListingStatus("services", rawStatus);

    if (rawStatus !== normalizedStatus) {
        redirect(buildAccountListingRoute("services", normalizedStatus));
    }

    return <AccountPageShell tab="services" />;
}
