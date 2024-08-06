import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { getServerAuthSession } from "@/server/auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FormsList } from "./FormsList";
import { ImportForm } from "./ImportForm";

import { api } from "@/trpc/server";

export default async function Dashboard() {
	const session = await getServerAuthSession();

	const myForms = await api.form.getMyForms();

	if (!session) {
		return redirect("/");
	}

	return (
		<div className="m-2 p-2">
			<h1>Dashboard</h1>
			<div className="flex w-full flex-row flex-wrap">
				<FormsList forms={myForms} />
				<ImportForm />
			</div>
		</div>
	);
}
