import { redirect } from "next/navigation";
import {
  ensureProfile,
  getCurrentUser,
  getPartnerUserId,
  isPartnerLinked,
} from "@/lib/auth/profile";
import { CoupleProvider } from "@/components/couple-provider";
import { profileLanguage } from "@/lib/auth/profile";

export const instant = false;

export default async function PrintLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { supabase, user } = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const profile = await ensureProfile(supabase, user.id, user.email);
  if (!profile) redirect("/auth/login");

  const linked = await isPartnerLinked(supabase, user.id);
  if (!linked) redirect("/home");

  const partnerId = await getPartnerUserId(supabase, user.id);
  const { data: partnerProfile } = partnerId
    ? await supabase.from("profiles").select("*").eq("id", partnerId).maybeSingle()
    : { data: null };

  return (
    <CoupleProvider
      language={profileLanguage(profile)}
      me={profile}
      partner={partnerProfile}
    >
      <div className="min-h-dvh bg-background text-foreground">{children}</div>
    </CoupleProvider>
  );
}
