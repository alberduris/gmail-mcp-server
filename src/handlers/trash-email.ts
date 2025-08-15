import { AccountManager } from "../services/account-manager"
import { TrashEmailSchema } from "../schemas/tool-schemas"

export async function handleTrashEmail(
  accountManager: AccountManager,
  args: unknown
): Promise<{ content: Array<{ type: string; text: string }> }> {
  try {
    const input = TrashEmailSchema.parse(args || {})
    const gmailService = accountManager.getAccount(input.accountId)
    const accountInfo = accountManager.getAccountInfo(input.accountId)
    
    // Get email details first to show what we're trashing
    const emailDetails = await gmailService.getEmailDetails(input.emailId, "minimal")
    const headers = gmailService.extractHeaders(emailDetails)
    const subject = headers["Subject"] || "(No subject)"
    const from = headers["From"] || "Unknown"
    
    // Trash the email
    const result = await gmailService.trashEmail(input.emailId)

    return {
      content: [
        {
          type: "text",
          text: `🗑️ **Email moved to trash successfully!**

📧 **Account:** ${accountInfo.displayName} (${accountInfo.email})
📋 **Subject:** ${subject}
📤 **From:** ${from}
🆔 **Email ID:** ${input.emailId}

✅ The email has been moved to the trash folder.
📅 **Auto-deletion:** Gmail will permanently delete this email after 30 days.
💡 **Recovery:** You can restore it manually from Gmail's trash folder if needed.`,
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
    
    console.error("Error trashing email:", error)
    return {
      content: [
        {
          type: "text",
          text: `❌ Error trashing email: ${
            error.message || error
          }\n\n💡 Tips:\n• Check that the email ID is valid\n• Verify you have modify permissions for this account\n• The email might already be in trash or deleted`,
        },
      ],
    }
  }
}