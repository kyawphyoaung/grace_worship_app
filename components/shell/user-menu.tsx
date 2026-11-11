"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Settings } from "lucide-react";
import { logout as logoutAction } from "@/lib/actions/auth";
import { t, type Language } from "@/lib/i18n";
import { UserAvatar } from "@/components/user-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Profile } from "@/lib/auth/profile";
import { resolveDisplayName } from "@/lib/display-name";

export function UserMenu({
  language,
  me,
}: {
  language: Language;
  me: Profile;
}) {
  const router = useRouter();
  const myName = resolveDisplayName(me.id, me.display_name);

  const logout = async () => {
    await logoutAction();
    router.push("/auth/login");
    router.refresh();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={myName}
          className="flex min-h-11 min-w-11 items-center justify-center rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
        >
          <UserAvatar
            userId={me.id}
            displayName={myName}
            avatarUrl={me.avatar_url}
            size={40}
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[11rem]">
        <DropdownMenuItem asChild className="min-h-11 cursor-pointer gap-2">
          <Link href="/settings">
            <Settings className="h-4 w-4" aria-hidden />
            {t("settings.title", language)}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="min-h-11 cursor-pointer gap-2 text-destructive focus:text-destructive"
          onSelect={(e) => {
            e.preventDefault();
            void logout();
          }}
        >
          <LogOut className="h-4 w-4" aria-hidden />
          {t("auth.logout", language)}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
