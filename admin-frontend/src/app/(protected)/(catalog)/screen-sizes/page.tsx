"use client";

import { Monitor } from "lucide-react";
import { useAdminCategories } from "@/hooks/useAdminCategories";
import { useAdminScreenSizes } from "@/hooks/useAdminScreenSizes";
import { type ScreenSize } from "@/types/screenSize";
import { useAssignableCategories } from "@/hooks/useAssignableCategories";
import { CatalogPageTemplate } from "@/components/catalog/CatalogPageTemplate";
import {
    CatalogActiveCheckboxField,
    CatalogActiveStatusFilter,
    CatalogEditDeleteActions,
    CatalogEntityCell,
    CatalogSelectField,
    CatalogSelectFilter,
    CatalogStatusBadge,
    CatalogTextInputField,
} from "@/components/catalog/CatalogUiPrimitives";
import { toCategoryOptions } from "@/components/catalog/catalogDomainUtils";

export default function ScreenSizesPage() {
    const { categories } = useAdminCategories();
    const {
        screenSizes,
        loading,
        error,
        pagination,
        filters,
        setFilters,
        setPage,
        handleDelete,
        handleCreate,
        handleUpdate,
    } = useAdminScreenSizes();

    const { assignableCategories } = useAssignableCategories(
        categories,
        (cat) => cat.hasScreenSizes === true
    );
    const categoryOptions = toCategoryOptions(assignableCategories);

    return (
        <CatalogPageTemplate<ScreenSize, { size: string; name: string; value: number; categoryId: string; isActive: boolean }>
            title="Screen Sizes"
            description="Manage screen-size master data by category."
            createLabel="Add Screen Size"
            csvFileName="screen-sizes.csv"
            items={screenSizes}
            loading={loading}
            error={error}
            pagination={pagination}
            setPage={setPage}
            handleCreate={handleCreate}
            handleUpdate={handleUpdate}
            defaultFormData={{ size: "", name: "", value: 1, categoryId: "", isActive: true }}
            customSubmitValidation={(formData) => {
                if (!formData.categoryId) return "Category is required";
                return null;
            }}
            onModalOpen={(item, setFormData) => {
                if (item) {
                    setFormData({
                        size: item.size,
                        name: item.name || "",
                        value: item.value,
                        categoryId: item.categoryId,
                        isActive: item.isActive,
                    });
                }
            }}
            generateColumns={(openEditModal) => [
                {
                    header: "Screen Size",
                    cell: (screenSize) => (
                        <CatalogEntityCell
                            icon={<Monitor size={20} />}
                            iconClassName="bg-sky-50 text-sky-600"
                            title={screenSize.size}
                            subtitle={screenSize.name}
                        />
                    ),
                },
                {
                    header: "Category",
                    cell: (screenSize) => {
                        const category = categories.find((cat) => cat.id === screenSize.categoryId);
                        return <span className="text-sm font-medium text-slate-700">{category?.name || "Unknown"}</span>;
                    },
                },
                {
                    header: "Sort Order",
                    cell: (screenSize) => <span className="text-sm font-semibold text-slate-700">{screenSize.value}</span>,
                },
                {
                    header: "Status",
                    cell: (screenSize) => (
                        <CatalogStatusBadge
                            label={screenSize.isActive ? "Active" : "Inactive"}
                            tone={screenSize.isActive ? "success" : "danger"}
                        />
                    ),
                },
                {
                    header: "Actions",
                    className: "text-right",
                    cell: (screenSize) => (
                        <CatalogEditDeleteActions
                            onEdit={() => openEditModal(screenSize)}
                            onDelete={() => void handleDelete(screenSize.id)}
                        />
                    ),
                },
            ]}
            filterLayoutClassName="md:grid-cols-2"
            filtersRenderer={
                <>
                    <div className="flex flex-col md:flex-row gap-4 flex-1">
                        <CatalogSelectFilter
                            className="flex-1"
                            value={filters.categoryId}
                            onChange={(categoryId) => setFilters((prev) => ({ ...prev, categoryId }))}
                            options={[
                                { value: "all", label: "All Categories" },
                                ...categoryOptions.map((opt) => ({ value: opt.id, label: opt.name })),
                            ]}
                            withFilterIcon
                        />
                        <CatalogActiveStatusFilter
                            value="all"
                            onChange={() => {}}
                        />
                    </div>
                </>
            }
            formRenderer={(formData, setFormData) => (
                <>
                    <div className="grid grid-cols-2 gap-4">
                        <CatalogTextInputField
                            label="Size"
                            placeholder='e.g. 55"'
                            value={formData.size}
                            onChange={(size) => setFormData((prev) => ({ ...prev, size }))}
                        />
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sort Order</label>
                            <input
                                required
                                type="number"
                                min={1}
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary/20"
                                value={formData.value}
                                onChange={(e) => setFormData((prev) => ({ ...prev, value: Number(e.target.value) }))}
                            />
                        </div>
                    </div>

                    <CatalogTextInputField
                        label="Display Name (Optional)"
                        placeholder='e.g. 55" TV'
                        value={formData.name}
                        required={false}
                        onChange={(name) => setFormData((prev) => ({ ...prev, name }))}
                    />

                    <CatalogSelectField
                        label="Category"
                        placeholder="Select Category"
                        value={formData.categoryId}
                        options={categoryOptions.map((opt) => ({ value: opt.id, label: opt.name }))}
                        required
                        onChange={(categoryId) => setFormData((prev) => ({ ...prev, categoryId }))}
                    />

                    <CatalogActiveCheckboxField
                        checked={formData.isActive}
                        onChange={(isActive) => setFormData((prev) => ({ ...prev, isActive }))}
                    />
                </>
            )}
        />
    );
}
