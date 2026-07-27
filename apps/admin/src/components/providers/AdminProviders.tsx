import { AdminAuthProvider } from "@/context/AdminAuthContext";
import { AdminPopupProvider } from "@/context/AdminPopupProvider";
import { FormFieldAttributeGuard } from "@/components/accessibility/FormFieldAttributeGuard";

export function AdminProviders({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthProvider>
      <AdminPopupProvider>
        <FormFieldAttributeGuard />
        {children}
      </AdminPopupProvider>
    </AdminAuthProvider>
  );
}
