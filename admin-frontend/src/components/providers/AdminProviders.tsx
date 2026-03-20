import { AdminAuthProvider } from "@/context/AdminAuthContext";
import { ToastProvider } from "@/context/ToastContext";
import { FormFieldAttributeGuard } from "@/components/accessibility/FormFieldAttributeGuard";

export function AdminProviders({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthProvider>
      <ToastProvider>
        <FormFieldAttributeGuard />
        {children}
      </ToastProvider>
    </AdminAuthProvider>
  );
}
