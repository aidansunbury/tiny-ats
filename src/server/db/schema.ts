import crypto from "crypto";
import { relations, sql } from "drizzle-orm";
import { int } from "drizzle-orm/mysql-core";
import {
	bigint,
	boolean,
	index,
	integer,
	json,
	pgEnum,
	pgTableCreator,
	primaryKey,
	text,
	timestamp,
	uniqueIndex,
	varchar,
} from "drizzle-orm/pg-core";
import { google } from "googleapis";
import type { AdapterAccount } from "next-auth/adapters";

export type FieldOptions =
	| { optionType: "text"; paragraph: boolean }
	| {
			optionType: "multipleChoice";
			type: "radio" | "checkbox";
			options: string[];
	  }
	| {
			optionType: "scale";
			low: number;
			high: number;
			lowLabel: string;
			highLabel: string;
	  }
	| { optionType: "date"; includeTime: boolean; includeYear: boolean }
	| { optionType: "time"; duration: boolean } // is the question an elapsed time or time of day
	| { optionType: "fileUpload"; folderId: string }
	| {
			optionType: "grid";
			rowQuestion: string;
			grid: {
				columns: {
					type: "radio" | "checkbox";
					options: string[];
				};
			};
	  };

// export const defaultFieldOptions: FieldOptions = {
//   options: [],
// };

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `${name}`);

// Function to generate a prefixed UUID
const generatePrefixedUUID = (prefix: string) => {
	const uuid = crypto.randomUUID();
	return `${prefix}_${uuid}`;
};

export const users = createTable("user", {
	id: varchar("id", { length: 255 })
		.notNull()
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	name: varchar("name", { length: 255 }),
	email: varchar("email", { length: 255 }).notNull(),
	emailVerified: timestamp("email_verified", {
		mode: "date",
		withTimezone: true,
	}).default(sql`CURRENT_TIMESTAMP`),
	image: varchar("image", { length: 255 }),
	googleAccessToken: varchar("google_access_token"),
	googleAccessTokenExpires: bigint("google_access_token_expires", {
		mode: "number",
	}),
	googleRefreshToken: varchar("google_refresh_token"),
});

export const usersRelations = relations(users, ({ many }) => ({
	accounts: many(accounts),
	organizations: many(userOrganizations),
	formResponses: many(formResponse),
}));

export const organizations = createTable(
	"organization",
	{
		id: varchar("id", { length: 255 })
			.notNull()
			.primaryKey()
			.$defaultFn(() => generatePrefixedUUID("organization")),
		organizationName: varchar("organization_name", { length: 255 }).notNull(),
		organizationSlug: varchar("organization_slug", { length: 255 })
			.notNull()
			.unique(),
	},
	(organizations) => ({
		organizationSlugIdx: index("organization_organization_slug_idx").on(
			organizations.organizationSlug,
		),
	}),
);

export const organizationsRelations = relations(organizations, ({ many }) => ({
	users: many(userOrganizations),
	forms: many(form),
}));

// Many to many relationship between users and organizations
// Join table for many-to-many relationship between users and organizations
// Each user has a role in the organization

export const roleEnum = pgEnum("role_enum", ["admin", "reviewer", "member"]);

export const userOrganizations = createTable(
	"user_organizations",
	{
		userId: varchar("user_id", { length: 255 })
			.notNull()
			.references(() => users.id),
		organizationId: varchar("organization_id")
			.notNull()
			.references(() => organizations.id),
		role: varchar("role", { length: 255 }),
	},
	(userOrganizations) => ({
		compoundKey: primaryKey({
			columns: [userOrganizations.userId, userOrganizations.organizationId],
		}),
		userIdIdx: index("user_organizations_user_id_idx").on(
			userOrganizations.userId,
		),
		organizationIdIdx: index("user_organizations_organization_id_idx").on(
			userOrganizations.organizationId,
		),
	}),
);

