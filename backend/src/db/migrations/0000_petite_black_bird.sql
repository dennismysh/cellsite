CREATE TABLE IF NOT EXISTS "cells" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sheet" text DEFAULT 'creative' NOT NULL,
	"row" integer NOT NULL,
	"col" integer NOT NULL,
	"row_span" integer DEFAULT 1 NOT NULL,
	"col_span" integer DEFAULT 1 NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"subtitle_ja" text,
	"icon" text NOT NULL,
	"target_id" uuid,
	"target_table" text,
	"external_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "cells_sheet_row_col_unique" ON "cells" USING btree ("sheet","row","col");