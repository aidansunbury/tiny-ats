"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { env } from "@/env";
import { api } from "@/trpc/react";
import { FileDown } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import useDrivePicker from "react-google-drive-picker";
import { SpinnerCircularFixed } from "spinners-react";

export const ImportForm = () => {
	const { data } = useSession();
	const { toast } = useToast();
	const router = useRouter();
	const [openPicker, authResponse] = useDrivePicker();
	const {
		data: syncedData,
		isPending,
		isSuccess,
		mutate: syncForm,
	} = api.form.syncForm.useMutation();

	const handleOpenPicker = () => {
		openPicker({
			clientId: env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
			developerKey: "",
			viewId: "FORMS",
			viewMimeTypes: "application/vnd.google-apps.form",
			setOrigin: "http://localhost:3000",
			appId: env.NEXT_PUBLIC_GOOGLE_APP_ID,

			token: data?.user.googleAccessToken,
			showUploadView: false,
			showUploadFolders: false,
			supportDrives: true,
			multiselect: false, // Todo support bulk import

			// setIncludeFolders: true,
			// setSelectFolderEnabled: true,
			// customViews: customViewsArray,
			callbackFunction: (data) => {
				if (data.action === "cancel") {
					console.log("User clicked cancel/close button");
				} else if (
					data.action === "picked" &&
					data.docs[0]?.mimeType !== "application/vnd.google-apps.form"
				) {
					console.log("Invalid file type");
				} else if (data.docs[0]) {
					const fileId = data.docs[0].id;
					syncForm(
						{ formId: fileId, initialSync: true },
						{
							onSuccess: ({ id }) => {
								toast({
									variant: "success",
									title: "Form synced successfully",
									description: "Redirecting to form",
								});
								router.push(`/app/form/${id}`);
							},
							onError: (error) => {
								toast({
									variant: "destructive",
									title: "Error syncing form",
									description: error.message,
								});
							},
						},
					);
				}
			},
		});
	};

	return (
		<Card onClick={() => handleOpenPicker()}>
			<CardHeader>
				<CardTitle>Import New Form</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="flex justify-center text-center">
					{isPending ? (
						<SpinnerCircularFixed
							color="rgb(2,8,23)"
							secondaryColor="rgb(100,116,139)"
						/>
					) : (
						<FileDown size={80} />
					)}
				</div>
			</CardContent>
		</Card>
	);
};
