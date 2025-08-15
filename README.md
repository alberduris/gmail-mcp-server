# 📧 Gmail Multi-Account MCP Server

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9+-blue?logo=typescript)](https://www.typescriptlang.org/)
[![MCP](https://img.shields.io/badge/MCP-1.17+-green)](https://modelcontextprotocol.org/)
[![Gmail API](https://img.shields.io/badge/Gmail%20API-v1-red?logo=gmail)](https://developers.google.com/gmail/api)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

A powerful **Multi-Account Gmail MCP Server** that enables AI assistants to interact with multiple Gmail accounts simultaneously through OAuth2 authentication. Built with TypeScript and designed for seamless integration with **Claude Code** using the **Model Context Protocol**.

## 🌟 What's New - Multi-Account Support

✨ **Manage multiple Gmail accounts** from a single MCP server  
🔄 **Switch between accounts** seamlessly with `accountId` parameter  
🎯 **Account-specific settings** for enhanced security control  
🚀 **Modern Claude Code integration** using `claude mcp add` commands  
🛡️ **Enhanced safety** with per-account direct send controls

## 📑 Table of Contents

- [Features](#-features)
- [Prerequisites](#-prerequisites)
- [Quick Start](#-quick-start)
- [Multi-Account Setup](#-multi-account-setup)
- [Claude Code Integration](#-claude-code-integration)
- [Available Tools](#-available-tools)
- [Configuration Reference](#-configuration-reference)
- [Examples](#-examples)
- [Troubleshooting](#-troubleshooting)
- [Migration from Single Account](#-migration-from-single-account)

## ✨ Features

### 🏢 Multi-Account Management
- **Multiple Gmail accounts** in a single server instance
- **Account switching** via `accountId` parameter in all tools
- **Default account** fallback for seamless usage
- **Per-account security settings** for granular control

### 🛡️ Safety & Security
- **Draft-first design** - Creates drafts by default to prevent accidental sends
- **Per-account send permissions** - Enable direct sending only where needed
- **Secure OAuth2 flow** with refresh token persistence
- **Encrypted credential storage** in local configuration files

### 📧 Email Operations
- **📬 List emails** with advanced filtering and search
- **📖 Get email details** with full content and metadata
- **🔍 Advanced search** using Gmail's powerful query syntax
- **📝 Smart drafts** for new emails and threaded replies
- **✉️ Direct sending** (when explicitly enabled per account)
- **🔄 Forwarded content extraction** with MIME parsing

### 🚀 Performance & Integration
- **Type-safe TypeScript** implementation
- **Parallel processing** for multiple accounts
- **Claude Code native integration** via MCP protocol
- **Hot-reload development** support

## 📋 Prerequisites

- **Node.js** 18.0+ and npm
- **Google Cloud Console** access  
- **Claude Code** (for MCP integration)
- **Gmail accounts** you want to manage

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/JaviEzpeleta/gmail-mcp-server.git
cd gmail-mcp-server
npm install
```

### 2. Set Up OAuth Credentials

Create your Google Cloud project and OAuth credentials:

```bash
# Copy environment template
cp .env.example .env
```

**Add to `.env`:**
```bash
GMAIL_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=your_client_secret_here
OAUTH_REDIRECT_PORT=8765  # Optional: customize OAuth port
```

> **🔧 Google Cloud Setup**: Follow the [detailed Google Cloud setup guide](#google-cloud-console-setup) below.

### 3. Configure Your Accounts

```bash
# Copy accounts template
cp config/accounts.json.example config/accounts.json
```

**Edit `config/accounts.json`:**
```json
{
  "accounts": {
    "personal": {
      "email": "your.personal@gmail.com",
      "refreshToken": "",
      "displayName": "Personal Gmail",
      "allowDirectSend": false
    },
    "work": {
      "email": "your.work@company.com",
      "refreshToken": "",
      "displayName": "Work Gmail", 
      "allowDirectSend": true
    }
  },
  "defaultAccount": "personal"
}
```

### 4. Authorize Your Accounts

```bash
# Authorize each account (one at a time)
npm run setup personal
npm run setup work

# The browser will open for OAuth - authorize each account
```

### 5. Build and Test

```bash
# Build the server
npm run build

# Test the server
npm start
# Should show: ✅ Gmail MCP Server started successfully
# With all your accounts listed
```

## 🏢 Multi-Account Setup

### Account Configuration Structure

Each account in `config/accounts.json` supports:

```json
{
  "accountId": {
    "email": "account@gmail.com",          // Gmail address
    "refreshToken": "generated_by_setup",  // Auto-generated via npm run setup
    "displayName": "Friendly Name",        // For identification
    "allowDirectSend": false               // Security: allow direct email sending
  }
}
```

### OAuth Setup Per Account

```bash
# Setup syntax
npm run setup <accountId>

# Examples
npm run setup personal    # Sets up the "personal" account
npm run setup work        # Sets up the "work" account  
npm run setup client1     # Sets up the "client1" account
```

**What happens during setup:**
1. 🌐 Opens browser for OAuth authorization
2. 🔐 You authorize the specific Gmail account
3. 💾 Refresh token is automatically saved to `config/accounts.json`
4. ✅ Account is ready to use

### Account Status Verification

```bash
npm start
```

**Output shows all accounts:**
```
✅ Gmail MCP Server started successfully
📧 OAuth Client: 369702299702-4vu...
🏠 Default account: personal

📬 Available accounts:
   • personal: your.personal@gmail.com ✅ (default)
   • work: your.work@company.com ✅
   • client1: client@example.com ❌ (no token)
```

### Adding Additional Gmail Accounts

To add more Gmail accounts after initial setup:

#### 1. Add Test User in Google Cloud Console
```
1. Go to Google Cloud Console → APIs & Services → OAuth consent screen
2. Scroll down to "Test users" section
3. Click "+ ADD USERS"
4. Enter the new Gmail address: newaccount@gmail.com
5. Click "Save"
```

#### 2. Add Account to Local Configuration
Edit `config/accounts.json` and add the new account:

```json
{
  "accounts": {
    "personal": { ... },
    "work": { ... },
    "newaccount": {
      "email": "newaccount@gmail.com",
      "refreshToken": "",
      "displayName": "New Account",
      "allowDirectSend": false
    }
  },
  "defaultAccount": "personal"
}
```

#### 3. Authorize the New Account
```bash
npm run setup newaccount
# Browser opens → Sign in with newaccount@gmail.com → Authorize
```

#### 4. Verify New Account is Active
```bash
npm start
# Should show the new account in the list with ✅
```

#### 5. Restart Claude Code
After adding new accounts, you **must restart Claude Code completely** for the changes to take effect:

1. Close Claude Code entirely
2. Restart Claude Code
3. Return to your project

> **⚠️ Important**: The MCP server caches account configurations. New accounts won't be available until Claude Code is fully restarted.

**Important Notes:**
- **Same OAuth app** handles all accounts - no need for new client credentials
- **Test users required** while your app is in "Testing" mode in Google Cloud
- **No limit** on number of test users you can add
- **Each account gets its own security settings** in the config

## 🔗 Claude Code Integration

### Add MCP Server to Claude Code

```bash
# Navigate to your project directory
cd /path/to/gmail-mcp-server

# Add the MCP server to Claude Code
claude mcp add gmail \
  --env GMAIL_CLIENT_ID=your_client_id_here \
  --env GMAIL_CLIENT_SECRET=your_client_secret_here \
  -- node dist/server.js
```

### Verify Connection

```bash
# Check server status
claude mcp get gmail
# Should show: Status: ✓ Connected

# List all MCP servers
claude mcp list
```

### Using in Claude Code

Once configured, all Gmail tools are available:

```
📧 List my recent emails from my work account
🔍 Search my personal Gmail for emails from GitHub  
📝 Create a draft reply to the latest email from john@company.com using my work account
```

## 🛠️ Available Tools

All tools support the optional `accountId` parameter. If not specified, uses the default account.

### 📬 list_emails

List recent emails with filtering options.

**Parameters:**
- `maxResults` (1-500): Number of emails to return (default: 500)
- `query` (string): Gmail search query (default: "")
- `includeSpamTrash` (boolean): Include spam/trash folders (default: false)
- `accountId` (string): Account to use (default: uses default account)

**Examples:**
```
List my 5 most recent unread emails
List emails from my work account
Show recent emails from GitHub in my personal account
```

### 📖 get_email_details

Get complete email content and metadata.

**Parameters:**
- `emailId` (required): Gmail message ID
- `format` ("full"|"minimal"|"metadata"): Detail level (default: "full")
- `accountId` (string): Account to use

**Examples:**
```
Get full details of email ID 18abc123def from my work account
Show the content of the most recent email
```

### 📝 create_draft

Create email drafts (recommended for AI safety).

**Parameters:**
- `to` (required): Recipient email address
- `subject` (required): Email subject
- `body` (required): Email content
- `cc`, `bcc` (optional): Additional recipients
- `threadId`, `inReplyToMessageId` (optional): For threaded replies
- `accountId` (string): Account to send from

**Examples:**
```
Create a draft email from my work account to client@company.com
Draft a thank you email using my personal account
```

### 🔍 search_emails

Search emails using Gmail's advanced syntax.

**Parameters:**
- `query` (required): Gmail search query
- `maxResults` (1-500): Max results (default: 500)
- `includeSpamTrash` (boolean): Include spam/trash (default: false)
- `accountId` (string): Account to search

**Gmail Search Examples:**
- `from:github.com` - Emails from GitHub
- `subject:"invoice" has:attachment` - Invoices with attachments
- `is:unread newer_than:3d` - Unread emails from last 3 days
- `label:work` - Emails with "work" label

### 🔄 find_and_draft_reply

Find latest email from sender and create threaded draft reply.

**Parameters:**
- `senderName` (required): Sender name or email
- `replyBody` (optional): Custom reply content
- `maxResults` (1-500): Max emails to search from sender (default: 500)
- `accountId` (string): Account to use

**Examples:**
```
Draft a reply to the latest email from john@company.com using my work account
Reply to the most recent email from support using my personal account
```

### ✉️ send_email

Send emails directly (requires allowDirectSend: true).

**Parameters:**
- `to` (required): Recipient email address
- `subject` (required): Email subject  
- `body` (required): Email content
- `cc`, `bcc` (optional): Additional recipients
- `accountId` (string): Account to send from

**Security Notes:**
- Only works if `allowDirectSend: true` in account config
- Shows security warning when used
- Prefer `create_draft` for AI safety

### 📧 extract_forwarded_content

Extract original content from forwarded emails using MIME parsing.

**Parameters:**
- `emailId` (required): Forwarded email ID
- `includeHtml` (boolean): Include HTML content (default: false)
- `maxDepth` (1-10): Max recursion depth (default: 3)
- `accountId` (string): Account to use

## ⚙️ Configuration Reference

### Environment Variables (`.env`)

```bash
# Required: OAuth credentials (shared across all accounts)
GMAIL_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=your_client_secret_here

# Optional: OAuth setup configuration
OAUTH_REDIRECT_PORT=8765  # Port for OAuth callback (default: 8765)
LOG_LEVEL=info           # Logging level (debug|info|warn|error)
```

### Account Configuration (`config/accounts.json`)

```json
{
  "accounts": {
    "accountId": {
      "email": "account@gmail.com",
      "refreshToken": "oauth_refresh_token",
      "displayName": "Display Name",
      "allowDirectSend": false
    }
  },
  "defaultAccount": "accountId"
}
```

**Account Settings:**
- `email`: Gmail address for this account
- `refreshToken`: Auto-generated by `npm run setup <accountId>`
- `displayName`: Friendly name shown in responses
- `allowDirectSend`: Enable direct email sending (security feature)

## 📚 Examples

### Multi-Account Usage

**List emails from specific accounts:**
```
List recent emails from my work account
Show unread emails from my personal Gmail
```

**Cross-account operations:**
```
Search my work email for "project alpha" 
Check my personal Gmail for emails from PayPal
```

**Account-specific drafts:**
```
Create a draft from my work account to client@company.com about the proposal
Draft a personal email to my friend about the weekend
```

### Advanced Queries

**Complex searches:**
```
Find all emails with invoices from last month in my work account
Search personal Gmail for unread emails from family members
```

**Threaded replies:**
```
Reply to the latest email from john@company.com using my work account
Draft a follow-up to the GitHub notification in my personal email
```

## 🔧 Troubleshooting

### Account Setup Issues

**❌ Account not found in config**
```bash
# Add the account to config/accounts.json first, then run:
npm run setup <accountId>
```

**❌ No accounts initialized**
```bash
# Check that accounts have refresh tokens:
cat config/accounts.json
# Re-run setup for accounts missing tokens:
npm run setup <accountId>
```

### Authentication Problems

**❌ invalid_grant error**
```bash
# Regenerate refresh token:
npm run setup <accountId>
# Complete OAuth flow in browser
```

**❌ redirect_uri_mismatch**
- Verify Google Cloud OAuth client is **Web application** type
- Ensure redirect URI is `http://localhost:8765/oauth2callback`
- Match `OAUTH_REDIRECT_PORT` in `.env` with Google Cloud config

### Claude Code Integration

**❌ MCP server not connecting**
```bash
# Check MCP configuration:
claude mcp get gmail

# Rebuild and reconfigure if needed:
npm run build
claude mcp remove gmail
claude mcp add gmail --env GMAIL_CLIENT_ID=... --env GMAIL_CLIENT_SECRET=... -- node dist/server.js
```

**❌ Tools not available**
- Restart Claude Code completely
- Verify server status: `claude mcp get gmail`
- Check server logs: `npm start` should show connected accounts

### Google Cloud Console Setup

#### 1. Create OAuth2 Credentials

1. **Go to [Google Cloud Console](https://console.cloud.google.com/)**
2. **Create or select project**
3. **Enable Gmail API:**
   - Navigate to **APIs & Services** → **Library**
   - Search for "Gmail API" and click **Enable**

4. **Configure OAuth consent screen:**
   - Go to **APIs & Services** → **OAuth consent screen**
   - Choose "External" user type
   - Fill required fields:
     - App name: "Gmail MCP Server"
     - User support email: Your email
   - Add scopes:
     - `https://www.googleapis.com/auth/gmail.readonly`
     - `https://www.googleapis.com/auth/gmail.send`
     - `https://www.googleapis.com/auth/gmail.modify`
   - **Add test users:** Add all Gmail addresses you want to use

5. **Create OAuth client:**
   - Go to **APIs & Services** → **Credentials**
   - Click **+ CREATE CREDENTIALS** → **OAuth client ID**
   - **Application type:** Web application ⚠️ (Important!)
   - **Authorized redirect URIs:** `http://localhost:8765/oauth2callback`
   - Download the client ID and secret

## 🔄 Migration from Single Account

If you're upgrading from a single-account version:

### 1. Backup Current Setup
```bash
# Backup your current .env
cp .env .env.backup
```

### 2. Update Configuration
```bash
# Remove old refresh token from .env
# Keep only GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET

# Create accounts config
cp config/accounts.json.example config/accounts.json
# Edit with your account details
```

### 3. Re-authorize
```bash
# Setup your main account
npm run setup main  # or whatever you call your account

# Update MCP configuration  
claude mcp remove gmail
claude mcp add gmail --env GMAIL_CLIENT_ID=... --env GMAIL_CLIENT_SECRET=... -- node dist/server.js
```

## 🔒 Security Best Practices

### Account Security
- **Keep `allowDirectSend: false`** unless absolutely necessary
- **Review drafts** before sending manually from Gmail
- **Use specific accounts** for specific purposes (work vs personal)
- **Regularly review** OAuth permissions in Google Account settings

### Development Security
- **Never commit** `config/accounts.json` to version control (it's gitignored)
- **Use environment variables** for sensitive data in CI/CD
- **Test thoroughly** in development before production use
- **Monitor** for unexpected API usage

## 🤝 Contributing

Contributions welcome! The multi-account architecture makes it easy to extend:

1. **Fork the repository**
2. **Create feature branch:** `git checkout -b feature/amazing-feature`
3. **Test with multiple accounts:** Ensure your changes work across accounts
4. **Submit pull request** with clear description

### Development Setup
```bash
# Clone and install
git clone https://github.com/your-fork/gmail-mcp-server.git
cd gmail-mcp-server
npm install

# Set up test accounts
cp config/accounts.json.example config/accounts.json
# Add your test accounts

# Development mode with hot reload
npm run dev
```

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **[Google Gmail API](https://developers.google.com/gmail/api)** for email functionality
- **[Model Context Protocol](https://modelcontextprotocol.org/)** for the MCP specification  
- **[Anthropic](https://anthropic.com/)** for Claude Code and MCP development
- **[TypeScript](https://www.typescriptlang.org/)** for type safety and developer experience

## 📞 Support

For issues, questions, or feature requests:

- **📋 [Open an issue](https://github.com/JaviEzpeleta/gmail-mcp-server/issues)** on GitHub
- **📖 Check existing issues** for solutions  
- **📚 Read the [Gmail API docs](https://developers.google.com/gmail/api/guides)** for API questions
- **💬 [Discussions](https://github.com/JaviEzpeleta/gmail-mcp-server/discussions)** for general questions

---

**🚀 Ready to manage multiple Gmail accounts with AI?** Start with the [Quick Start](#-quick-start) guide!

Made with ❤️ by [Javi Ezpeleta](https://github.com/JaviEzpeleta)