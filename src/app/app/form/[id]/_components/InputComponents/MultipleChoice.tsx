"use client";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type React from "react";
import { useEffect, useRef } from "react";

import { Circle, X } from "lucide-react";

import { useFieldArray } from "react-hook-form";

import type { formFields } from "@/server/db/schema";
import type { InferSelectModel } from "drizzle-orm";
import { type Control, type Path, useFormContext } from "react-hook-form";

import {
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import type { FormData } from "../FormViewer";

import { fieldOptions, multiSelectFieldOptions } from "@/lib/validators";

type MultipleChoiceProps = {
	control: Control<FormData, any>;
	name: Path<FormData>;
	field: InferSelectModel<typeof formFields>;
};

export const MultipleChoice = ({
	control,
	name,
	field,
}: MultipleChoiceProps) => {
	// Ensure that data is parsed correctly
	fieldOptions.parse(field.fieldOptions);

	const { fields, append, remove } = useFieldArray({
		control,
		name: `${name}.fieldOptions.options` as any,
	});

	if (fields.length === 0) {
		append({ label: "New Option", positionIndex: 0 });
	}

	const handleKeyDown = (
		e: React.KeyboardEvent<HTMLInputElement>,
		index: number,
		prevIndex: number,
	) => {
		if (e.key === "Enter") {
			e.preventDefault();
			// Todo this needs some position indexing when we get to moving them around
			append({ label: "New Option", positionIndex: prevIndex + 1000 });
			//   e.currentTarget.value = "";
		} else if (e.key === "Backspace" && e.currentTarget.value === "") {
			e.preventDefault();
			if (fields.length === 1) return;
			remove(index);
		}
	};

	const lastInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (lastInputRef.current) {
			lastInputRef.current.focus();
		}
	}, [fields]);

	return (
		<>
			{/* {JSON.stringify(field.fieldOptions.options)} */}
			{fields.map((option, index) => (
				<div className="flex flex-row items-center" key={option.id}>
					<Circle size={24} />
					<FormField
						control={control}
						name={`${name}.fieldOptions.options.${index}.label` as any}
						render={({ field }) => (
							<FormItem className="w-full">
								<FormControl>
									<Input
										{...field}
										ref={index === fields.length - 1 ? lastInputRef : null}
										className="focus-ring-0 m-1 h-12 rounded-none border-0 border-b-2 border-solid outline-none hover:border-gray-900 focus-visible:ring-0"
										onKeyDown={(e) =>
											handleKeyDown(e, index, option.positionIndex)
										}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<Button
						variant="ghost"
						className="m-1"
						size="iconWrap"
						onClick={() => remove(index)}
					>
						<X size={24} />
					</Button>
				</div>
			))}
			{/* Add option */}
		</>
	);
};
