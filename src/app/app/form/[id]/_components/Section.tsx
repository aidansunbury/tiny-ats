import { get } from "http";
import { useSelectedItem } from "@/app/hooks/useSelectedItem";
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { CONSTANTS } from "@/lib/constants";
import { form, type formFields, type formSections } from "@/server/db/schema";
import { api } from "@/trpc/react";
import type { InferSelectModel } from "drizzle-orm";
import { PlusCircleIcon } from "lucide-react";
import { useFieldArray } from "react-hook-form";
import type { Control } from "react-hook-form";
import { useFormContext } from "react-hook-form";
import type { FormData } from "./FormViewer";
import { InputWrapper } from "./InputWrapper";
import ResponsiveToolbar from "./Toolbar/StaticToolbar";

type Section = InferSelectModel<typeof formSections> & {
	fields: InferSelectModel<typeof formFields>[];
};

export const Section = ({
	section,
	control,
	index,
}: {
	section: Section;
	control: Control<FormData, any>;
	index: number;
}) => {
	const fields = useFieldArray({
		control: control,
		name: `sections.${index}.fields`,
	});

	const { getValues } = useFormContext<FormData>();

	const {
		selectedItemId,
		selectedItemContent,
		queue,
		queueNewField,
		queueDeletion,
		submitQueue,
		updateQueueAfterSuccess,
	} = useSelectedItem();

	// Append a new field to the section, index it between fields it is between
	// And assign a temporary id to indicate to the server that it is a new field
	const handleCopy = (name: string, index: number) => {
		const priorField = section.fields[index];
		const nextField = section.fields[index + 1] || null;
		let newPositionIndex = 0;
		if (!priorField) {
			// lol
		} else if (!nextField) {
			newPositionIndex =
				priorField.positionIndex + CONSTANTS.FORM_POSITION_INCREMENT;
		} else {
			newPositionIndex =
				(priorField.positionIndex + nextField.positionIndex) / 2;
		}
		const newField = {
			...getValues(name as any),
			id: `field_${crypto.randomUUID()}`,
			positionIndex: newPositionIndex,
		};

		fields.insert(index + 1, newField);
		queueNewField(newField);
	};

	const handleAppend = () => {
		const lastField = section.fields[section.fields.length - 1];

		const newField = {
			id: `field_${crypto.randomUUID()}`,
			fieldName: "New Field",
			fieldType: "text",
			required: false,
			positionIndex: lastField ? lastField.positionIndex + 1000 : 0,
			fieldDescription: "",
			fieldOptions: {
				options: [],
			},
			sectionId: section.id,
			formId: section.formId,
		};

		fields.append(newField);
		queueNewField(newField);
	};

	const handleDelete = (name: string, fieldIndex: number) => {
		const id = getValues(name as any).id;
		fields.remove(fieldIndex);
		queueDeletion(id);
	};

	const submit = api.form.updateForm.useMutation();

	const handleSubmit = async () => {
		console.log(queue);
		submitQueue();
		await submit.mutate(queue);
		// Artificial 3 second delay
		await new Promise((resolve) => setTimeout(resolve, 3000));
		updateQueueAfterSuccess();
		// console.log(submit.data);
	};

	return (
		// Todo fix key issue on this line
		<div>
			{/* <h1 className="pb-5">{section.sectionName}</h1> */}
			{/* {JSON.stringify(selectedItemContent)} */}
			{/* {JSON.stringify(selectedItemId)} */}
			{JSON.stringify(queue)}
			{fields.fields.map((field, fieldIndex) => (
				<>
					{/* <div>{JSON.stringify(field)}</div> */}
					<InputWrapper
						name={`sections.${index}.fields.${fieldIndex}`}
						control={control}
						field={field}
						key={field.id}
						onDelete={() =>
							handleDelete(`sections.${index}.fields.${fieldIndex}`, fieldIndex)
						}
						onCopy={() =>
							handleCopy(`sections.${index}.fields.${fieldIndex}`, fieldIndex)
						}
					/>
				</>
			))}
			<Button onClick={() => handleSubmit()}>Submit to server</Button>
			<ResponsiveToolbar>
				<Tooltip>
					<TooltipTrigger>
						<Button
							variant={"ghost"}
							size={"iconWrap"}
							asChild
							onClick={() => handleAppend()}
						>
							<PlusCircleIcon size={24} />
						</Button>
					</TooltipTrigger>
					<TooltipContent>
						<h1>Add Field</h1>
					</TooltipContent>
				</Tooltip>
				{/* <Button variant={"ghost"} size={"iconWrap"}>
          <PlusCircleIcon size={24} />
        </Button>
        <Button variant={"ghost"} size={"iconWrap"}>
          <PlusCircleIcon size={24} />
        </Button> */}
			</ResponsiveToolbar>
		</div>
	);
};
