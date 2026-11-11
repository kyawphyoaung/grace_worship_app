"use client";

import { logout as logoutAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function LogoutButton({ label = "Log out" }: { label?: string }) {
  const router = useRouter();

  const logout = async () => {
    await logoutAction();
    router.push("/auth/login");
    router.refresh();
  };

  return (
    <Button
      variant="ghost"
      className="min-h-11"
      onClick={logout}
      type="button"
    >
      {label}
    </Button>
  );
}
