import { permanentRedirect } from "next/navigation";
import { buildPublicBrowseRoute, parsePublicBrowseParams } from "@/lib/publicBrowseRoutes";

export const revalidate = 60; // Hardcoded to satisfy Next.js segment config

export default async function BrowseServicesPage(props: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const parsed = parsePublicBrowseParams(await props.searchParams);
    permanentRedirect(buildPublicBrowseRoute({ ...parsed, type: "service" }));
}
