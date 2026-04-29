"use client";

import { useParams } from "next/navigation";
import { PostServiceForm } from "@/components/user/post-service/PostServiceForm";
import { withGuard } from "@/guards/withGuard";
import { requireBusinessAuth } from "@/guards/routeGuards";

function EditServicePageWrapper() {
    const params = useParams();
    const id = params?.id as string;

    if (!id) return null;
    return <PostServiceForm editServiceId={id} />;
}

export default withGuard(EditServicePageWrapper, requireBusinessAuth);
