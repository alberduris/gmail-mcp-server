import { z } from "zod"

export const ListEmailsSchema = z.object({
  maxResults: z.number().min(1).max(500).default(500).optional(),
  query: z.string().default("").optional(),
  includeSpamTrash: z.boolean().default(false).optional(),
  accountId: z.string().optional(),
})

export const GetEmailDetailsSchema = z.object({
  emailId: z.string(),
  format: z.enum(["full", "minimal", "metadata"]).default("full").optional(),
  accountId: z.string().optional(),
})

export const SendEmailSchema = z.object({
  to: z.string().email(),
  subject: z.string(),
  body: z.string(),
  cc: z.string().optional(),
  bcc: z.string().optional(),
  accountId: z.string().optional(),
})

export const SearchEmailsSchema = z.object({
  query: z.string().min(1),
  maxResults: z.number().min(1).max(500).default(500).optional(),
  includeSpamTrash: z.boolean().default(false).optional(),
  accountId: z.string().optional(),
})

export const CreateDraftSchema = z.object({
  to: z.string().email(),
  subject: z.string(),
  body: z.string(),
  cc: z.string().optional(),
  bcc: z.string().optional(),
  threadId: z.string().optional(),
  inReplyToMessageId: z.string().optional(),
  accountId: z.string().optional(),
})

export const FindAndDraftReplySchema = z.object({
  senderName: z.string().min(1),
  replyBody: z.string().optional(),
  maxResults: z.number().min(1).max(500).default(500).optional(),
  accountId: z.string().optional(),
})

export const ExtractForwardedContentSchema = z.object({
  emailId: z.string(),
  includeHtml: z.boolean().default(false).optional(),
  maxDepth: z.number().min(1).max(10).default(3).optional(),
  accountId: z.string().optional(),
})

export const ListAccountsSchema = z.object({
  // No parameters needed - lists all available accounts
})

export const TrashEmailSchema = z.object({
  emailId: z.string(),
  accountId: z.string().optional(),
})

export const UntrashEmailSchema = z.object({
  emailId: z.string(),
  accountId: z.string().optional(),
})

export const BulkTrashEmailsSchema = z.object({
  query: z.string().min(1),
  maxResults: z.number().min(1).max(500).default(500).optional(),
  preview: z.boolean().default(true).optional(),
  accountId: z.string().optional(),
})

export const GetEmailCountSchema = z.object({
  labelId: z.string().default("INBOX").optional(),
  accountId: z.string().optional(),
})

export type ListEmailsInput = z.infer<typeof ListEmailsSchema>
export type GetEmailDetailsInput = z.infer<typeof GetEmailDetailsSchema>
export type SendEmailInput = z.infer<typeof SendEmailSchema>
export type SearchEmailsInput = z.infer<typeof SearchEmailsSchema>
export type CreateDraftInput = z.infer<typeof CreateDraftSchema>
export type FindAndDraftReplyInput = z.infer<typeof FindAndDraftReplySchema>
export type ExtractForwardedContentInput = z.infer<typeof ExtractForwardedContentSchema>
export type ListAccountsInput = z.infer<typeof ListAccountsSchema>
export type TrashEmailInput = z.infer<typeof TrashEmailSchema>
export type UntrashEmailInput = z.infer<typeof UntrashEmailSchema>
export type BulkTrashEmailsInput = z.infer<typeof BulkTrashEmailsSchema>
export type GetEmailCountInput = z.infer<typeof GetEmailCountSchema>