export const userOrganizationsRelations = relations(
	userOrganizations,
	({ one }) => ({
		user: one(users, {
			fields: [userOrganizations.userId],
			references: [users.id],
		}),
		organization: one(organizations, {
			fields: [userOrganizations.organizationId],
			references: [organizations.id],
		}),
	}),
);

//* Form Fields
export const formGroup = createTable(
	"form_group",
	{
		id: varchar("id", { length: 255 })
			.notNull()
			.primaryKey()
			.$defaultFn(() => generatePrefixedUUID("form_group")),
		groupName: varchar("group_name"),
		groupDescription: varchar("group_description"),

		// Todo make this not null
		organizationId: varchar("organization_id").references(
			() => organizations.id,
		),
	},
	(formGroup) => ({
		organizationIdIdx: index("form_group_organization_id_idx").on(
			formGroup.organizationId,
		),
	}),
);

export const formGroupRelations = relations(formGroup, ({ many, one }) => ({
	forms: many(form),
	organization: one(organizations, {
		fields: [formGroup.organizationId],
		references: [organizations.id],
	}),
}));

// Corresponds to: https://developers.google.com/forms/api/reference/rest/v1/forms#Form
export const form = createTable(
	"form",
	{
		id: varchar("id", { length: 255 })
			.notNull()
			.primaryKey()
			.$defaultFn(() => generatePrefixedUUID("form")),
		googleFormId: varchar("google_form_id", { length: 255 }).unique(),

		// Used for fetching only new responses
		lastSyncedTimestamp: timestamp("responses_synced_timestamp", {
			mode: "date",
			withTimezone: true,
		}).notNull(),
		formName: varchar("form_name").notNull(),
		formDriveName: varchar("form_drive_name").notNull(),
		formDescription: varchar("form_description"),
		formOptions: json("form_options"),
		boardId: varchar("board_id", { length: 255 }).references(() => boards.id),
		formGroupId: varchar("form_group_id", { length: 255 }).references(
			() => formGroup.id,
		),

		// Todo make this not null
		organizationId: varchar("organization_id").references(
			() => organizations.id,
		),
		// Refers to the person who authorized access to the form. Use their access token to make requests
		ownerId: varchar("owner_id", { length: 255 })
			.notNull()
			.references(() => users.id),
	},
	(form) => {
		return {
			organizationIdIdx: index("form_organization_id_idx").on(
				form.organizationId,
			),
			googleFormIdIdx: index("form_google_form_id_idx").on(form.googleFormId),
		};
	},
);

export const formRelations = relations(form, ({ many, one }) => ({
	formFields: many(formFields),
	formResponses: many(formResponse),
	organization: one(organizations, {
		fields: [form.organizationId],
		references: [organizations.id],
	}),
	formGroup: one(formGroup, {
		fields: [form.formGroupId],
		references: [formGroup.id],
	}),
	owner: one(users, { fields: [form.ownerId], references: [users.id] }),
}));

export const fieldTypeEnum = pgEnum("field_type_enum", [
	"text",
	"multipleChoice",
	"scale",
	"date",
	"time",
	"fileUpload",
	"grid",
]);

// Corresponds to: https://developers.google.com/forms/api/reference/rest/v1/forms#Item
export const formFields = createTable(
	"form_fields",
	{
		id: varchar("id", { length: 255 })
			.notNull()
			.primaryKey()
			.$defaultFn(() => generatePrefixedUUID("field")),
		googleItemId: varchar("google_item_id", { length: 255 }),
		googleQuestionId: varchar("google_question_id", { length: 255 }).unique(),
		formId: varchar("form_id", { length: 255 })
			.notNull()
			.references(() => form.id),
		// Ensures that fields are ordered correctly based on order received from Google
		positionIndex: integer("position_index"),
		// Used for grid questions
		positionSubIndex: integer("position_sub_index"),
		fieldName: varchar("field_name").notNull(),
		fieldDescription: varchar("field_description"),
		fieldType: fieldTypeEnum("field_type").notNull(),
		// Value dependent on the field type
		fieldOptions: json("field_options").$type<FieldOptions>().notNull(),
		required: boolean("required").notNull().default(false),
	},
	(formFields) => ({
		formIdIdx: index("form_fields_form_id_idx").on(formFields.formId),
		googleQuestionIdIdx: index("form_fields_google_question_id_idx").on(
			formFields.googleQuestionId,
		),
	}),
);

