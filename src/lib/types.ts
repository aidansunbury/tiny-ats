import type { form, formFields, formSections } from "@/server/db/schema";
import type { InferSelectModel } from "drizzle-orm";

export type FormUpdate =
	| { type: "form"; data: InferSelectModel<typeof form> }
	| {
			type: "section";
			data: InferSelectModel<typeof formSections>;
	  }
	| {
			type: "field";
			data: InferSelectModel<typeof formFields>;
	  };
