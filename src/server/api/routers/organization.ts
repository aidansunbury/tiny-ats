import { z } from "zod";

import {
	createTRPCRouter,
	orgScopedProcedure,
	protectedProcedure,
} from "@/server/api/trpc";

import { withOrgId } from "@/lib/validators";
import { db } from "@/server/db";
import { organizations, userOrganizations } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export const orgRouter = createTRPCRouter({
	create: protectedProcedure
		.input(withOrgId.extend({ organizationName: z.string() }))
		.mutation(async ({ input, ctx }) => {
			try {
				const createOrg = await db.transaction(async (trx) => {
					const slug = input.organizationName.toLowerCase().replace(" ", "-");

					const [newOrg] = await trx
						.insert(organizations)
						.values({
							organizationName: input.organizationName,
							organizationSlug: slug,
						})
						.returning();

					if (!newOrg) {
						throw new Error("Failed to create organization");
					}

					// Add the user to the org as an admin
					const newRole = await trx
						.insert(userOrganizations)
						.values({
							userId: ctx.session.user.id,
							organizationId: newOrg.id,
							role: "admin",
						})
						.returning();

					if (!newRole) {
						throw new Error("Failed to add user to organization");
					}

					return newOrg;
				});

				return createOrg;
			} catch (error) {
				console.log(error);
				return error;
			}
		}),
	getOrgWithForms: orgScopedProcedure("member")
		.input(withOrgId)
		.query(async ({ input }) => {
			const org = await db.query.organizations.findFirst({
				where: (organization, { eq }) => eq(organization.id, input.orgId),
				with: {
					forms: true,
				},
			});

			if (!org) {
				throw new Error("Organization not found");
			}

			return org;
		}),
});
