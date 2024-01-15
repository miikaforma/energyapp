import Link from "next/link";

import { CreatePost } from "@energyapp/app/_components/create-post";
import { getServerAuthSession } from "@energyapp/server/auth";
import { api } from "@energyapp/trpc/server";

export const metadata = {
  title: "Subpage Title",
  description: "This is a description of the subpage.",
  // other metadata...
};

export default async function Page() {
  const hello = await api.post.hello.query({ text: "from tRPC" });
  const spotPrices = await api.spotPrice.get.query({ startTime: "2023-12-01T00:00Z", endTime: "2023-12-31T00:00Z" });
  const session = await getServerAuthSession();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16 ">
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
          Test <span className="text-[hsl(280,100%,70%)]">T3</span> App
        </h1>
      </div>
    </main>
  );
}

