import Link from "next/link";

import { getServerAuthSession } from "@/server/auth";
import { HydrateClient } from "@/trpc/server";

import { SignInButton } from "@/components/SignInButton";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import Picker from "./_components/Picker";

export default async function Home() {
	const session = await getServerAuthSession();

	return (
		<HydrateClient>
			<main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
				<div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
					<h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
						Forms Forge
					</h1>
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-8"></div>
					<div className="flex flex-col items-center gap-2">
						<div className="flex flex-col items-center justify-center gap-4">
							<p className="text-center text-2xl text-white">
								{session && <span>Logged in as {session.user?.name}</span>}
							</p>
							<SignInButton redirect="/app/dashboard" />
						</div>
					</div>
				</div>
			</main>
		</HydrateClient>
	);
}
