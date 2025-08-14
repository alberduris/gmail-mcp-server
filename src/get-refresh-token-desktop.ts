// get-refresh-token-desktop.ts
import "dotenv/config"
import { google } from "googleapis"
import * as http from "http"
import * as url from "url"
import { exec } from "child_process"
import * as fs from "fs"
import * as path from "path"
import { AccountsConfig } from "./types"

const CLIENT_ID = process.env.GMAIL_CLIENT_ID
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET
const OAUTH_REDIRECT_PORT = parseInt(process.env.OAUTH_REDIRECT_PORT || "8765", 10)
const CONFIG_PATH = path.resolve("config/accounts.json")

const accountId = process.argv[2]

if (!accountId) {
  console.error("❌ Error: Account ID is required")
  console.error("\n📋 Usage:")
  console.error("  npm run setup <accountId>")
  console.error("\n📝 Example:")
  console.error("  npm run setup personal")
  console.error("  npm run setup work")
  process.exit(1)
}

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("❌ Error: Missing GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET environment variables")
  console.error("Make sure you have these variables in your .env file")
  process.exit(1)
}

if (!fs.existsSync(CONFIG_PATH)) {
  console.error("❌ Error: Config file not found")
  console.error(`Expected: ${CONFIG_PATH}`)
  console.error("\n💡 Create one from the template:")
  console.error("  cp config/accounts.json.example config/accounts.json")
  process.exit(1)
}

// For Desktop apps, we can use localhost with configurable port
const REDIRECT_URI = `http://localhost:${OAUTH_REDIRECT_PORT}/oauth2callback`
const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
)

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.modify",
]

async function getRefreshToken() {
  // Load existing config
  const config: AccountsConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"))
  
  if (!config.accounts[accountId]) {
    console.error(`❌ Error: Account '${accountId}' not found in config`)
    console.error("\n📋 Available accounts:")
    Object.keys(config.accounts).forEach(id => {
      console.error(`  • ${id}`)
    })
    process.exit(1)
  }

  const accountConfig = config.accounts[accountId]
  console.log(`🔐 Setting up OAuth for account: ${accountId}`)
  console.log(`📧 Email: ${accountConfig.email}`)
  console.log(`📝 Display Name: ${accountConfig.displayName}`)

  // Create temporary server to capture the authorization code
  const server = http.createServer(async (req, res) => {
    if (req.url && req.url.indexOf("/oauth2callback") > -1) {
      const qs = new url.URL(req.url, `http://localhost:${OAUTH_REDIRECT_PORT}`).searchParams
      const code = qs.get("code")

      res.end("✅ Authorization received! You can close this window.")
      server.close()

      if (code) {
        try {
          const { tokens } = await oauth2Client.getToken(code)

          // Update the config file
          config.accounts[accountId].refreshToken = tokens.refresh_token!
          fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2))

          console.log("\n✅ SUCCESS! Account configured successfully!")
          console.log("=".repeat(60))
          console.log(`📧 Account: ${accountId}`)
          console.log(`📧 Email: ${accountConfig.email}`)  
          console.log(`🔑 Refresh token: ${tokens.refresh_token?.substring(0, 20)}...`)
          console.log("=".repeat(60))
          console.log("\n💾 Token saved to config/accounts.json")
          console.log(`📝 Account '${accountId}' is now ready to use!`)
          
          // Show all accounts status
          console.log("\n📬 All accounts status:")
          Object.entries(config.accounts).forEach(([id, acc]) => {
            const hasToken = !!acc.refreshToken
            const status = hasToken ? "✅" : "❌ (needs setup)"
            const defaultFlag = id === config.defaultAccount ? " (default)" : ""
            console.log(`   • ${id}: ${acc.email} ${status}${defaultFlag}`)
          })

          process.exit(0)
        } catch (error) {
          console.error("❌ Error obtaining tokens:", error)
          process.exit(1)
        }
      }
    }
  })

  server.listen(OAUTH_REDIRECT_PORT, () => {
    // Generate authorization URL
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: SCOPES,
      redirect_uri: REDIRECT_URI,
      prompt: "consent",
    })

    console.log("🚀 Opening browser for authorization...\n")

    // Try to open browser automatically
    const start =
      process.platform === "darwin"
        ? "open"
        : process.platform === "win32"
        ? "start"
        : "xdg-open"

    exec(`${start} "${authUrl}"`, (error) => {
      if (error) {
        console.log("Could not open browser automatically.")
        console.log("Please open this URL manually:\n")
        console.log(authUrl)
      }
    })

    console.log("\n⏳ Waiting for authorization...")
  })
}

// Execute
console.log("🔐 Gmail Multi-Account OAuth Setup")
console.log(`🔧 Using OAuth redirect port: ${OAUTH_REDIRECT_PORT} ${OAUTH_REDIRECT_PORT !== 8765 ? "(custom)" : "(default)"}`)
console.log(`📁 Config file: ${CONFIG_PATH}\n`)
getRefreshToken()