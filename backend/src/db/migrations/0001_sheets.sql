CREATE TABLE IF NOT EXISTS "sheets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"position" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "sheets_name_unique" ON "sheets" USING btree ("name");
--> statement-breakpoint
INSERT INTO "sheets" ("name", "position") VALUES
	('creative', 0),
	('writing', 1),
	('code', 2)
ON CONFLICT ("name") DO NOTHING;
