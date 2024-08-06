import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function getEditFormUrl(id: string) {
	return `https://docs.google.com/forms/d/${id}/edit`;
}
