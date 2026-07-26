import { SettingsIcon } from '@/components/ui/icons';
import { ACCOUNT_COPY } from '@/config/copy/account';

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
        <div className="p-2 bg-blue-600 rounded-xl shadow-xs">
          <SettingsIcon className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className={mobile ? "text-base font-semibold text-slate-900 tracking-tight" : "account-page-title"}>
            {title}
          </h1>
          <p className="account-body-text mt-0.5">
            {subtitle}
          </p>
        </div>
      </div>
    </div>
  );
}

