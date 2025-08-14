import "dotenv/config"
import { AccountManager } from "./src/services/account-manager"

async function testMultiAccountConnection() {
  console.log("🔍 Testing multi-account Gmail connection...\n")
  
  try {
    // Initialize AccountManager
    const accountManager = new AccountManager()
    
    // List accounts
    const accounts = accountManager.listAccounts()
    console.log("📬 Available accounts:")
    accounts.forEach(account => {
      const status = account.hasToken ? "✅" : "❌"
      const defaultFlag = account.isDefault ? " (default)" : ""
      console.log(`   • ${account.accountId}: ${account.email} ${status}${defaultFlag}`)
    })
    console.log()
    
    // Test default account
    const defaultAccountId = accountManager.getDefaultAccountId()
    console.log(`🧪 Testing default account: ${defaultAccountId}`)
    
    const gmailService = accountManager.getAccount()
    const accountInfo = accountManager.getAccountInfo()
    
    console.log(`📧 Account: ${accountInfo.displayName} (${accountInfo.email})`)
    console.log(`🔒 Allow direct send: ${accountInfo.allowDirectSend}`)
    console.log()
    
    // Test basic Gmail API call
    console.log("🔍 Testing Gmail API connection...")
    const response = await gmailService.getClient().users.getProfile({
      userId: "me"
    })
    
    console.log("✅ SUCCESS! Gmail API connection working")
    console.log(`📧 Profile email: ${response.data.emailAddress}`)
    console.log(`📊 Messages total: ${response.data.messagesTotal}`)
    console.log(`🧵 Threads total: ${response.data.threadsTotal}`)
    
  } catch (error: any) {
    console.error("❌ ERROR:", error.message)
    
    if (error.message.includes("invalid_grant")) {
      console.error("\n💡 Troubleshooting tips:")
      console.error("• Token may have expired - try: npm run setup personal")
      console.error("• Check Google Cloud Console project status")
      console.error("• Verify test user is added in OAuth consent screen")
    }
  }
}

testMultiAccountConnection()