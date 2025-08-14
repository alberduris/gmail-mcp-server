import { AccountManager } from "../services/account-manager"
import { GetEmailDetailsSchema } from "../schemas/tool-schemas"
import { formatEmailDetails } from "../utils/email-parser"

export async function handleGetEmailDetails(
  accountManager: AccountManager,
  args: unknown
): Promise<{ content: Array<{ type: string; text: string }> }> {
  try {
    const input = GetEmailDetailsSchema.parse(args || {})
    const gmailService = accountManager.getAccount(input.accountId)
    const accountInfo = accountManager.getAccountInfo(input.accountId)
    
    const message = await gmailService.getEmailDetails(input.emailId, input.format)
    const emailDetail = gmailService.parseEmailDetails(message)

    return {
      content: [
        {
          type: "text",
          text: `📧 Account: ${accountInfo.displayName} (${accountInfo.email})\n\n` + formatEmailDetails(emailDetail),
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
    
    console.error("Error getting email details:", error)
    return {
      content: [
        {
          type: "text",
          text: `❌ Error getting email details: ${
            error.message || error
          }\n\n💡 Make sure the email ID is valid. You can get email IDs using list_emails or search_emails.`,
        },
      ],
    }
  }
}