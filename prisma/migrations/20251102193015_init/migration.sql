-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "FieldType" AS ENUM ('SINGLELINE', 'MULTILINE', 'NUMBER', 'DOCUMENT', 'BOOL');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "roles" "UserRole"[] DEFAULT ARRAY['USER']::"UserRole"[],
    "socialIds" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventories" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "imageUrl" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "searchVector" TEXT,

    CONSTRAINT "inventories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_access" (
    "id" TEXT NOT NULL,
    "inventoryId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "canWrite" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "inventory_access_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "field_definitions" (
    "id" TEXT NOT NULL,
    "inventoryId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "type" "FieldType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "showInTable" BOOLEAN NOT NULL DEFAULT true,
    "constraints" JSONB,

    CONSTRAINT "field_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items" (
    "id" TEXT NOT NULL,
    "inventoryId" TEXT NOT NULL,
    "customId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "searchVector" TEXT,

    CONSTRAINT "items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_field_values" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "fieldDefinitionId" TEXT,
    "valueText" TEXT,
    "valueNumber" DOUBLE PRECISION,
    "valueBool" BOOLEAN,
    "valueLink" TEXT,

    CONSTRAINT "item_field_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discussion_posts" (
    "id" TEXT NOT NULL,
    "inventoryId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "markdownText" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "discussion_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "likes" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_tags" (
    "id" TEXT NOT NULL,
    "inventoryId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "inventory_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_id_sequences" (
    "id" TEXT NOT NULL,
    "inventoryId" TEXT NOT NULL,
    "template" JSONB NOT NULL,
    "nextValue" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "custom_id_sequences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "inventories_ownerId_idx" ON "inventories"("ownerId");

-- CreateIndex
CREATE INDEX "inventories_isPublic_idx" ON "inventories"("isPublic");

-- CreateIndex
CREATE INDEX "inventory_access_userId_idx" ON "inventory_access"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_access_inventoryId_userId_key" ON "inventory_access"("inventoryId", "userId");

-- CreateIndex
CREATE INDEX "field_definitions_inventoryId_idx" ON "field_definitions"("inventoryId");

-- CreateIndex
CREATE INDEX "items_inventoryId_idx" ON "items"("inventoryId");

-- CreateIndex
CREATE INDEX "items_createdById_idx" ON "items"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "items_inventoryId_customId_key" ON "items"("inventoryId", "customId");

-- CreateIndex
CREATE INDEX "item_field_values_itemId_idx" ON "item_field_values"("itemId");

-- CreateIndex
CREATE INDEX "item_field_values_fieldDefinitionId_idx" ON "item_field_values"("fieldDefinitionId");

-- CreateIndex
CREATE INDEX "discussion_posts_inventoryId_idx" ON "discussion_posts"("inventoryId");

-- CreateIndex
CREATE INDEX "discussion_posts_authorId_idx" ON "discussion_posts"("authorId");

-- CreateIndex
CREATE INDEX "likes_itemId_idx" ON "likes"("itemId");

-- CreateIndex
CREATE INDEX "likes_userId_idx" ON "likes"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "likes_itemId_userId_key" ON "likes"("itemId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "tags_name_key" ON "tags"("name");

-- CreateIndex
CREATE INDEX "inventory_tags_tagId_idx" ON "inventory_tags"("tagId");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_tags_inventoryId_tagId_key" ON "inventory_tags"("inventoryId", "tagId");

-- CreateIndex
CREATE UNIQUE INDEX "custom_id_sequences_inventoryId_key" ON "custom_id_sequences"("inventoryId");

-- AddForeignKey
ALTER TABLE "inventories" ADD CONSTRAINT "inventories_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_access" ADD CONSTRAINT "inventory_access_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "inventories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_access" ADD CONSTRAINT "inventory_access_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "field_definitions" ADD CONSTRAINT "field_definitions_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "inventories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "inventories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_field_values" ADD CONSTRAINT "item_field_values_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_field_values" ADD CONSTRAINT "item_field_values_fieldDefinitionId_fkey" FOREIGN KEY ("fieldDefinitionId") REFERENCES "field_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discussion_posts" ADD CONSTRAINT "discussion_posts_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "inventories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discussion_posts" ADD CONSTRAINT "discussion_posts_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "likes" ADD CONSTRAINT "likes_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "likes" ADD CONSTRAINT "likes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_tags" ADD CONSTRAINT "inventory_tags_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "inventories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_tags" ADD CONSTRAINT "inventory_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_id_sequences" ADD CONSTRAINT "custom_id_sequences_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "inventories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
