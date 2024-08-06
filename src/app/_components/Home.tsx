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

export default async function Home() {
	const session = await getServerAuthSession();
	if (!session) {
		return redirect("/");
	}

	return (
		<div className="m-2 p-2">
			{session.user.organizations.map((org) => (
				<Link
					href={`/${org.organization.organizationSlug}`}
					key={org.organizationId}
				>
					<Card className="w-96">
						<CardHeader>
							<CardTitle>{org.organization.organizationName}</CardTitle>
							{/* <CardDescription>Card Description</CardDescription> */}
						</CardHeader>
						<CardContent>
							<p>Card Content</p>
						</CardContent>
						<CardFooter>
							<p>Card Footer</p>
						</CardFooter>
					</Card>
				</Link>
			))}
		</div>
	);
}
