"use client";

interface BrandSearchSelectProps {
    brands: string[];
    brandMap: Record<string, { id?: string } | undefined>;
    /** Currently selected brand display name. */
    value: string;
    /** Called with (brandId, brandName, requestId) on selection */
    onChange: (brandId: string, brandName: string, requestId?: string) => void;
    categoryId: string;
  
    disabled?: boolean;
    placeholder?: string;
    className?: string;
}

export function BrandSearchSelect({
    brands,
    brandMap,
    value,
    onChange,
    categoryId,
    disabled = false,
    placeholder = "Search brand...",
    className,
}: BrandSearchSelectProps) {
    const [search, setSearch] = useState("");
    const [isEditing, setIsEditing] = useState(false);
  
    const selectedName = value ?? "";
    const canRequestBrand = Boolean(categoryId);

    const filtered = useMemo(
        () =>
            search
                ? brands.filter((b) => b.toLowerCase().includes(search.toLowerCase()))
                : brands,
        [brands, search]
    );

    const handleSelect = (brandName: string) => {
        const id = brandMap[brandName]?.id ?? brandName;
        onChange(id, brandName);
        setSearch("");
        setIsEditing(false);
    };
  
    return (

    );
}
