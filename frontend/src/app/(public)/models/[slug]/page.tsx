import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
    CatalogSlugPage,
    buildCatalogSlugMetadata,
} from '@/components/catalog/CatalogSlugPage';

type Props = {
    params: Promise<{ slug: string }>
}

export async function generateMetadata(
    { params }: Props
): Promise<Metadata> {
    const { slug } = await params;
    return buildCatalogSlugMetadata("model", slug || "");
}

export default async function ModelRoute({ params }: Props) {
    const { slug } = await params;
    if (!slug) notFound();
    return <CatalogSlugPage entity="model" slug={slug} />;
}
