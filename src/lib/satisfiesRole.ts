import type { roleEnum } from "@/server/db/schema";

type Role = (typeof roleEnum.enumValues)[number];

const roleHierarchy: Role[] = ["member", "reviewer", "admin"];

export function satisfiesRole(role: Role, requiredRole: Role): boolean {
	const roleIndex = roleHierarchy.indexOf(role);
	const requiredRoleIndex = roleHierarchy.indexOf(requiredRole);

	if (roleIndex === -1 || requiredRoleIndex === -1) {
		throw new Error("Invalid role provided");
	}

	return roleIndex >= requiredRoleIndex;
}
