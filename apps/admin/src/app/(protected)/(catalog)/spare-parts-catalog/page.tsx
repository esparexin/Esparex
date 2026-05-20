import { redirect } from "next/navigation";

export default function SparePartsCatalogPage() {
    redirect("/categories?tab=spare-parts");
}
