-- Drop the title column default constraint first
ALTER TABLE "Chat" ALTER COLUMN "title" DROP DEFAULT;

-- Make title column optional
ALTER TABLE "Chat" ALTER COLUMN "title" DROP NOT NULL;

-- Add default title for existing records
UPDATE "Chat" SET "title" = 'New Chat' WHERE "title" IS NULL;
