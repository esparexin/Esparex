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
    return buildCatalogSlugMetadata("brand", slug || "");
}

export default async function BrandRoute({ params }: Props) {
    const { slug } = await params;
    if (!slug) notFound();
    return <CatalogSlugPage entity="brand" slug={slug} />;
}