export const formFieldsRelations = relations(formFields, ({ one, many }) => ({
	form: one(form, { fields: [formFields.formId], references: [form.id] }),
	formFieldResponses: many(formFieldResponse),
}));

//* unused
// export const formStatusEnum = pgEnum("form_status_enum", [
//   "started",
//   "completed",
//   "submitted",
// ]);

//* This is the key entity for the application system
export const formResponse = createTable(
	"form_responses",
	{
		id: varchar("id", { length: 255 })
			.notNull()
			.primaryKey()
			.$defaultFn(() => generatePrefixedUUID("response")),
		googleResponseId: varchar("google_response_id", { length: 255 }),

		// userId: varchar("user_id", { length: 255 }).notNull(), // todo create relation

		respondentEmail: varchar("respondent_email", { length: 255 }),

		lastSyncedTimestamp: timestamp("last_synced_timestamp", {
			mode: "date",
			withTimezone: true,
		}),

		formId: varchar("form_id")
			.notNull()
			.references(() => form.id),
		columnId: varchar("column_id", { length: 255 })
			// .notNull()
			.references(() => columns.id),
		userId: varchar("user_id", { length: 255 }).references(() => users.id),
		// status: formStatusEnum("status").notNull(),
	},
	(formResponse) => ({
		formIdIdx: index("form_responses_form_id_idx").on(formResponse.formId),
		userIdIdx: index("form_responses_user_id_idx").on(formResponse.userId),
		uniqueResponseConstraint: uniqueIndex("unique_form_response_constraint").on(
			formResponse.googleResponseId,
			formResponse.formId,
		),
	}),
);

export const formResponseRelations = relations(
	formResponse,
	({ one, many }) => ({
		form: one(form, { fields: [formResponse.formId], references: [form.id] }),
		user: one(users, { fields: [formResponse.userId], references: [users.id] }),
		column: one(columns, {
			fields: [formResponse.columnId],
			references: [columns.id],
		}),
		formFieldResponses: many(formFieldResponse),
	}),
);

type FileResponse = {
	fileId: string;
	fileName: string;
	mimeType: string;
};

export const formFieldResponse = createTable(
	"form_field_responses",
	{
		id: varchar("id", { length: 255 })
			.notNull()
			.primaryKey()
			.$defaultFn(() => generatePrefixedUUID("field_response")),
		googleQuestionId: varchar("google_question_id", { length: 255 }),

		parentPositionIndex: integer("parent_position_index"),

		// The overall response id
		formResponseId: varchar("form_response_id", { length: 255 })
			.notNull()
			.references(() => formResponse.id),

		// References the google id of the response
		formFieldId: varchar("form_field_id", { length: 255 })
			.notNull()
			.references(() => formFields.googleQuestionId),
		response: varchar("response").array(),
		fileResponse: json("file_response").$type<FileResponse>().array(),
	},
	(formFieldResponse) => ({
		formResponseIdIdx: index("form_field_responses_form_response_id_idx").on(
			formFieldResponse.formResponseId,
		),
		googleQuestionIdIdx: index(
			"form_field_responses_google_question_id_idx",
		).on(formFieldResponse.googleQuestionId),

		uniqueResponseConstraint: uniqueIndex(
			"unique_form_field_response_constraint",
		).on(formFieldResponse.googleQuestionId, formFieldResponse.formResponseId),
	}),
);

