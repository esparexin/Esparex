"use client";

import { useState } from "react";
import Image from "next/image";
import { LogOut } from "@/icons/IconRegistry";
import type { User } from "@/types/User";
import { getUserInitials } from "@/lib/headerUtils";
import { Button } from "@esparex/ui";
import { DEFAULT_IMAGE_PLACEHOLDER } from "@/lib/image/imageUrl";
import type { ResolvedNavigationItem } from "@/config/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";

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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-full h-8 w-8 flex-shrink-0 border-none hover:bg-transparent p-0 overflow-hidden ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer"
          aria-label="Open account menu"
        >
          {safeProfilePhoto ? (
            <Image
              src={avatarSrc}
              alt={user?.name || "Profile"}
              width={32}
              height={32}
              unoptimized
              className="h-8 w-8 rounded-full object-cover"
              onError={() => setImgErrPhoto(safeProfilePhoto)}
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center bg-muted text-foreground-secondary font-semibold border border-border rounded-full hover:bg-accent text-caption">
              {getUserInitials(user?.name || "", user?.mobile)}
            </div>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={6} className="w-56 rounded-xl shadow-lg border-border p-1">
        <DropdownMenuLabel className="font-normal p-3 bg-muted/50 rounded-t-xl mb-1">
          <div className="flex flex-col space-y-1">
            <p className="text-body font-semibold leading-none text-foreground">{user?.name || "Esparex User"}</p>
            <p className="text-caption text-muted-foreground">
              {user?.mobile ? `****** ${user.mobile.slice(-4)}` : ""}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border" />
        {profileMenuItems.map((item) => {
          const Icon = item.icon;
          return (
            <DropdownMenuItem
              key={item.id}
              onClick={() => onMenuItemClick(item)}
              className="cursor-pointer rounded-lg focus:bg-muted"
            >
              <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
              <span className="text-body">{item.label}</span>
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator className="bg-border" />
        <DropdownMenuItem
          onClick={onLogout}
          className="cursor-pointer rounded-lg text-destructive focus:bg-destructive/10 focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span className="text-body font-medium">Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
