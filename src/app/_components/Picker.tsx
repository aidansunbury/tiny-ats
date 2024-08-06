"use client";
import { env } from "@/env";
import { api } from "@/trpc/react";
import { useSession } from "next-auth/react";
import useDrivePicker from "react-google-drive-picker";

export default function Picker({ token }: { token: string | undefined }) {
	const [openPicker, authResponse] = useDrivePicker();
	const session = useSession();

	const handleOpenPicker = () => {
		openPicker({
			clientId: env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
			developerKey: "",
			viewId: "FORMS",
			setOrigin: "http://localhost:3000",
			appId: env.NEXT_PUBLIC_GOOGLE_APP_ID,

			token: token, // pass oauth token in case you already have one
			showUploadView: false,
			showUploadFolders: false,
			supportDrives: true,
			// setIncludeFolders: true,
			// setSelectFolderEnabled: true,

			multiselect: true,
			// customViews: customViewsArray, // custom view
			callbackFunction: (data) => {
				if (data.action === "cancel") {
					console.log("User clicked cancel/close button");
				}
				console.log(data);
			},
		});
	};
	return <button onClick={() => handleOpenPicker()}>Open Picker</button>;
}
