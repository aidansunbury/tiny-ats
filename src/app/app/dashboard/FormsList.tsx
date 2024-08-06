import type { form } from "@/server/db/schema";
import type { InferSelectModel } from "drizzle-orm";

type Form = InferSelectModel<typeof form>;

import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

export const FormsList = ({ forms }: { forms: Form[] }) => {
	return (
		<>
			{forms.map((form) => (
				<Link href={`/app/form/${form.id}`} key={form.id}>
					<Card>
						<CardHeader>
							<CardTitle>{form.formDriveName}</CardTitle>
							<CardDescription>Card Description</CardDescription>
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
		</>
	);
};
