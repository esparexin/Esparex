import { AdminAuthProvider } from "@/context/AdminAuthContext";
import { ToastProvider } from "@/context/ToastContext";
import { AdminPopupProvider } from "@/context/AdminPopupProvider";
import { FormFieldAttributeGuard } from "@/components/accessibility/FormFieldAttributeGuard";

export function AdminProviders({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthProvider>
      <ToastProvider>
        <AdminPopupProvider>
          <FormFieldAttributeGuard />
          {children}
        </AdminPopupProvider>
      </ToastProvider>
    </AdminAuthProvider>
  );
}
