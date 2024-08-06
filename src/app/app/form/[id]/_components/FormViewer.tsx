"use client";

import {
	FormProvider,
	useFieldArray,
	useForm,
	useFormContext,
} from "react-hook-form";

import type { form, formFields, formSections } from "@/server/db/schema";
import type { InferSelectModel } from "drizzle-orm";
import { InputWrapper } from "./InputWrapper";

import { Form } from "@/components/ui/form";

import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Section } from "./Section";

import {
	SelectedItemProvider,
	useSelectedItem,
} from "@/app/hooks/useSelectedItem";
import { Toolbar } from "./Toolbar/DynamicToolbar";

import { useEffect } from "react";
import { set } from "zod";

import { FormHeader } from "./FormHeader";

// Complete form selection type
export type FormData = InferSelectModel<typeof form> & {
	sections: Array<
		InferSelectModel<typeof formSections> & {
			fields: InferSelectModel<typeof formFields>[];
		}
	>;
};

type FormUpdate =
	| { type: "form"; data: InferSelectModel<typeof form> }
	| {
			type: "section";
			data: InferSelectModel<typeof formSections>;
	  }
	| {
			type: "field";
			data: InferSelectModel<typeof formFields>;
	  };

const findById = (id: string, data: FormData): FormUpdate | null => {
	if (id.includes("form")) {
		return {
			type: "form",
			data: { ...data, sections: [] } as any,
		};
	} else if (id.includes("section")) {
		const section = data.sections.find((section) => section.id === id);
		if (!section) {
			return null;
		}
		return {
			type: "section",
			data: { ...section },
		};
	} else if (id.includes("field")) {
		console.log("field");
		for (const section of data.sections) {
			const field = section.fields.find((field) => field.id === id);
			if (field) {
				return {
					type: "field",
					data: { ...field },
				};
			}
		}
		return null;
	}
	return null;
};

export const FormViewer = ({ formData }: { formData: FormData }) => {
	const form = useForm<FormData>({
		defaultValues: formData,
	});

	const { fields, append } = useFieldArray({
		control: form.control,
		name: "sections",
	});

	const onSubmit = (data: FormData) => {
		console.log(data);
	};

	return (
		<div className="w-full max-w-[800px] self-center">
			<FormProvider {...form}>
				{/* <SelectedLogger /> */}
				<Form {...form}>
					<SelectedItemProvider
						captureState={(id) => findById(id, form.getValues())}
					>
						<form onSubmit={form.handleSubmit(onSubmit)}>
							<FormHeader />
							<div>
								{fields.map((section, index) => (
									<Section
										key={section.id}
										section={section}
										control={form.control}
										index={index}
									/>
								))}
								<Button type="submit" className="mb-24 lg:mb-16">
									Submit
								</Button>
							</div>
						</form>
					</SelectedItemProvider>
				</Form>
			</FormProvider>
		</div>
	);
};
