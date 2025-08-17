import { AccountManager } from "../services/account-manager"
import { GetEmailCountInput, GetEmailCountSchema } from "../schemas/tool-schemas"

export async function handleGetEmailCount(
  accountManager: AccountManager,
  args: unknown
): Promise<{ content: Array<{ type: string; text: string }> }> {
  try {
    const input = GetEmailCountSchema.parse(args || {})
    const gmailService = accountManager.getAccount(input.accountId)
    const accountInfo = accountManager.getAccountInfo(input.accountId)
    
    const labelId = input.labelId || "INBOX"
    const labelCounts = await gmailService.getLabelCounts(labelId)

    const response_text = `📊 **Email Count for ${labelId}**\n📧 Account: ${accountInfo.displayName} (${accountInfo.email})\n\n` +
      `📬 **Messages**\n` +
      `   • Total: ${labelCounts.messagesTotal}\n` +
      `   • Unread: ${labelCounts.messagesUnread}\n\n` +
      `💬 **Threads**\n` +
      `   • Total: ${labelCounts.threadsTotal}\n` +
      `   • Unread: ${labelCounts.threadsUnread}`

    return {
      content: [
        {
          type: "text",
          text: response_text,
        },
      ],
    }
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: `❌ Error getting email count: ${error.message}`,
        },
      ],
    }
  }
}