"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { t, type Language } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { BookOpen, Church, HeartHandshake, Home } from "lucide-react";

const items = [
  { href: "/home", key: "nav.home" as const, icon: Home },
  { href: "/bible", key: "nav.bible" as const, icon: BookOpen },
  { href: "/prayer", key: "nav.prayer" as const, icon: HeartHandshake },
  { href: "/worship", key: "nav.worship" as const, icon: Church },
];

export function Sidebar({ language }: { language: Language }) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 border-r border-border/80 bg-background/80 md:flex md:flex-col">
      <div className="px-6 py-8">
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-primary">
          {t("appName", language)}
        </p>
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-3" aria-label="Main">
        {items.map(({ href, key, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="h-5 w-5" aria-hidden />
              {t(key, language)}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
