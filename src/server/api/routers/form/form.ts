import { create } from "domain";
import { z } from "zod";

import {
	createTRPCRouter,
	orgScopedProcedure,
	protectedProcedure,
	publicProcedure,
} from "@/server/api/trpc";

import { db } from "@/server/db";
import {
	form,
	formFieldResponse,
	formFields,
	formResponse as formResponseDBSchema,
} from "@/server/db/schema";
import { TRPCError } from "@trpc/server";
import {
	type InferInsertModel,
	type InferSelectModel,
	asc,
	eq,
} from "drizzle-orm";

import { env } from "@/env";
import { google } from "googleapis";
import { getQuestionOptions, getQuestionTypeAndData } from "./formHelpers";

import { logger } from "../../utils/logger";

// Question group items are the "checkbox grid" type of question

export const formRouter = createTRPCRouter({
	// Does not return the form fields, designed for the form list view
	getMyForms: protectedProcedure.query(async ({ ctx }) => {
		const forms = await db.query.form.findMany({
			where: (form) => eq(form.ownerId, ctx.session.user.id),
		});
		return forms;
	}),

	// Form > FormFields > FormFieldResponses
	getFormByFields: protectedProcedure
		.input(z.object({ formId: z.string() }))
		.query(async ({ input }) => {
			const retrievedForm = await db.query.form.findFirst({
				where: eq(form.id, input.formId),
				with: {
					formFields: {
						with: {
							formFieldResponses: true,
						},
						orderBy: asc(formFields.positionIndex),
					},
				},
			});
			if (!retrievedForm) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: `Form with id ${input.formId} not found`,
				});
			}
			return retrievedForm;
		}),

	// Form > Responses > FormFieldResponses > FormField
	getFormByResponses: protectedProcedure
		.input(z.object({ formId: z.string() }))
		.query(async ({ input }) => {
			const retrievedForm = await db.query.form.findFirst({
				where: eq(form.id, input.formId),
				with: {
					formResponses: {
						with: {
							formFieldResponses: {
								with: {
									formField: {
										columns: {
											fieldName: true,
											fieldType: true,
											fieldOptions: true,
											positionIndex: true,
										},
									},
								},
								orderBy: asc(formFieldResponse.parentPositionIndex),
							},
						},
					},
				},
			});
			if (!retrievedForm) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: `Form with id ${input.formId} not found`,
				});
			}
			return retrievedForm;
		}),

	// Todo Make sure does not error if incorrect value passed for initialSync
	syncForm: protectedProcedure
		.input(
			z.object({
				formId: z.string(),
				initialSync: z.boolean(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// 1. Fetch form from google
			const client = new google.auth.OAuth2({
				clientId: env.GOOGLE_CLIENT_ID,
				clientSecret: env.GOOGLE_CLIENT_SECRET,
			});

			let formOwner;
			let responseAfterTimestamp = new Date(0).toISOString();

			if (input.initialSync) {
				formOwner = await ctx.db.query.users.findFirst({
					where: (user) => eq(user.id, ctx.session.user.id),
				});
				if (!formOwner) {
					throw new TRPCError({
						code: "INTERNAL_SERVER_ERROR",
						message: `User with id ${ctx.session.user.id} not found`,
					});
				}
			} else {
				const form = await db.query.form.findFirst({
					where: (form) => eq(form.googleFormId, input.formId),
					with: {
						owner: true,
					},
				});
				if (!form || !form.owner) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: `Form with id ${input.formId} not found or has no owner`,
					});
				}

				responseAfterTimestamp = form.lastSyncedTimestamp.toISOString();
				formOwner = form.owner;
			}
			client.setCredentials({
				access_token: formOwner.googleAccessToken,
				refresh_token: formOwner.googleRefreshToken,
			});

			const forms = google.forms({ version: "v1", auth: client });

			logger.debug(`Getting responses after ${responseAfterTimestamp}`);

			// todo remove me, just for testing
			responseAfterTimestamp = new Date(0).toISOString();
			const formResponsesPromise = forms.forms.responses.list({
				formId: input.formId,
				filter: `timestamp >= ${responseAfterTimestamp}`,
			});

			const formResponseFromGoogle = await forms.forms.get({
				formId: input.formId,
			});

			if (!formResponseFromGoogle.data) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: `Form with google id ${input.formId} not found`,
				});
			}

			const result = await db.transaction(async (trx) => {
				// 2. Update the form information

				const formData: InferInsertModel<typeof form> = {
					googleFormId: input.formId,
					formName: formResponseFromGoogle.data.info?.title ?? "Untitled Form",
					formDriveName:
						formResponseFromGoogle.data.info?.documentTitle ?? "Untitled Form",
					formDescription: formResponseFromGoogle.data.info?.description ?? "",
					ownerId: formOwner.id,
					lastSyncedTimestamp: new Date(),
				};

				const [updatedForm] = await trx
					.insert(form)
					.values(formData)
					.onConflictDoUpdate({
						target: form.googleFormId,
						set: {
							formName:
								formResponseFromGoogle.data.info?.documentTitle ??
								"Untitled Form",
							formDriveName:
								formResponseFromGoogle.data.info?.title ?? "Untitled Form",
							formDescription:
								formResponseFromGoogle.data.info?.description ?? "",
							lastSyncedTimestamp: new Date(),
						},
					})
					.returning();

				if (!updatedForm) {
					throw new TRPCError({
						code: "INTERNAL_SERVER_ERROR",
						message: "Failed to update form",
					});
				}

				const formId = updatedForm.id;

				// 3. Sync the form fields
				// we need to be able to handle deletes anyways so just fetch all the fields

				const fieldWrites: Promise<InferSelectModel<typeof formFields>[]>[] =
					[];

				for (const [index, field] of (
					formResponseFromGoogle.data.items ?? []
				).entries()) {
					if (field.questionGroupItem && field.questionGroupItem.grid) {
						// Handle grid questions
						let subIndex = 0;
						for (const question of field.questionGroupItem.questions ?? []) {
							const fieldData: InferInsertModel<typeof formFields> = {
								googleItemId: field.itemId,
								googleQuestionId: question.questionId,
								fieldName: question.rowQuestion?.title || "Unnamed Field",
								fieldType: "grid",
								required: question.required || false,
								formId,
								positionIndex: index,
								positionSubIndex: subIndex,
								// Todo parse grid correctly
								fieldOptions: field.questionGroupItem.grid,
							};

							const newField = trx
								.insert(formFields)
								.values(fieldData)
								.onConflictDoUpdate({
									target: formFields.googleQuestionId,
									set: fieldData,
								})
								.returning();
							subIndex++;
							fieldWrites.push(newField);
						}
						continue;
					} else if (field.questionItem && field.questionItem.question) {
						// Parse question type and options
						const question = field.questionItem.question;
						const { type: questionType, options } =
							getQuestionTypeAndData(question);

						// Create a new field
						const fieldData: InferInsertModel<typeof formFields> = {
							googleItemId: field.itemId,
							googleQuestionId: field.questionItem.question.questionId,
							fieldName: field.title ?? "Untitled Field",
							fieldType: questionType,
							fieldOptions: getQuestionOptions(questionType, options),
							formId,
							positionIndex: index,
						};

						const newField = trx
							.insert(formFields)
							.values(fieldData)
							.onConflictDoUpdate({
								target: formFields.googleQuestionId,
								set: fieldData,
							})
							.returning();

						fieldWrites.push(newField);
					}
				}

				const updatedFields = await Promise.all(fieldWrites);
				if (!updatedFields[0]) {
					throw new TRPCError({
						code: "INTERNAL_SERVER_ERROR",
						message: "Failed to fetch form fields",
					});
				}

				const fieldMap: Record<string, number> = {};
				updatedFields.forEach((field) => {
					if (
						!field[0] ||
						!field[0].googleQuestionId ||
						!field[0].positionIndex
					) {
						return;
					}
					fieldMap[field[0].googleQuestionId] = field[0].positionIndex;
				});

				logger.debug(`Updated ${updatedFields.length} fields`);

				// 4. Sync the form responses
				const formResponses = await formResponsesPromise;

				if (!formResponses.data) {
					throw new TRPCError({
						code: "INTERNAL_SERVER_ERROR",
						message: "Failed to fetch form responses",
					});
				}

				const responses = formResponses.data.responses ?? [];

				logger.debug(
					`Fetched ${responses.length} responses submitted after ${responseAfterTimestamp}`,
				);

				const responsePromises = responses.map(async (response) => {
					const updateData: InferInsertModel<typeof formResponseDBSchema> = {
						googleResponseId: response.responseId,
						formId,
						respondentEmail: response.respondentEmail,
					};

					const [createdResponse] = await trx
						.insert(formResponseDBSchema)
						.values(updateData)
						.onConflictDoUpdate({
							target: [
								formResponseDBSchema.googleResponseId,
								formResponseDBSchema.formId,
							],
							set: updateData,
						})
						.returning();

					if (!createdResponse) {
						throw new TRPCError({
							code: "INTERNAL_SERVER_ERROR",
							message: `Failed to create response with google id ${response.responseId} for form ${formId}`,
						});
					}
					logger.debug(`Created/Updated response ${createdResponse.id}`);

					if (!response.answers) {
						return;
					}

					// Sync the answers in a given response
					const answerPromises = Object.entries(response.answers).map(
						async ([questionId, responseData]) => {
							// console.log(fieldMap.get(questionId));

							const data: InferInsertModel<typeof formFieldResponse> = {
								formResponseId: createdResponse.id,
								parentPositionIndex: fieldMap[questionId] ?? 0,
								formFieldId: questionId,
								googleQuestionId: questionId,
								response: null,
								fileResponse: null,
							};

							if (responseData.fileUploadAnswers) {
								// Handle file upload response
								data.fileResponse =
									responseData.fileUploadAnswers.answers ?? [];
							} else if (responseData.textAnswers) {
								if (typeof responseData.textAnswers.answers === "string") {
									data.response = [responseData.textAnswers.answers];
								} else if (responseData.textAnswers.answers !== undefined) {
									data.response = responseData.textAnswers.answers.map(
										(answer) => answer.value || "",
									);
								}
							}
							const [createdFieldResponse] = await trx
								.insert(formFieldResponse)
								.values(data)
								.onConflictDoUpdate({
									target: [
										formFieldResponse.googleQuestionId,
										formFieldResponse.formResponseId,
									],
									set: data,
								})
								.returning();
							return createdFieldResponse;
						},
					);

					// Await all the answer updates concurrently for this response
					const result = await Promise.all(answerPromises);
					logger.debug(
						`Updated ${result.length} answers for response ${createdResponse.id}`,
					);
				});

				// Await all the response updates concurrently
				const result = await Promise.all(responsePromises);
				logger.debug(`Updated ${result.length} responses for form ${formId}`);

				return updatedForm;
			});
			return result;
		}),
	getFile: protectedProcedure
		.input(z.object({ fileId: z.string() }))
		.query(async ({ ctx, input }) => {
			const client = new google.auth.OAuth2({
				clientId: env.GOOGLE_CLIENT_ID,
				clientSecret: env.GOOGLE_CLIENT_SECRET,
			});

			// Todo this eventually needs to be the existing owner
			const userToken = await ctx.db.query.users.findFirst({
				where: (user) => eq(user.id, ctx.session.user.id),
			});

			console.log(userToken);

			if (!userToken) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "User not found",
				});
			}

			client.setCredentials({
				access_token: userToken.googleAccessToken,
				refresh_token: userToken.googleRefreshToken,
			});

			// 1s22lrekgOnAYoUzgT84oo-qn1WakVT20

			// folder: 1LY2gfwPV1PmXdg9DYNDFiii6b02GpKXZZHS1WhYYR8eWJnMx6y7izgFVr4h5MsT4XCn-UrDQ

			// Fetch the file from google
			const drive = google.drive({ version: "v3", auth: client });
			const fileResponse = await drive.files.get({ fileId: input.fileId });

			const listResponse = await drive.files.list({
				q: `'${input.fileId}' in parents`,
			});

			if (!fileResponse.data) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "File not found",
				});
			}
			return {
				fileResponse: fileResponse.data,
				listResponse: listResponse.data,
			};
		}),
});
