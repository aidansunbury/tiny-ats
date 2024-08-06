import { Circle, CircleCheck } from "lucide-react";

import type { formFieldResponse, formFields } from "@/server/db/schema";
import type { InferSelectModel } from "drizzle-orm";
import { ShortenedText } from "../ShortenedText";

export const MultipleChoice = ({
	response,
	field,
}: {
	response: InferSelectModel<typeof formFieldResponse>;
	field: InferSelectModel<typeof formFields>;
}) => {
	if (field.fieldOptions.optionType !== "multipleChoice") {
		return null;
	}

	const renderOption = (option: string, response: string[]) => {
		if (response.includes(option)) {
			return (
				<div className="flex flex-row items-center">
					<CircleCheck />
					<ShortenedText text={option} maxLength={20} />
				</div>
			);
		} else {
			return (
				<div className="flex flex-row items-center">
					<Circle />
					<ShortenedText text={option} maxLength={20} />
				</div>
			);
		}
	};

	return (
		<div className="flex flex-row">
			<ShortenedText text={field.fieldName} maxLength={50} />

			{field.fieldOptions.options.map((option) =>
				renderOption(option, response.response || []),
			)}
		</div>
	);
};
