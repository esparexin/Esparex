export const getModelStatusClassName = (status: string) => {
    return status === "live"
        ? "bg-emerald-50 text-emerald-600"
        : status === "pending"
            ? "bg-amber-50 text-amber-600"
            : "bg-red-50 text-red-600";
};
