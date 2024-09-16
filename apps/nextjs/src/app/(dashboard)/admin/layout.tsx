import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { validateRequest } from "~/server/auth";

export default async function AdminLayour({
  children,
}: {
  children: ReactNode;
}) {
  const { user } = await validateRequest();

  if (!user || user.role !== "ADMIN") {
    notFound();
  }

  return (
    <div>
      <header className="mb-4 flex flex-row items-center rounded-lg border-[1px] bg-gray-100 px-4 py-3 shadow">
        <Link href="/admin" className="mr-8 font-bold">
          Admin Panel
        </Link>
        <nav>
          <ul className="flex flex-row items-center gap-6">
            <li>
              <Link href="/admin/users">Users</Link>
            </li>
            <li>
              <Link href="/admin/projects">Projects</Link>
            </li>
          </ul>
        </nav>
      </header>

      {children}
    </div>
  );
}