export const formFieldResponseRelations = relations(
	formFieldResponse,
	({ one }) => ({
		formResponse: one(formResponse, {
			fields: [formFieldResponse.formResponseId],
			references: [formResponse.id],
		}),
		formField: one(formFields, {
			fields: [formFieldResponse.formFieldId],
			references: [formFields.googleQuestionId],
		}),
	}),
);

//* Boards for organizing forms after the form is submitted

// Each form has a board to keep track of the form responses
export const boards = createTable("board", {
	id: varchar("id", { length: 255 })
		.notNull()
		.primaryKey()
		.$defaultFn(() => generatePrefixedUUID("board")),

	// boardName: varchar("board_name", { length: 255 }).notNull(),
	// createdAt: timestamp("created_at", { withTimezone: true })
	//   .default(sql`CURRENT_TIMESTAMP`)
	//   .notNull(),
});

// Relationships
export const boardsRelations = relations(boards, ({ many, one }) => ({
	columns: many(columns),
	// form: one(form),
}));

// Columns table
export const columns = createTable(
	"column",
	{
		id: varchar("id", { length: 255 })
			.notNull()
			.primaryKey()
			.$defaultFn(() => generatePrefixedUUID("column")),
		columnName: varchar("column_name", { length: 255 }).notNull(),
		boardId: varchar("board_id", { length: 255 })
			.notNull()
			.references(() => boards.id),
		positionIndex: integer("position_index").notNull(), // Used to order the columns on the board
		// createdAt: timestamp("created_at", { withTimezone: true })
		//   .default(sql`CURRENT_TIMESTAMP`)
		//   .notNull(),
	},
	(column) => ({
		boardIdIdx: index("column_board_id_idx").on(column.boardId),
	}),
);

export const columnsRelations = relations(columns, ({ one, many }) => ({
	board: one(boards, {
		fields: [columns.boardId],
		references: [boards.id],
	}),
	formResponses: many(formResponse),
}));

//* NextAuth tables

export const accounts = createTable(
	"account",
	{
		userId: varchar("user_id", { length: 255 })
			.notNull()
			.references(() => users.id),
		type: varchar("type", { length: 255 })
			.$type<AdapterAccount["type"]>()
			.notNull(),
		provider: varchar("provider", { length: 255 }).notNull(),
		providerAccountId: varchar("provider_account_id", {
			length: 255,
		}).notNull(),
		refresh_token: text("refresh_token"),
		access_token: text("access_token"),
		expires_at: integer("expires_at"),
		token_type: varchar("token_type", { length: 255 }),
		scope: varchar("scope", { length: 255 }),
		id_token: text("id_token"),
		session_state: varchar("session_state", { length: 255 }),
	},
	(account) => ({
		compoundKey: primaryKey({
			columns: [account.provider, account.providerAccountId],
		}),
		userIdIdx: index("account_user_id_idx").on(account.userId),
	}),
);

export const accountsRelations = relations(accounts, ({ one }) => ({
	user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessions = createTable(
	"session",
	{
		sessionToken: varchar("session_token", { length: 255 })
			.notNull()
			.primaryKey(),
		userId: varchar("user_id", { length: 255 })
			.notNull()
			.references(() => users.id),
		expires: timestamp("expires", {
			mode: "date",
			withTimezone: true,
		}).notNull(),
	},
	(session) => ({
		userIdIdx: index("session_user_id_idx").on(session.userId),
	}),
);

export const sessionsRelations = relations(sessions, ({ one }) => ({
	user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const verificationTokens = createTable(
	"verification_token",
	{
		identifier: varchar("identifier", { length: 255 }).notNull(),
		token: varchar("token", { length: 255 }).notNull(),
		expires: timestamp("expires", {
			mode: "date",
			withTimezone: true,
		}).notNull(),
	},
	(vt) => ({
		compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
	}),
);
