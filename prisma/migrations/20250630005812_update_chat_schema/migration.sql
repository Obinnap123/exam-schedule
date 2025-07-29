-- Update Chat model to include title
ALTER TABLE "Chat" ADD COLUMN "title" TEXT NOT NULL DEFAULT 'New Chat';
