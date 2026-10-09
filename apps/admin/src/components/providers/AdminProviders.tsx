import { AdminAuthProvider } from "@/context/AdminAuthContext";
import { AdminPopupProvider } from "@/context/AdminPopupProvider";
import { FormFieldAttributeGuard } from "@/components/accessibility/FormFieldAttributeGuard";
import { AdminViewportShell } from "./AdminViewportShell";

export function AdminProviders({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthProvider>
      <AdminPopupProvider>
        <AdminViewportShell />
        <FormFieldAttributeGuard />
        {children}
      </AdminPopupProvider>
    </AdminAuthProvider>
  );
}