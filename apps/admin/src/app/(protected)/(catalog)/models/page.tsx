import { redirect } from "next/navigation";

export default function ModelsPage() {
    redirect("/categories?tab=models");
}
