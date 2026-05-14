import { redirect } from "next/navigation";

export default function ServiceTypesPage() {
    redirect("/categories?tab=service-types");
}
