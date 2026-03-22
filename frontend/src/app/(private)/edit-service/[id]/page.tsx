"use client";

import { use } from "react";
import { PostServiceForm } from "@/components/user/post-service/PostServiceForm";

export default function EditServicePageWrapper({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);

    return <PostServiceForm editServiceId={id} />;
}
