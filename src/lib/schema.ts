import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

export const patterns = sqliteTable("patterns", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  subject: text("subject").notNull(), // e.g. cat
  category: text("category").notNull(), // e.g. Animals
  style: text("style").notNull(), // Kawaii / Pixel Classic / Premium
  season: text("season"),
  difficulty: text("difficulty").notNull(), // easy / medium / hard
  status: text("status").notNull().default("draft"),
  coverImage: text("cover_image"),
  finishedImage: text("finished_image"),
  estimatedBeads: integer("estimated_beads").notNull(),
  colorCount: integer("color_count").notNull(),
  gridSize: text("grid_size").notNull(), // e.g. 32x32
  estimatedTime: text("estimated_time").notNull(),
  publishedAt: integer("published_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const patternSEO = sqliteTable("pattern_seo", {
  id: text("id").primaryKey(),
  patternId: text("pattern_id").notNull().references(() => patterns.id, { onDelete: "cascade" }),
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  seoKeywords: text("seo_keywords"),
  seoIntro: text("seo_intro"),
  searchIntent: text("search_intent"), // informational / download / idea / buying
  canonical: text("canonical"),
  ogImage: text("og_image"),
});

export const patternVariants = sqliteTable("pattern_variants", {
  id: text("id").primaryKey(),
  patternId: text("pattern_id").notNull().references(() => patterns.id, { onDelete: "cascade" }),
  sizeType: text("size_type").notNull(), // Mini / Classic / Detailed
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  beadCount: integer("bead_count").notNull(),
  colorCount: integer("color_count").notNull(),
  estimatedTime: text("estimated_time"),
  gridImage: text("grid_image").notNull(),
  finishedImage: text("finished_image"),
});

export const patternColors = sqliteTable("pattern_colors", {
  id: text("id").primaryKey(),
  variantId: text("variant_id").notNull().references(() => patternVariants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  hex: text("hex").notNull(),
  count: integer("count").notNull(),
});

export const patternSteps = sqliteTable("pattern_steps", {
  id: text("id").primaryKey(),
  patternId: text("pattern_id").notNull().references(() => patterns.id, { onDelete: "cascade" }),
  stepNumber: integer("step_number").notNull(),
  description: text("description").notNull(),
  image: text("image"),
});

export const patternFaqs = sqliteTable("pattern_faqs", {
  id: text("id").primaryKey(),
  patternId: text("pattern_id").notNull().references(() => patterns.id, { onDelete: "cascade" }),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  displayOrder: integer("display_order").notNull(),
});

export const categories = sqliteTable("categories", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  content: text("content"),
  keywords: text("keywords"),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const collections = sqliteTable("collections", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  content: text("content"),
  keywords: text("keywords"),
  displayOrder: integer("display_order").notNull().default(0),
  published: integer("published", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const animalPages = sqliteTable("animal_pages", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(), // e.g. cat-perler-bead-patterns
  name: text("name").notNull(), // e.g. Cat
  title: text("title").notNull(),
  h1: text("h1").notNull(),
  intro: text("intro").notNull(),
  subTopics: text("sub_topics"), // JSON array
  keywords: text("keywords"),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const patternCategories = sqliteTable("pattern_categories", {
  patternId: text("pattern_id").notNull().references(() => patterns.id, { onDelete: "cascade" }),
  categoryId: text("category_id").notNull().references(() => categories.id, { onDelete: "cascade" }),
});

export const patternCollections = sqliteTable("pattern_collections", {
  patternId: text("pattern_id").notNull().references(() => patterns.id, { onDelete: "cascade" }),
  collectionId: text("collection_id").notNull().references(() => collections.id, { onDelete: "cascade" }),
});

export const patternAnimalPages = sqliteTable("pattern_animal_pages", {
  patternId: text("pattern_id").notNull().references(() => patterns.id, { onDelete: "cascade" }),
  animalPageId: text("animal_page_id").notNull().references(() => animalPages.id, { onDelete: "cascade" }),
});

export const patternTags = sqliteTable("pattern_tags", {
  id: text("id").primaryKey(),
  patternId: text("pattern_id").notNull().references(() => patterns.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  type: text("type").notNull(), // style / theme / difficulty / animal / object / color / season / character
});

export const patternRelated = sqliteTable("pattern_related", {
  id: text("id").primaryKey(),
  patternId: text("pattern_id").notNull().references(() => patterns.id, { onDelete: "cascade" }),
  relatedPatternId: text("related_pattern_id").notNull().references(() => patterns.id, { onDelete: "cascade" }),
  relatedType: text("related_type").notNull(), // similar / same_collection / same_tag / same_category / manual
  score: real("score").notNull().default(0),
  displayOrder: integer("display_order").notNull().default(0),
});

export const patternsRelations = relations(patterns, ({ many }) => ({
  seo: many(patternSEO),
  variants: many(patternVariants),
  steps: many(patternSteps),
  faqs: many(patternFaqs),
  tags: many(patternTags),
  related: many(patternRelated),
}));

export const patternVariantsRelations = relations(patternVariants, ({ one, many }) => ({
  pattern: one(patterns, {
    fields: [patternVariants.patternId],
    references: [patterns.id],
  }),
  colors: many(patternColors),
}));

export const patternSEORelations = relations(patternSEO, ({ one }) => ({
  pattern: one(patterns, {
    fields: [patternSEO.patternId],
    references: [patterns.id],
  }),
}));

export const patternStepsRelations = relations(patternSteps, ({ one }) => ({
  pattern: one(patterns, {
    fields: [patternSteps.patternId],
    references: [patterns.id],
  }),
}));

export const patternFaqsRelations = relations(patternFaqs, ({ one }) => ({
  pattern: one(patterns, {
    fields: [patternFaqs.patternId],
    references: [patterns.id],
  }),
}));

export const patternTagsRelations = relations(patternTags, ({ one }) => ({
  pattern: one(patterns, {
    fields: [patternTags.patternId],
    references: [patterns.id],
  }),
}));

export const patternRelatedRelations = relations(patternRelated, ({ one }) => ({
  pattern: one(patterns, {
    fields: [patternRelated.patternId],
    references: [patterns.id],
  }),
  relatedPattern: one(patterns, {
    fields: [patternRelated.relatedPatternId],
    references: [patterns.id],
  }),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  patterns: many(patternCategories),
}));

export const collectionsRelations = relations(collections, ({ many }) => ({
  patterns: many(patternCollections),
}));

export const animalPagesRelations = relations(animalPages, ({ many }) => ({
  patterns: many(patternAnimalPages),
}));
