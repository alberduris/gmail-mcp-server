import "dotenv/config"
import { Server } from "@modelcontextprotocol/sdk/server/index.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js"
import { AccountManager } from "./services/account-manager"

import { handleListEmails } from "./handlers/list-emails"
import { handleGetEmailDetails } from "./handlers/get-email-details"
import { handleSendEmail } from "./handlers/send-email"
import { handleSearchEmails } from "./handlers/search-emails"
import { handleCreateDraft } from "./handlers/create-draft"
import { handleFindAndDraftReply } from "./handlers/find-and-draft-reply"
import { handleExtractForwardedContent } from "./handlers/extract-forwarded-content"
import { handleListAccounts } from "./handlers/list-accounts"
import { handleTrashEmail } from "./handlers/trash-email"
import { handleUntrashEmail } from "./handlers/untrash-email"
import { handleBulkTrashEmails } from "./handlers/bulk-trash-emails"
import { handleArchiveEmail } from "./handlers/archive-email"
import { handleBulkArchiveEmails } from "./handlers/bulk-archive-emails"
import { handleDownloadEmail } from "./handlers/download-email"
import { handleGetEmailCount } from "./handlers/get-email-count"

const CLIENT_ID = process.env.GMAIL_CLIENT_ID
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("❌ Error: Missing required environment variables")
  console.error("\n📋 Required variables:")
  console.error("  • GMAIL_CLIENT_ID")
  console.error("  • GMAIL_CLIENT_SECRET")
  console.error("\n💡 Set up accounts: npm run setup <accountId>")
  process.exit(1)
}

let accountManager: AccountManager
try {
  accountManager = new AccountManager()
} catch (error: any) {
  console.error(error.message)
  process.exit(1)
}

