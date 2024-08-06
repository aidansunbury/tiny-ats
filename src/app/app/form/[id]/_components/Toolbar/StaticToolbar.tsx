import type React from "react";

const ResponsiveToolbar = ({ children }: { children: React.ReactNode }) => {
	return (
		<div className="fixed bottom-4 left-1/2 z-50 flex w-[300px] -translate-x-1/2 flex-row items-center justify-around overflow-visible rounded-lg border-2 border-gray-300 bg-white p-3 shadow-xl lg:bottom-auto lg:left-auto lg:right-4 lg:top-1/2 lg:h-[300px] lg:w-16 lg:-translate-x-0 lg:-translate-y-1/2 lg:flex-col lg:items-center lg:justify-between lg:py-8 lg:shadow-2xl">
			{" "}
			{children}
		</div>
	);
};

export default ResponsiveToolbar;
