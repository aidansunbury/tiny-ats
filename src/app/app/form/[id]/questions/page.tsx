"use client";

import { api } from "@/trpc/react";
import React from "react";

const Questions = async ({ params }: { params: { id: string } }) => {
	const form = await api.form.getFormByFields.useSuspenseQuery({
		formId: params.id,
	});

	return (
		<div>
			<h1>Questions </h1>
		</div>
	);
};
export default Questions;
