import type { Session } from "next-auth";
import { redirect } from "next/navigation";

export const loggedIn = async (
	session: Session | null,
	redirectTo?: string,
) => {
	if (!session) {
		return redirect(redirectTo || "/");
	}
};

export const orgMember = async (
	session: Session | null,
	orgSlug: string,
	redirectTo?: string,
) => {
	if (!session) {
		return redirect("/");
	}
	const org = session?.user.organizations.find(
		(org) => org.organization.organizationSlug === orgSlug,
	);
	if (!org) {
		return redirect("/home" || redirectTo);
	}
	return org;
};

export const orgRoleRequired = async (
	session: Session,
	orgSlug: string,
	role: string,
	redirectTo?: string,
) => {};
