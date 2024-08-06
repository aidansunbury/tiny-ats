import type React from "react";

import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";

type TextWrapperProps = {
	children: React.ReactNode;
};

type ShortenedTextProps = {
	text: string;
	maxLength: number;
	TextWrapper?: React.ComponentType<TextWrapperProps>;
};

export const ShortenedText: React.FC<ShortenedTextProps> = ({
	text,
	maxLength,
	TextWrapper = ({ children }) => <span>{children}</span>,
}) => {
	if (text.length <= maxLength) {
		return <TextWrapper>{text}</TextWrapper>;
	}
	const shortenedText = `${text.slice(0, maxLength)}...`;
	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger>
					<TextWrapper>{shortenedText}</TextWrapper>
				</TooltipTrigger>
				<TooltipContent className="max-w-64">
					<TextWrapper>{text}</TextWrapper>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
};

// Example usage
// Using custom h1 wrapper
// biome-ignore lint/complexity/noUselessLoneBlockStatements: <example usage>
{
	/* <ShortenedText 
  text="Long text here" 
  maxLength={10} 
  TextWrapper={({ children }) => <h1 className="font-bold">{children}</h1>} 
/> */
}
