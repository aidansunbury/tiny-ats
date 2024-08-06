"use client";

import { Home, PanelLeft, ShoppingCart } from "lucide-react";
import Link from "next/link";

import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";

import { SessionProvider, signOut, useSession } from "next-auth/react";

const AvatarIcon = () => {
	const session = useSession();
	if (!session.data) {
		return null;
	}

	return (
		<Avatar>
			<AvatarImage src={session.data.user.image || ""} />
			<AvatarFallback>CN</AvatarFallback>
		</Avatar>
	);
};

export default function AppLayout({
	children,
	params,
}: Readonly<{ children: React.ReactNode; params: any }>) {
	// const session = await getSession();
	// if (!session) {
	//   return null;
	// }

	// Todo convert the breadcrumbs into a client component
	// const router = usePathname();
	// const segments = router.split("/").slice(1);
	// const session = useSession();
	return (
		<TooltipProvider>
			<SessionProvider>
				<div className="flex min-h-screen w-full flex-col bg-muted/40">
					<aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
						<nav className="mt-12 flex flex-col items-center gap-4 px-2 sm:py-5">
							<Tooltip>
								<TooltipTrigger asChild>
									<Link
										href="/app/dashboard"
										className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8"
									>
										<Home className="h-5 w-5" />
										<span className="sr-only">Home</span>
									</Link>
								</TooltipTrigger>
								<TooltipContent side="right">Dashboard</TooltipContent>
							</Tooltip>
						</nav>
					</aside>

					<div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
						<header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
							{/* Expandable navbar */}

							<Sheet>
								<SheetTrigger asChild>
									<Button size="icon" variant="outline" className="sm:hidden">
										<PanelLeft className="h-5 w-5" />
										<span className="sr-only">Toggle Menu</span>
									</Button>
								</SheetTrigger>
								<SheetContent side="left" className="sm:max-w-xs">
									<nav className="grid gap-6 text-lg font-medium">
										<Link
											href="#"
											className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
										>
											<Home className="h-5 w-5" />
											Dashboard
										</Link>
										<Link
											href="#"
											className="flex items-center gap-4 px-2.5 text-foreground"
										>
											<ShoppingCart className="h-5 w-5" />
											Orders
										</Link>
									</nav>
								</SheetContent>
							</Sheet>

							{/* Breadcrumbs */}
							{/* <Breadcrumb className="hidden md:flex">
              <BreadcrumbList>
                {segments.map((segment, index) => (
                  <>
                    <BreadcrumbItem key={index}>
                      <BreadcrumbLink
                        href={`/${segments.slice(0, index + 1).join("/")}`}
                      >
                        {segment}
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    {index < segments.length - 1 && <BreadcrumbSeparator />}
                  </>
                ))}
              </BreadcrumbList>
            </Breadcrumb> */}

							{/* Avatar */}
							<div className="relative ml-auto flex-1 grow-0">
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button
											variant="outline"
											size="icon"
											className="overflow-hidden rounded-full"
										>
											<AvatarIcon />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end">
										<DropdownMenuLabel>My Account</DropdownMenuLabel>
										<DropdownMenuSeparator />
										<DropdownMenuItem>Settings</DropdownMenuItem>
										<DropdownMenuItem>Support</DropdownMenuItem>
										<DropdownMenuSeparator />
										<DropdownMenuItem
											onClick={() =>
												signOut({ redirect: true, callbackUrl: "/" })
											}
										>
											Logout
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</div>
						</header>
						<main className="flex px-2">{children}</main>
					</div>
				</div>
			</SessionProvider>
		</TooltipProvider>
	);
}
