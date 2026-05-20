import { redirect } from "next/navigation";

export default function CatalogRequestsPage() {
    redirect("/categories?tab=catalog-requests");
}
