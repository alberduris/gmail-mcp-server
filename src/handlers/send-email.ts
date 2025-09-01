import { AccountManager } from "../services/account-manager"
import { SendEmailSchema } from "../schemas/tool-schemas"
import { encodeToBase64Url, encodeSubject } from "../utils/email-parser"

export async function handleSendEmail(
  accountManager: AccountManager,
  args: unknown
): Promise<{ content: Array<{ type: string; text: string }> }> {
  try {
    const input = SendEmailSchema.parse(args || {})
    const gmailService = accountManager.getAccount(input.accountId)
    const accountInfo = accountManager.getAccountInfo(input.accountId)
    
    if (!gmailService.isDirectSendAllowed()) {
      return {
        content: [
          {
            type: "text",
            text: `🚨 **SECURITY: Direct email sending is disabled**

❌ **send_email** tool is disabled for safety to prevent accidental sends.

💡 **Safe alternatives:**
• Use **create_draft** to create an email draft instead
• Use **find_and_draft_reply** to reply to existing emails as drafts
• Enable direct sending for this account in config/accounts.json

🛡️ **Why this protection exists:**
This prevents AI assistants from accidentally sending emails without your review.
Always prefer creating drafts that you can review and send manually.`,
          },
        ],
      }
    }
    
    const contentType = input.contentType === "html" ? "text/html" : "text/plain"
    const messageParts = [
      `Content-Type: ${contentType}; charset="UTF-8"`,
      `MIME-Version: 1.0`,
      `Content-Transfer-Encoding: 7bit`,
      `To: ${input.to}`,
    ]

    if (input.cc) messageParts.push(`Cc: ${input.cc}`)
    if (input.bcc) messageParts.push(`Bcc: ${input.bcc}`)

    messageParts.push(`Subject: ${encodeSubject(input.subject)}`, "", input.body)

    const message = messageParts.join("\r\n")
    const encodedMessage = encodeToBase64Url(message)

    const result = await gmailService.sendEmail(encodedMessage)

    return {
      content: [
        {
          type: "text",
          text: `🚨 **EMAIL SENT DIRECTLY!** ⚠️

✅ **Email sent successfully!**

📧 From: ${accountInfo.displayName} (${accountInfo.email})
📧 To: ${input.to}
📋 Subject: ${input.subject}
🆔 Message ID: ${result.id}
${input.cc ? `📄 CC: ${input.cc}\n` : ""}${input.bcc ? `🔒 BCC: ${input.bcc}\n` : ""}

⚠️ **IMPORTANT:** This email was sent immediately without creating a draft.
💡 **Next time:** Consider using **create_draft** or **find_and_draft_reply** for safer email handling.`,
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
    
    console.error("Error sending email:", error)
    return {
      content: [
        {
          type: "text",
          text: `❌ Error sending email: ${
            error.message || error
          }\n\n💡 Check that the recipient address is valid and you have send permissions.`,
        },
      ],
    }
  }
}