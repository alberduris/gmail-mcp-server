import { google, gmail_v1 } from "googleapis"
import { OAuth2Client } from "google-auth-library"
import { EmailDetails, GmailClient } from "../types"
import { extractEmailBody } from "../utils/email-parser"
import { writeFileSync } from "fs"
import { join } from "path"

interface GmailServiceConfig {
  clientId: string
  clientSecret: string
  refreshToken: string
  allowDirectSend: boolean
  email: string
}

export class GmailService {
  private gmail: GmailClient
  private config: GmailServiceConfig

  constructor(config: GmailServiceConfig) {
    this.config = config
    
    const oauth2Client = new OAuth2Client(
      config.clientId,
      config.clientSecret,
      "http://localhost"
    )

    oauth2Client.setCredentials({
      refresh_token: config.refreshToken,
    })

    this.gmail = google.gmail({
      version: "v1",
      auth: oauth2Client,
    })
  }

  getClient(): GmailClient {
    return this.gmail
  }

  getAccountEmail(): string {
    return this.config.email
  }

  isDirectSendAllowed(): boolean {
    return this.config.allowDirectSend
  }

  async getEmailDetails(messageId: string, format: "full" | "minimal" | "metadata" = "full"): Promise<gmail_v1.Schema$Message> {
    const response = await this.gmail.users.messages.get({
      userId: "me",
      id: messageId,
      format,
    })
    return response.data
  }

  async listEmails(options: {
    maxResults?: number
    query?: string
    includeArchived?: boolean
    includeSpamTrash?: boolean
  }): Promise<gmail_v1.Schema$Message[]> {
    console.error(`🔍 DEBUG: listEmails called for account ${this.config.email}`)
    console.error(`🔍 DEBUG: options:`, JSON.stringify(options))
    
    let query = options.query || ""
    
    // Si includeArchived es false (default), solo mostrar emails del INBOX
    if (!options.includeArchived) {
      const inboxFilter = "in:inbox"
      query = query ? `(${query}) AND ${inboxFilter}` : inboxFilter
    }
    // Si includeArchived es true, no añadir filtro (mostrar todos los emails)
    
    const response = await this.gmail.users.messages.list({
      userId: "me",
      maxResults: options.maxResults || 500,
      q: query,
      includeSpamTrash: options.includeSpamTrash || false,
    })

    const messages = response.data.messages || []
    
    const details = await Promise.all(
      messages.slice(0, options.maxResults || 10).map(async (message) => {
        return this.getEmailDetails(message.id!)
      })
    )

    return details
  }

