import { SettingsIcon } from '@/components/ui/icons';
import ACCOUNT_COPY from '@/config/copy/account';

interface AccountHeaderProps {
  className?: string;
  mobile?: boolean;
}

export function AccountHeader({ className = '', mobile = false }: AccountHeaderProps) {
  const title = mobile ? ACCOUNT_COPY.mobileTitle : ACCOUNT_COPY.title;
  const subtitle = mobile ? ACCOUNT_COPY.mobileSubtitle : ACCOUNT_COPY.subtitle;

  return (
    <div className={className}>
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-blue-600 rounded-2xl shadow-lg shadow-blue-200">
          <SettingsIcon className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground font-medium">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

export default AccountHeader;