const server = new Server(
  {
    name: "gmail-mcp-server",
    version: "1.3.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
)

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "list_emails",
        description: "List recent emails with optional filtering",
        inputSchema: {
          type: "object",
          properties: {
            maxResults: {
              type: "number",
              description: "Maximum number of emails to return (1-500)",
              default: 500,
              minimum: 1,
              maximum: 500,
            },
            query: {
              type: "string",
              description:
                "Gmail search query (e.g., 'is:unread', 'from:user@example.com')",
              default: "",
            },
            includeArchived: {
              type: "boolean",
              description: "Include archived emails (emails without INBOX label)",
              default: false,
            },
            accountId: {
              type: "string",
              description: "Account ID to use (uses default account if not specified)",
            },
          },
        },
      },
      {
        name: "extract_forwarded_content",
        description: "Extract original email content from a forwarded Gmail message using RAW format and MIME parsing.",
        inputSchema: {
          type: "object",
          properties: {
            emailId: { type: "string", description: "The email ID to process" },
            includeHtml: { type: "boolean", description: "Include HTML in output when available", default: false },
            maxDepth: { type: "number", description: "Max recursion depth for nested forwarded messages", default: 3, minimum: 1, maximum: 10 },
            accountId: { type: "string", description: "Account ID to use (uses default account if not specified)" },
          },
          required: ["emailId"],
        },
      },
      {
        name: "list_accounts",
        description: "List all available Gmail accounts configured in the server",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "get_email_details",
        description: "Get full details and content of a specific email by ID",
        inputSchema: {
          type: "object",
          properties: {
            emailId: {
              type: "string",
              description: "The email ID to retrieve",
            },
            format: {
              type: "string",
              description: "Level of detail to retrieve",
              enum: ["full", "minimal", "metadata"],
              default: "full",
            },
            accountId: {
              type: "string",
              description: "Account ID to use (uses default account if not specified)",
            },
          },
          required: ["emailId"],
        },
      },
      {
        name: "send_email",
        description: "Send an email with optional CC/BCC",
        inputSchema: {
          type: "object",
          properties: {
            to: {
              type: "string",
              description: "Recipient email address",
            },
            subject: {
              type: "string",
              description: "Email subject",
            },
            body: {
              type: "string",
              description: "Email body (plain text or HTML)",
            },
            cc: {
              type: "string",
              description: "CC recipients (comma-separated)",
            },
            bcc: {
              type: "string",
              description: "BCC recipients (comma-separated)",
            },
            accountId: {
              type: "string",
              description: "Account ID to use (uses default account if not specified)",
            },
          },
          required: ["to", "subject", "body"],
        },
      },
      {
        name: "search_emails",
        description: "Search emails using Gmail's advanced search syntax",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description:
                "Gmail search query (e.g., 'from:user@example.com', 'subject:invoice', 'has:attachment')",
            },
            maxResults: {
              type: "number",
              description: "Maximum number of results (1-500)",
              default: 500,
              minimum: 1,
              maximum: 500,
            },
            includeSpamTrash: {
              type: "boolean",
              description: "Include results from SPAM and TRASH",
              default: false,
            },
            accountId: {
              type: "string",
              description: "Account ID to use (uses default account if not specified)",
            },
          },
          required: ["query"],
        },
      },
      {
        name: "find_and_draft_reply",
        description:
          "Find the latest email from a sender and create a properly threaded draft reply. The draft will appear in the original email conversation in your inbox. RECOMMENDED for replying to existing emails.",
        inputSchema: {
          type: "object",
          properties: {
            senderName: {
              type: "string",
              description:
                "Sender name or email to search for (e.g., 'John', 'user@example.com')",
            },
            replyBody: {
              type: "string",
              description:
                "Custom reply message body. If not provided, a template will be used.",
            },
            maxResults: {
              type: "number",
              description: "Maximum number of emails to search from sender (1-500)",
              default: 500,
              minimum: 1,
              maximum: 500,
            },
            accountId: {
              type: "string",
              description: "Account ID to use (uses default account if not specified)",
            },
          },
          required: ["senderName"],
        },
      },
      {
        name: "create_draft",
        description: "Create a new email draft (safer alternative to send_email). For replies to existing emails, consider using find_and_draft_reply instead.",
        inputSchema: {
          type: "object",
          properties: {
            to: {
              type: "string",
              description: "Recipient email address",
            },
            subject: {
              type: "string",
              description: "Email subject",
            },
            body: {
              type: "string",
              description: "Email body (plain text or HTML)",
            },
            cc: {
              type: "string",
              description: "CC recipients (comma-separated)",
            },
            bcc: {
              type: "string",
              description: "BCC recipients (comma-separated)",
            },
            threadId: {
              type: "string",
              description: "Optional: Thread ID to add this draft to an existing conversation",
            },
            inReplyToMessageId: {
              type: "string",
              description: "Optional: Message ID of the email this is replying to (enables proper threading)",
            },
            accountId: {
              type: "string",
              description: "Account ID to use (uses default account if not specified)",
            },
          },
          required: ["to", "subject", "body"],
        },
      },
      {
        name: "trash_email",
        description: "Move an email to trash (will be permanently deleted after 30 days)",
        inputSchema: {
          type: "object",
          properties: {
            emailId: {
              type: "string",
              description: "The email ID to move to trash",
            },
            accountId: {
              type: "string",
              description: "Account ID to use (uses default account if not specified)",
            },
          },
          required: ["emailId"],
        },
      },
      {
        name: "untrash_email",
        description: "Restore an email from trash back to inbox",
        inputSchema: {
          type: "object",
          properties: {
            emailId: {
              type: "string",
              description: "The email ID to restore from trash",
            },
            accountId: {
              type: "string",
              description: "Account ID to use (uses default account if not specified)",
            },
          },
          required: ["emailId"],
        },
      },
      {
        name: "bulk_trash_emails",
        description: "Move multiple emails to trash based on search query (e.g., from:sender@domain.com)",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Gmail search query to find emails (e.g., 'from:noreply@uber.com', 'subject:newsletter')",
            },
            maxResults: {
              type: "number",
              description: "Maximum number of emails to process (1-500, default: 500)",
              default: 500,
              minimum: 1,
              maximum: 500,
            },
            preview: {
              type: "boolean",
              description: "Show preview of emails before trashing (default: true)",
              default: true,
            },
            accountId: {
              type: "string",
              description: "Account ID to use (uses default account if not specified)",
            },
          },
          required: ["query"],
        },
      },
      {
        name: "archive_email",
        description: "Archive an email (remove from inbox, but keep searchable in 'All Mail')",
        inputSchema: {
          type: "object",
          properties: {
            emailId: {
              type: "string",
              description: "The email ID to archive",
            },
            accountId: {
              type: "string",
              description: "Account ID to use (uses default account if not specified)",
            },
          },
          required: ["emailId"],
        },
      },
      {
        name: "bulk_archive_emails",
        description: "Archive multiple emails based on search query (e.g., from:sender@domain.com)",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Gmail search query to find emails (e.g., 'from:noreply@example.com', 'subject:newsletter')",
            },
            maxResults: {
              type: "number",
              description: "Maximum number of emails to process (1-500, default: 500)",
              default: 500,
              minimum: 1,
              maximum: 500,
            },
            preview: {
              type: "boolean",
              description: "Show preview of emails before archiving (default: true)",
              default: true,
            },
            accountId: {
              type: "string",
              description: "Account ID to use (uses default account if not specified)",
            },
          },
          required: ["query"],
        },
      },
      {
        name: "download_email",
        description: "Download an email as .eml file (RFC 822 format) for backup, migration, or analysis. IMPORTANT: outputDir must be an absolute path (e.g., /Users/username/Downloads) as relative paths resolve relative to the MCP server location, not the client.",
        inputSchema: {
          type: "object",
          properties: {
            emailId: {
              type: "string",
              description: "The email ID to download",
            },
            outputDir: {
              type: "string",
              description: "ABSOLUTE directory path to save the .eml file (e.g., /Users/username/Downloads, C:\\Users\\username\\Downloads). Relative paths are not supported.",
            },
            accountId: {
              type: "string",
              description: "Account ID to use (uses default account if not specified)",
            },
          },
          required: ["emailId", "outputDir"],
        },
      },
      {
        name: "get_email_count",
        description: "Get total and unread email counts for a specific label (INBOX, SENT, DRAFT, TRASH, SPAM, etc.)",
        inputSchema: {
          type: "object",
          properties: {
            labelId: {
              type: "string",
              description: "Label ID to get counts for (INBOX, SENT, DRAFT, TRASH, SPAM, STARRED, IMPORTANT, UNREAD)",
              default: "INBOX",
            },
            accountId: {
              type: "string",
              description: "Account ID to use (uses default account if not specified)",
            },
          },
        },
      },
    ],
  }
})

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const args = request.params.arguments as any
  
  switch (request.params.name) {
    case "list_emails":
      return handleListEmails(accountManager, args)
    
    case "get_email_details":
      return handleGetEmailDetails(accountManager, args)
    
    case "send_email":
      return handleSendEmail(accountManager, args)
    
    case "search_emails":
      return handleSearchEmails(accountManager, args)
    
    case "create_draft":
      return handleCreateDraft(accountManager, args)
    
    case "find_and_draft_reply":
      return handleFindAndDraftReply(accountManager, args)
    
    case "extract_forwarded_content":
      return handleExtractForwardedContent(accountManager, args)
    
    case "list_accounts":
      return handleListAccounts(accountManager, args)
    
    case "trash_email":
      return handleTrashEmail(accountManager, args)
    
    case "untrash_email":
      return handleUntrashEmail(accountManager, args)
    
    case "bulk_trash_emails":
      return handleBulkTrashEmails(accountManager, args)
    
    case "archive_email":
      return handleArchiveEmail(accountManager, args)
    
    case "bulk_archive_emails":
      return handleBulkArchiveEmails(accountManager, args)
    
    case "download_email":
      return handleDownloadEmail(accountManager, args)
    
    case "get_email_count":
      return handleGetEmailCount(accountManager, args)
    
    default:
      throw new Error(`Unknown tool: ${request.params.name}`)
  }
})

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  
  const accounts = accountManager.listAccounts()
  const defaultAccount = accountManager.getDefaultAccountId()
  
  console.error("✅ Gmail MCP Server started successfully")
  console.error(`📧 OAuth Client: ${CLIENT_ID?.substring(0, 20)}...`)
  console.error(`🏠 Default account: ${defaultAccount}`)
  console.error("\n📬 Available accounts:")
  
  accounts.forEach(account => {
    const status = account.hasToken ? "✅" : "❌ (no token)"
    const defaultFlag = account.isDefault ? " (default)" : ""
    console.error(`   • ${account.accountId}: ${account.email} ${status}${defaultFlag}`)
  })
  
  console.error(
    "\n🔧 Tools available: list_emails, get_email_details, send_email, search_emails, find_and_draft_reply, create_draft, extract_forwarded_content, list_accounts, trash_email, untrash_email, bulk_trash_emails, archive_email, bulk_archive_emails, download_email, get_email_count"
  )
}

main().catch(console.error)