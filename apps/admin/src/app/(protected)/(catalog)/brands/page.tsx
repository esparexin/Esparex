import { redirect } from "next/navigation";

export default function BrandsPage() {
    redirect("/categories?tab=brands");
}
