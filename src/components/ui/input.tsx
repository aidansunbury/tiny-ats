import * as React from "react";

import { cn } from "@/lib/utils";

import { type VariantProps, cva } from "class-variance-authority";

const inputVariants = cva(
	"flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
	{
		variants: {
			variant: {
				default: "",
				baseline:
					"focus-ring-0 m-1 h-12 rounded-none border-0 border-b-2 border-solid outline-none hover:border-gray-900 focus-visible:ring-0",
				baselineDisabled:
					"focus-ring-0 m-1 h-12 rounded-none border-0 border-b-2 border-dashed outline-none focus-visible:ring-0 disabled:cursor-default disabled:opacity-100",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	},
);

export interface InputProps
	extends React.InputHTMLAttributes<HTMLInputElement>,
		VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
	({ className, type, variant, ...props }, ref) => {
		return (
			<input
				type={type}
				className={cn(inputVariants({ variant, className }))}
				ref={ref}
				{...props}
			/>
		);
	},
);
Input.displayName = "Input";

export { Input };
