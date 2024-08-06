"use client";

import {
	NavigationMenu,
	NavigationMenuContent,
	NavigationMenuIndicator,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
	NavigationMenuTrigger,
	NavigationMenuViewport,
	navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import Link from "next/link";

import { usePathname, useRouter } from "next/navigation";
import { Form } from "react-hook-form";

export const FormNav = () => {
	const path = usePathname();
	const basePath = path.split("/").slice(0, 4).join("/");
	const currentPath = path.split("/")[4];

	const getStyles = (route: string) => {
		if (route === currentPath) {
			return navigationMenuTriggerStyle() + " ring-2";
		}
		return navigationMenuTriggerStyle();
	};

	return (
		<NavigationMenu>
			<NavigationMenuList>
				<NavigationMenuItem>
					<Link href={`${basePath}/questions`} legacyBehavior passHref>
						<NavigationMenuLink className={getStyles("questions")}>
							Questions
						</NavigationMenuLink>
					</Link>
				</NavigationMenuItem>
				<NavigationMenuItem>
					<Link href={`${basePath}/responses`} legacyBehavior passHref>
						<NavigationMenuLink className={getStyles("responses")}>
							Responses
						</NavigationMenuLink>
					</Link>
				</NavigationMenuItem>
			</NavigationMenuList>
		</NavigationMenu>
	);
};
