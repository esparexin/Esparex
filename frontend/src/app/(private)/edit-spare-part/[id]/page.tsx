"use client";

import { use } from "react";
import PostSparePartForm from "@/components/user/post-spare-part/PostSparePartForm";

export default function EditSparePartPageWrapper({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);

    return <PostSparePartForm editSparePartId={id} />;
}
