import { redirect } from "next/navigation";

/** /account → canonical dashboard home */
export default function AccountIndexPage() {
    redirect("/account/profile");
}
