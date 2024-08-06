"use client";

import { signIn } from "next-auth/react";

export const SignInButton = ({ redirect }: { redirect?: string }) => {
	if (redirect) {
		return (
			<button onClick={() => signIn("google", { callbackUrl: redirect })}>
				Sign in with Google
			</button>
		);
	}

	return <button onClick={() => signIn("google")}>Sign in with Google</button>;
};
