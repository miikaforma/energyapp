'use client';

import { SessionProvider, useSession } from "next-auth/react";

export default function Home() {
  const { status, data: session } = useSession();
  console.log(session);

  return (
    <main className="flex min-h-screen-nhf flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">

    </main>
  );
}
