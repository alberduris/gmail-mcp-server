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
              description: "Maximum number of emails to return (1-100)",
              default: 10,
              minimum: 1,
              maximum: 100,
            },
            query: {
              type: "string",
              description:
                "Gmail search query (e.g., 'is:unread', 'from:user@example.com')",
              default: "",
            },
            includeSpamTrash: {
              type: "boolean",
              description: "Include emails from SPAM and TRASH folders",
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
              description: "Maximum number of results (1-100)",
              default: 10,
              minimum: 1,
              maximum: 100,
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
    "\n🔧 Tools available: list_emails, get_email_details, send_email, search_emails, find_and_draft_reply, create_draft, extract_forwarded_content, list_accounts"
  )
}

main().catch(console.error)