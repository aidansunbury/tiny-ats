import type { formFieldResponse, formResponse } from "@/server/db/schema";
import type { InferSelectModel } from "drizzle-orm";

import {
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";

import { Card, CardContent } from "@/components/ui/card";
import { ShortenedText } from "./ShortenedText";
import { MultipleChoice } from "./questionComponents/MultipleChoice";

type FiledResponsesWithFormField = InferSelectModel<
	typeof formFieldResponse
> & {
	formField: {
		fieldName: string;
		fieldType: string;
	};
};

type ResponseWithFieldResponses = InferSelectModel<typeof formResponse> & {
	formFieldResponses: FiledResponsesWithFormField[];
};

export const ResponseView = ({
	response,
}: {
	response: ResponseWithFieldResponses;
}) => {
	return (
		<div>
			<AccordionItem value={response.id}>
				<AccordionTrigger>{response.respondentEmail}</AccordionTrigger>
				<AccordionContent>
					<Card className="h-fit w-full">
						<CardContent>
							{response.formFieldResponses.map((fieldResponse) => (
								<div key={fieldResponse.id} className="space-y-1">
									<ShortenedText
										maxLength={50}
										text={fieldResponse.formField.fieldName}
									/>{" "}
									: {fieldResponse.response}
									<MultipleChoice
										response={fieldResponse}
										field={fieldResponse.formField}
									/>
								</div>
							))}
						</CardContent>
					</Card>
				</AccordionContent>
			</AccordionItem>
		</div>
	);
};
