"use client";

import { AppHeader, type AppHeaderProps } from "./AppHeader";

export type UserHeaderProps = AppHeaderProps;

export function UserHeader(props: UserHeaderProps) {
  return <AppHeader {...props} />;
}
