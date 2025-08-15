import { AccountManager } from "../services/account-manager"
import { UntrashEmailSchema } from "../schemas/tool-schemas"

export async function handleUntrashEmail(
  accountManager: AccountManager,
  args: unknown
): Promise<{ content: Array<{ type: string; text: string }> }> {
  try {
    const input = UntrashEmailSchema.parse(args || {})
    const gmailService = accountManager.getAccount(input.accountId)
    const accountInfo = accountManager.getAccountInfo(input.accountId)
    
    // Get email details first to show what we're untrashing
    const emailDetails = await gmailService.getEmailDetails(input.emailId, "minimal")
    const headers = gmailService.extractHeaders(emailDetails)
    const subject = headers["Subject"] || "(No subject)"
    const from = headers["From"] || "Unknown"
    
    // Untrash the email
    const result = await gmailService.untrashEmail(input.emailId)

    return {
      content: [
        {
          type: "text",
          text: `♻️ **Email restored from trash successfully!**

📧 **Account:** ${accountInfo.displayName} (${accountInfo.email})
📋 **Subject:** ${subject}
📤 **From:** ${from}
🆔 **Email ID:** ${input.emailId}

✅ The email has been restored to your inbox.
📬 **Status:** The email is now back in your regular inbox and no longer in trash.
💡 **Note:** The email will remain in your inbox until you manually delete or trash it again.`,
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
    
    console.error("Error untrashing email:", error)
    return {
      content: [
        {
          type: "text",
          text: `❌ Error restoring email from trash: ${
            error.message || error
          }\n\n💡 Tips:\n• Check that the email ID is valid\n• Verify the email is currently in trash\n• Ensure you have modify permissions for this account\n• The email might already be restored or permanently deleted`,
        },
      ],
    }
  }
}