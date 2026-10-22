import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <>
      <Nav email={user.email ?? ""} />
      <div className="md:pl-56">
        <main className="mx-auto max-w-5xl p-4 pb-24 md:p-8">{children}</main>
      </div>
    </>
  );
}
