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

export function BottomNav({ language }: { language: Language }) {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-background/95 backdrop-blur md:hidden"
      aria-label="Main"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-4 gap-1 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1">
        {items.map(({ href, key, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-lg px-1 text-xs transition-colors",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-5 w-5" aria-hidden />
                <span>{t(key, language)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
