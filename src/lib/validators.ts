import { create } from "domain";
import { form, formFields } from "@/server/db/schema";
import { min } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const withOrgId = z.object({
	orgId: z.string(),
});

// Field options validators
export const textFieldOptions = z.object({
	minLength: z.number().min(0),
	maxLength: z.number().min(1),
});

export const selectOption = z.object({
	positionIndex: z.number().min(0),
	label: z.string(),
});

export const multiSelectFieldOptions = z.object({
	multiSelect: z.boolean(), // Can you select more than one option
	options: z.array(selectOption),
});

// Universal data type stored in the fieldOptions field of the database
// Includes options for all possible fields
export const fieldOptions = z.object({
	options: z.array(selectOption),
});

export type FieldOptions = z.infer<typeof fieldOptions>;

export const defaultFieldOptions: FieldOptions = {
	options: [],
};

export const AddFieldSchema = createInsertSchema(formFields)
	.omit({
		id: true,
	})
	.strict();

export const RemoveFieldSchema = z.object({
	fieldId: z.string(),
});

// Form update schema

const updateFieldSchema = z.object({
	type: z.literal("field"),
	data: createInsertSchema(formFields),
});

const updateFormSchema = z.object({
	type: z.literal("form"),
	data: createInsertSchema(form),
});

const deleteFieldSchema = z.object({
	type: z.literal("delete"),
	data: z.object({
		id: z.string(),
	}),
});

const createFieldSchema = z.object({
	type: z.literal("new"),
	data: createInsertSchema(formFields),
});

export const formUpdateSchema = z.discriminatedUnion("type", [
	updateFieldSchema,
	updateFormSchema,
	deleteFieldSchema,
	createFieldSchema,
]);

// Infer the types from the schemas
type UpdateField = z.infer<typeof updateFieldSchema>;
type UpdateForm = z.infer<typeof updateFormSchema>;
type DeleteField = z.infer<typeof deleteFieldSchema>;
type CreateField = z.infer<typeof createFieldSchema>;

type FormUpdate = UpdateField | UpdateForm | DeleteField | CreateField;

// Type guards
const isUpdateField = (update: FormUpdate): update is UpdateField =>
	update.type === "field";
const isUpdateForm = (update: FormUpdate): update is UpdateForm =>
	update.type === "form";
const isDeleteField = (update: FormUpdate): update is DeleteField =>
	update.type === "delete";
const isCreateField = (update: FormUpdate): update is CreateField =>
	update.type === "new";