  async sendEmail(raw: string): Promise<gmail_v1.Schema$Message> {
    const response = await this.gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw,
      },
    })
    return response.data
  }

  async createDraft(raw: string, threadId?: string): Promise<gmail_v1.Schema$Draft> {
    const requestBody: any = {
      message: {
        raw,
      },
    }

    if (threadId) {
      requestBody.message.threadId = threadId
    }

    const response = await this.gmail.users.drafts.create({
      userId: "me",
      requestBody,
    })

    return response.data
  }

  async trashEmail(messageId: string): Promise<gmail_v1.Schema$Message> {
    const response = await this.gmail.users.messages.trash({
      userId: "me",
      id: messageId,
    })
    return response.data
  }

  async untrashEmail(messageId: string): Promise<gmail_v1.Schema$Message> {
    const response = await this.gmail.users.messages.untrash({
      userId: "me",
      id: messageId,
    })
    return response.data
  }

  async searchEmailIds(options: {
    query: string
    maxResults?: number
  }): Promise<string[]> {
    const allIds: string[] = []
    let pageToken: string | null | undefined = undefined
    const maxResults = options.maxResults || 100

    while (allIds.length < maxResults) {
      const listParams: gmail_v1.Params$Resource$Users$Messages$List = {
        userId: "me",
        q: options.query,
        maxResults: Math.min(500, maxResults - allIds.length), // Gmail API max is 500
        pageToken: pageToken || undefined,
      }
      
      const response = await this.gmail.users.messages.list(listParams)

      const messages = response.data.messages || []
      const messageIds = messages
        .map((msg: gmail_v1.Schema$Message) => msg.id)
        .filter((id): id is string => id !== null && id !== undefined)
      allIds.push(...messageIds)

      pageToken = response.data.nextPageToken
      if (!pageToken || allIds.length >= maxResults) {
        break
      }
    }

    return allIds.slice(0, maxResults)
  }

  async batchTrashEmails(messageIds: string[]): Promise<void> {
    // Gmail batchModify supports up to 1000 messages per request
    const batchSize = 1000
    
    for (let i = 0; i < messageIds.length; i += batchSize) {
      const batch = messageIds.slice(i, i + batchSize)
      
      await this.gmail.users.messages.batchModify({
        userId: "me",
        requestBody: {
          ids: batch,
          addLabelIds: ["TRASH"],
          removeLabelIds: ["INBOX"]
        }
      })
    }
  }

  async archiveEmail(messageId: string): Promise<gmail_v1.Schema$Message> {
    const response = await this.gmail.users.messages.modify({
      userId: "me",
      id: messageId,
      requestBody: {
        removeLabelIds: ["INBOX"]
      }
    })
    return response.data
  }

  async batchArchiveEmails(messageIds: string[]): Promise<void> {
    // Gmail batchModify supports up to 1000 messages per request
    const batchSize = 1000
    
    for (let i = 0; i < messageIds.length; i += batchSize) {
      const batch = messageIds.slice(i, i + batchSize)
      
      await this.gmail.users.messages.batchModify({
        userId: "me",
        requestBody: {
          ids: batch,
          removeLabelIds: ["INBOX"]
        }
      })
    }
  }

  async batchPermanentDelete(messageIds: string[]): Promise<void> {
    // Gmail batchDelete supports up to 1000 messages per request
    const batchSize = 1000
    
    for (let i = 0; i < messageIds.length; i += batchSize) {
      const batch = messageIds.slice(i, i + batchSize)
      
      await this.gmail.users.messages.batchDelete({
        userId: "me",
        requestBody: {
          ids: batch
        }
      })
    }
  }

  async downloadEmailAsEml(messageId: string): Promise<{ rawData: Buffer; subject: string }> {
    // Get the raw email data
    const rawResponse = await this.gmail.users.messages.get({
      userId: "me",
      id: messageId,
      format: "raw"
    })

    // Convert base64url to standard base64
    const base64 = (rawResponse.data.raw || '')
      .replace(/-/g, '+')
      .replace(/_/g, '/')

    const buffer = Buffer.from(base64, 'base64')

    // Get subject for filename
    const metadataResponse = await this.gmail.users.messages.get({
      userId: "me", 
      id: messageId,
      format: "metadata",
      metadataHeaders: ["Subject"]
    })

    const subject = metadataResponse.data.payload?.headers
      ?.find(h => h.name === "Subject")?.value || "email"

    return { rawData: buffer, subject }
  }

  extractHeaders(message: gmail_v1.Schema$Message): { [key: string]: string } {
    const headers = message.payload?.headers || []
    const result: { [key: string]: string } = {}
    
    headers.forEach((header) => {
      if (header.name && header.value) {
        result[header.name] = header.value
      }
    })
    
    return result
  }

  async getLabelCounts(labelId: string): Promise<{
    messagesTotal: number
    messagesUnread: number
    threadsTotal: number
    threadsUnread: number
  }> {
    const response = await this.gmail.users.labels.get({
      userId: "me",
      id: labelId,
    })

    const label = response.data
    return {
      messagesTotal: label.messagesTotal || 0,
      messagesUnread: label.messagesUnread || 0,
      threadsTotal: label.threadsTotal || 0,
      threadsUnread: label.threadsUnread || 0,
    }
  }

  parseEmailDetails(message: gmail_v1.Schema$Message): EmailDetails {
    const headers = this.extractHeaders(message)
    
    return {
      id: message.id!,
      subject: headers["Subject"] || "(No subject)",
      from: headers["From"] || "Unknown",
      to: headers["To"],
      date: headers["Date"] || "",
      snippet: message.snippet || "",
      labels: message.labelIds || undefined,
      threadId: message.threadId || undefined,
      body: message.payload ? extractEmailBody(message) : undefined,
    }
  }
}