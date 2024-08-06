"use client";

import { useFormContext } from "react-hook-form";

import {
	FormControl,
	FormField,
	FormItem,
	FormMessage,
} from "@/components/ui/form";

import { Card, CardContent } from "@/components/ui/card";

import { Input } from "@/components/ui/input";

import { useSelectedItem } from "@/app/hooks/useSelectedItem";

export const FormHeader = () => {
	const { setSelectedItemContent, setSelectedItemId, isSelected } =
		useSelectedItem();

	const { getValues, control } = useFormContext();

	const handleCardClick = () => {
		// Ensures that changes are isolated to the form, not any fields
		setSelectedItemId(getValues("id"));
		const content = getValues();
		setSelectedItemContent({ ...content, sections: [] });
	};

	return (
		<Card
			id={getValues("id")}
			onClick={() => handleCardClick()}
			variant={isSelected(getValues("id")) ? "selected" : "default"}
		>
			<CardContent className="pt-2">
				<FormField
					control={control}
					name="formName"
					render={({ field }) => (
						<FormItem className="">
							<FormControl>
								<Input
									placeholder="New Form"
									className="h-12 px-0 text-2xl"
									variant={"baseline"}
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={control}
					name="formDescription"
					render={({ field }) => (
						<FormItem>
							<FormControl>
								<Input
									placeholder="Description"
									className="h-8 border-b px-0 hover:border-gray-600"
									variant={"baseline"}
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
			</CardContent>
		</Card>
	);
};
