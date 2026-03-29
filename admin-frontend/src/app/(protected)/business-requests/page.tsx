import { redirect } from "next/navigation";

export const metadata = {
    title: "Business Requests | Admin Dashboard",
    description: "Redirecting to Business Master pending review queue",
};

export default function BusinessRequestsPage() {
    redirect("/businesses?status=pending");
}
