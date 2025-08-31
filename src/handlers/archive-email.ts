import { AccountManager } from "../services/account-manager"
import { ArchiveEmailSchema } from "../schemas/tool-schemas"

export async function handleArchiveEmail(
  accountManager: AccountManager,
  args: unknown
): Promise<{ content: Array<{ type: string; text: string }> }> {
  try {
    const input = ArchiveEmailSchema.parse(args || {})
    const gmailService = accountManager.getAccount(input.accountId)
    const accountInfo = accountManager.getAccountInfo(input.accountId)
    
    // Get email details first to show what we're archiving
    const emailDetails = await gmailService.getEmailDetails(input.emailId, "minimal")
    const headers = gmailService.extractHeaders(emailDetails)
    const subject = headers["Subject"] || "(No subject)"
    const from = headers["From"] || "Unknown"
    
    // Archive the email
    await gmailService.archiveEmail(input.emailId)

    return {
      content: [
        {
          type: "text",
          text: `📁 **Email archived successfully!**

📧 **Account:** ${accountInfo.displayName} (${accountInfo.email})
📋 **Subject:** ${subject}
📤 **From:** ${from}
🆔 **Email ID:** ${input.emailId}

✅ The email has been archived (removed from your inbox).
🔍 **Finding archived emails:** You can find this email by searching "all mail" in Gmail or using search queries.
💡 **Recovery:** You can restore it to your inbox manually from Gmail if needed.`,
        },
      ],
    }
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return {
        content: [
          {
            type: "text",
            text: `❌ Invalid input: ${error.errors.map((e: any) => e.message).join(', ')}`
          }
        ]
      }
    }
    
    console.error("Error archiving email:", error)
    return {
      content: [
        {
          type: "text",
          text: `❌ Error archiving email: ${
            error.message || error
          }

💡 Tips:
• Check that the email ID is valid
• Verify you have modify permissions for this account
• The email might already be archived or deleted
• Make sure the email is currently in your inbox`,
        },
      ],
    }
  }
}