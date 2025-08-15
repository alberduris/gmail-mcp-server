import * as fs from "fs"
import * as path from "path"
import { AccountsConfig, AccountConfig } from "../types"
import { GmailService } from "./gmail.service"

export class AccountManager {
  private accounts: Map<string, GmailService> = new Map()
  private config!: AccountsConfig
  private configPath: string

  constructor(configPath: string = "config/accounts.json") {
    this.configPath = path.resolve(configPath)
    this.loadConfig()
    this.initializeServices()
  }

  private loadConfig(): void {
    if (!fs.existsSync(this.configPath)) {
      throw new Error(
        `❌ Config file not found: ${this.configPath}\n` +
        `💡 Create one from the template: cp config/accounts.json.example config/accounts.json\n` +
        `🔧 Then run: npm run setup <accountId> for each account`
      )
    }

    try {
      const configData = fs.readFileSync(this.configPath, "utf-8")
      this.config = JSON.parse(configData)
      
      if (!this.config.accounts || Object.keys(this.config.accounts).length === 0) {
        throw new Error("❌ No accounts found in config file")
      }

      if (!this.config.defaultAccount || !this.config.accounts[this.config.defaultAccount]) {
        throw new Error("❌ Default account not found or not configured")
      }
    } catch (error: any) {
      throw new Error(`❌ Failed to load config: ${error.message}`)
    }
  }

  private initializeServices(): void {
    const clientId = process.env.GMAIL_CLIENT_ID
    const clientSecret = process.env.GMAIL_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      throw new Error(
        "❌ Missing OAuth credentials in environment variables:\n" +
        "  • GMAIL_CLIENT_ID\n" +
        "  • GMAIL_CLIENT_SECRET"
      )
    }

    for (const [accountId, accountConfig] of Object.entries(this.config.accounts)) {
      if (!accountConfig.refreshToken) {
        console.warn(`⚠️ Account '${accountId}' missing refresh token. Run: npm run setup ${accountId}`)
        continue
      }

      try {
        console.error(`🔍 DEBUG: Initializing account '${accountId}' with token: ${accountConfig.refreshToken.substring(0, 20)}...`)
        const gmailService = new GmailService({
          clientId,
          clientSecret,
          refreshToken: accountConfig.refreshToken,
          allowDirectSend: accountConfig.allowDirectSend,
          email: accountConfig.email
        })

        this.accounts.set(accountId, gmailService)
        console.error(`🔍 DEBUG: Account '${accountId}' initialized successfully`)
      } catch (error) {
        console.error(`❌ Failed to initialize account '${accountId}':`, error)
      }
    }

    if (this.accounts.size === 0) {
      throw new Error("❌ No valid accounts initialized. Check your refresh tokens.")
    }
  }

  getAccount(accountId?: string): GmailService {
    const targetAccount = accountId || this.config.defaultAccount
    
    const service = this.accounts.get(targetAccount)
    if (!service) {
      const availableAccounts = Array.from(this.accounts.keys()).join(", ")
      throw new Error(
        `❌ Account '${targetAccount}' not found or not initialized.\n` +
        `💡 Available accounts: ${availableAccounts}`
      )
    }
    
    return service
  }

  getAccountInfo(accountId?: string): AccountConfig & { accountId: string } {
    const targetAccount = accountId || this.config.defaultAccount
    const accountConfig = this.config.accounts[targetAccount]
    
    if (!accountConfig) {
      throw new Error(`❌ Account '${targetAccount}' not found in config`)
    }
    
    return {
      ...accountConfig,
      accountId: targetAccount
    }
  }

  listAccounts(): Array<{ accountId: string; email: string; displayName: string; isDefault: boolean; hasToken: boolean }> {
    return Object.entries(this.config.accounts).map(([accountId, config]) => ({
      accountId,
      email: config.email,
      displayName: config.displayName,
      isDefault: accountId === this.config.defaultAccount,
      hasToken: !!config.refreshToken && this.accounts.has(accountId)
    }))
  }

  updateRefreshToken(accountId: string, refreshToken: string): void {
    if (!this.config.accounts[accountId]) {
      throw new Error(`❌ Account '${accountId}' not found in config`)
    }

    this.config.accounts[accountId].refreshToken = refreshToken
    this.saveConfig()

    const clientId = process.env.GMAIL_CLIENT_ID!
    const clientSecret = process.env.GMAIL_CLIENT_SECRET!
    const accountConfig = this.config.accounts[accountId]

    const gmailService = new GmailService({
      clientId,
      clientSecret,
      refreshToken,
      allowDirectSend: accountConfig.allowDirectSend,
      email: accountConfig.email
    })

    this.accounts.set(accountId, gmailService)
  }

  private saveConfig(): void {
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2), "utf-8")
    } catch (error: any) {
      throw new Error(`❌ Failed to save config: ${error.message}`)
    }
  }

  getDefaultAccountId(): string {
    return this.config.defaultAccount
  }

  getAccountConfig(accountId: string): AccountConfig {
    const config = this.config.accounts[accountId]
    if (!config) {
      throw new Error(`❌ Account '${accountId}' not found in config`)
    }
    return config
  }
}