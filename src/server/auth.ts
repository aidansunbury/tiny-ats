import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { google } from "googleapis";
import {
	type DefaultSession,
	type NextAuthOptions,
	getServerSession,
} from "next-auth";
import type { Adapter } from "next-auth/adapters";
import Google from "next-auth/providers/google";

import { env } from "@/env";
import { db } from "@/server/db";
import {
	accounts,
	organizations,
	sessions,
	userOrganizations,
	users,
	verificationTokens,
} from "@/server/db/schema";

import { eq } from "drizzle-orm";

type OrgRelation = {
	userId: string;
	organizationId: string;
	organization: {
		organizationName: string;
		organizationSlug: string;
	};
	role: string;
};

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
	interface Session extends DefaultSession {
		user: {
			id: string;
			googleAccessToken: string;
			organizations: OrgRelation[];
		} & DefaultSession["user"];
	}

	interface User {
		googleAccessToken: string;
		organizations: OrgRelation[];
	}
}

const googleClient = new google.auth.OAuth2({
	clientId: env.GOOGLE_CLIENT_ID,
	clientSecret: env.GOOGLE_CLIENT_SECRET,
});

// Used to include the user's organization roles in the session object.
export function CustomAdapter(
	client: any, //PgDatabase<QueryResultHKT, any>,
	schema?: any, //DefaultPostgresSchema
): Adapter {
	const originalAdapter = DrizzleAdapter(client, schema);

	const customAdapter = {
		...originalAdapter,
		async getSessionAndUser(sessionToken: string) {
			// Todo: turn this into a prepared statement
			const session = await db.query.sessions.findFirst({
				where: (sessions, { eq }) => eq(sessions.sessionToken, sessionToken),
				with: {
					user: {
						with: {
							organizations: {
								with: {
									organization: true,
								},
							},
						},
					},
				},
			});

			if (!session) {
				return null;
			}

			// Check for expired google access token
			if (
				session.user.googleAccessTokenExpires &&
				session.user.googleRefreshToken
			) {
				// Get current time minus 1 minute for buffer
				const now = new Date().getTime() / 1000 - 60;
				if (now > session.user.googleAccessTokenExpires) {
					console.log("google access token expired");
					googleClient.setCredentials({
						refresh_token: session.user.googleRefreshToken,
					});
					const newAccessToken = await googleClient.refreshAccessToken();

					if (newAccessToken.credentials.access_token) {
						db.update(users)
							.set({
								googleAccessToken: newAccessToken.credentials.access_token,
								googleAccessTokenExpires:
									newAccessToken.credentials.expiry_date,
							})
							.where(eq(users.id, session.userId))
							.returning();

						session.user.googleAccessToken =
							newAccessToken.credentials.access_token;
					}
				}
			}

			// Remove sensitive data
			session.user.googleRefreshToken = null;

			const formattedSession = {
				session: {
					sessionToken: session.sessionToken,
					expires: session.expires,
					userId: session.userId,
				},
				user: session.user,
			};

			return formattedSession;
		},
	};

	return customAdapter as any;
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authOptions: NextAuthOptions = {
	callbacks: {
		session: ({ session, user }) => {
			return {
				...session,
				user: {
					...session.user,
					id: user.id,
					googleAccessToken: user.googleAccessToken,
					organizations: user.organizations,
				},
			};
		},
		signIn: async ({ account, user }) => {
			// Store tokens in db
			await db
				.update(users)
				.set({
					googleAccessToken: account?.access_token,
					googleAccessTokenExpires: account?.expires_at,
					googleRefreshToken: account?.refresh_token,
				})
				.where(eq(users.id, user.id))
				.returning();

			return true;
		},
	},
	adapter: CustomAdapter(db, {
		usersTable: users,
		accountsTable: accounts,
		sessionsTable: sessions,
		userOrganizations,
		verificationTokensTable: verificationTokens,
	}) as Adapter,
	providers: [
		Google({
			clientId: env.GOOGLE_CLIENT_ID,
			clientSecret: env.GOOGLE_CLIENT_SECRET,
			authorization: {
				params: {
					scope: [
						"openid email profile",
						"https://www.googleapis.com/auth/drive.file", // Add the Drive scope
					].join(" "),
					prompt: "consent",
					access_type: "offline",
					response_type: "code",
				},
			},
		}),
		/**
		 * ...add more providers here.
		 *
		 * Most other providers require a bit more work than the Discord provider. For example, the
		 * GitHub provider requires you to add the `refresh_token_expires_in` field to the Account
		 * model. Refer to the NextAuth.js docs for the provider you want to use. Example:
		 *
		 * @see https://next-auth.js.org/providers/github
		 */
	],
};

/**
 * Wrapper for `getServerSession` so that you don't need to import the `authOptions` in every file.
 *
 * @see https://next-auth.js.org/configuration/nextjs
 */
export const getServerAuthSession = () => getServerSession(authOptions);
