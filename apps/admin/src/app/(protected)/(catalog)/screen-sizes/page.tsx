import { redirect } from "next/navigation";

export default function ScreenSizesPage() {
    redirect("/categories?tab=screen-sizes");
}
