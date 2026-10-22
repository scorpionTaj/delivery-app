import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;
  if (!user) redirect("/login");

  return (
    <>
      <Nav email={typeof user.email === "string" ? user.email : ""} />
      <div className="transition-[padding] duration-200 md:pl-60 nav-collapsed:pl-18">
        <main className="mx-auto max-w-5xl p-4 pb-24 md:p-8">{children}</main>
      </div>
    </>
  );
}
