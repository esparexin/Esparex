import { redirect } from 'next/navigation';

type Props = {
    params: Promise<{ slug: string }>;
};

/** Permanent redirect — canonical path is now /spare-part-listings/[slug] */
export default async function SparePartsSlugRedirect({ params }: Props) {
    const { slug } = await params;
    redirect(`/spare-part-listings/${slug}`);
}
