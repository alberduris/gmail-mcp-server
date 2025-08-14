import { AccountManager } from "../services/account-manager"
import { ListEmailsInput, ListEmailsSchema } from "../schemas/tool-schemas"

export async function handleListEmails(
  accountManager: AccountManager,
  args: unknown
): Promise<{ content: Array<{ type: string; text: string }> }> {
  try {
    console.error("🔍 DEBUG: handleListEmails called with args:", JSON.stringify(args))
    const input = ListEmailsSchema.parse(args || {})
    console.error("🔍 DEBUG: parsed input:", JSON.stringify(input))
    const gmailService = accountManager.getAccount(input.accountId)
    console.error("🔍 DEBUG: got gmail service for account:", input.accountId || "default")
    const accountInfo = accountManager.getAccountInfo(input.accountId)
    console.error("🔍 DEBUG: got account info:", accountInfo.email)
    
    const messages = await gmailService.listEmails({
      maxResults: input.maxResults,
      query: input.query,
      includeSpamTrash: input.includeSpamTrash,
    })

    if (messages.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: `📭 No emails found matching your criteria.\n📧 Account: ${accountInfo.displayName} (${accountInfo.email})`,
          },
        ],
      }
    }

    const emailDetails = messages.map((message) => 
      gmailService.parseEmailDetails(message)
    )

    let response_text = `📬 **Found ${emailDetails.length} email${
      emailDetails.length !== 1 ? "s" : ""
    }**\n📧 Account: ${accountInfo.displayName} (${accountInfo.email})\n\n`

    emailDetails.forEach((email, index) => {
      response_text += `**${index + 1}. ${email.subject}**\n`
      response_text += `   📤 From: ${email.from}\n`
      response_text += `   📅 Date: ${email.date}\n`
      response_text += `   🆔 ID: ${email.id}\n`
      if (email.labels && email.labels.length > 0) {
        response_text += `   🏷️ Labels: ${email.labels.join(", ")}\n`
      }
      response_text += `   📝 Preview: ${email.snippet.substring(0, 100)}${
        email.snippet.length > 100 ? "..." : ""
      }\n\n`
    })

    return {
      content: [
        {
          type: "text",
          text: response_text,
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
    
    console.error("🔍 DEBUG: Error listing emails:", error)
    console.error("🔍 DEBUG: Error type:", error.constructor.name)
    console.error("🔍 DEBUG: Full error:", JSON.stringify(error, Object.getOwnPropertyNames(error)))
    return {
      content: [
        {
          type: "text",
          text: `❌ Error listing emails: ${
            error.message || error
          }\n\n💡 Tip: Check your authentication credentials and Gmail API permissions.`,
        },
      ],
    }
  }
}