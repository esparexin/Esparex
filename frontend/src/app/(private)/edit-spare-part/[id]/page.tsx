"use client";

import { useParams } from "next/navigation";
import PostSparePartForm from "@/components/user/post-spare-part/PostSparePartForm";
import { withGuard } from "@/guards/withGuard";
import { requireBusinessAuth } from "@/guards/routeGuards";

function EditSparePartPageWrapper() {
    const params = useParams();
    const id = params?.id as string;

    if (!id) return null;
    return <PostSparePartForm editSparePartId={id} />;
}

export default withGuard(EditSparePartPageWrapper, requireBusinessAuth);
