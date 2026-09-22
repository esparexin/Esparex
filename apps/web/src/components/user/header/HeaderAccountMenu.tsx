"use client";

import { useState } from "react";
import Image from "next/image";
import { LogOut, Button } from "@esparex/ui";
import type { User } from "@esparex/contracts";
import { getUserInitials } from "@/lib/headerUtils";
import { DEFAULT_IMAGE_PLACEHOLDER } from "@/lib/image/imageUrl";
import type { ResolvedNavigationItem } from "@/config/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Z_INDEX,
} from "@esparex/ui";

interface HeaderAccountMenuProps {
  user: User | null;
  safeProfilePhoto: string;
  profileMenuItems: ResolvedNavigationItem[];
  onMenuItemClick: (item: ResolvedNavigationItem) => void;
  onLogout: () => void;
}

export function HeaderAccountMenu({
  user,
  safeProfilePhoto,
  profileMenuItems,
  onMenuItemClick,
  onLogout,
}: HeaderAccountMenuProps) {
  const [imgErrPhoto, setImgErrPhoto] = useState<string | null>(null);
  const avatarSrc = imgErrPhoto === safeProfilePhoto ? DEFAULT_IMAGE_PLACEHOLDER : (safeProfilePhoto || DEFAULT_IMAGE_PLACEHOLDER);

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-full h-9 w-9 flex-shrink-0 border-none hover:bg-transparent p-0 overflow-hidden ring-1 ring-border/80 hover:ring-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-all cursor-pointer shadow-xs"
          aria-label="Open account menu"
        >
          {safeProfilePhoto ? (
            <Image
              src={avatarSrc}
              alt={user?.name || "Profile"}
              width={36}
              height={36}
              unoptimized
              className="h-9 w-9 rounded-full object-cover"
              onError={() => setImgErrPhoto(safeProfilePhoto)}
            />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center bg-muted text-foreground-secondary font-bold rounded-full hover:bg-accent text-caption">
              {getUserInitials(user?.name || "", user?.mobile)}
            </div>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-64 rounded-2xl shadow-xl border-border p-1.5 animate-in fade-in zoom-in-95 duration-150"
        // design-token-ignore: z-index must use Z_INDEX token via inline style per zIndex.ts governance
        style={{ zIndex: Z_INDEX.userHeaderDropdown }}
        onPointerDownOutside={(e) => {
          if ((e.target as HTMLElement | null)?.closest('[data-slot="dropdown-menu-trigger"]')) {
            e.preventDefault();
          }
        }}
      >
        <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl mb-1 border border-border/40">
          <div className="h-10 w-10 rounded-full overflow-hidden shrink-0 border border-border bg-card flex items-center justify-center font-bold text-caption text-foreground-secondary shadow-xs">
            {safeProfilePhoto ? (
              <Image
                src={avatarSrc}
                alt={user?.name || "Profile"}
                width={40}
                height={40}
                unoptimized
                className="h-10 w-10 rounded-full object-cover"
                onError={() => setImgErrPhoto(safeProfilePhoto)}
              />
            ) : (
              getUserInitials(user?.name || "", user?.mobile)
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-body font-bold text-foreground truncate leading-snug">
              {user?.name || "Esparex User"}
            </p>
            <p className="text-caption text-muted-foreground truncate">
              {user?.mobile ? `+91 ****** ${user.mobile.slice(-4)}` : user?.email || ""}
            </p>
          </div>
        </div>

        <DropdownMenuSeparator className="bg-border/60 my-1" />

        <div className="space-y-0.5 py-0.5">
          {profileMenuItems.map((item) => {
            const Icon = item.icon;
            return (
              <DropdownMenuItem
                key={item.id}
                onClick={() => onMenuItemClick(item)}
                className="cursor-pointer rounded-xl h-9.5 px-2.5 text-body font-medium hover:bg-muted/80 focus:bg-muted/80 transition-colors"
              >
                <Icon className="mr-2.5 h-4 w-4 text-muted-foreground shrink-0" />
                <span className="truncate">{item.label}</span>
              </DropdownMenuItem>
            );
          })}
        </div>

        <DropdownMenuSeparator className="bg-border/60 my-1" />

        <DropdownMenuItem
          onClick={onLogout}
          className="cursor-pointer rounded-xl h-9.5 px-2.5 text-destructive focus:bg-destructive/10 focus:text-destructive hover:bg-destructive/10 transition-colors font-semibold"
        >
          <LogOut className="mr-2.5 h-4 w-4 shrink-0" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
