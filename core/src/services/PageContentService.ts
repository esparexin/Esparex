import PageContent from '../models/PageContent';

export const findContentBySlug = async (slug: string) => {
    return PageContent.findOne({ slug });
};

export const upsertContentBySlug = async (
    slug: string,
    data: { title?: string; content?: string; items?: unknown[]; metadata?: unknown; updatedBy?: string }
) => {
    return PageContent.findOneAndUpdate(
        { slug },
        { ...data },
        { new: true, upsert: true, runValidators: true }
    );
};

export const getAllContent = async () => {
    return PageContent.find({}, 'slug title updatedAt');
};
