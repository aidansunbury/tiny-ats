import { Input } from "@/components/ui/input";

export const TextInput = () => {
	return (
		<div>
			<Input
				placeholder="Short answer text"
				disabled
				variant={"baselineDisabled"}
				className="cursor-default"
			/>
		</div>
	);
};
