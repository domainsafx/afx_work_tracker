import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/common/Sidebar";
import { Navbar } from "@/components/common/Navbar";
import { IncomingCallListener } from "@/components/calls/IncomingCallListener";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const role = (session.user as any).role as string;

  return (
    <div className="flex min-h-screen w-full min-w-0">
      <IncomingCallListener />
      {/* Desktop Sidebar */}
      <div className="hidden md:flex">
        <Sidebar role={role} />
      </div>

      <div className="flex min-h-screen flex-1 flex-col min-w-0 w-full">
        <Navbar
          name={session.user.name ?? "User"}
          email={session.user.email ?? ""}
          role={role}
        />

        <main className="flex-1 bg-background p-3 sm:p-4 md:p-6 min-w-0 w-full overflow-x-hidden">
          <div className="mx-auto w-full max-w-7xl min-w-0">{children}</div>
        </main>
      </div>
    </div>
  );
}