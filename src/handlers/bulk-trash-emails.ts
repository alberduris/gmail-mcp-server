import { AccountManager } from "../services/account-manager"
import { BulkTrashEmailsSchema } from "../schemas/tool-schemas"

export async function handleBulkTrashEmails(
  accountManager: AccountManager,
  args: unknown
): Promise<{ content: Array<{ type: string; text: string }> }> {
  try {
    const input = BulkTrashEmailsSchema.parse(args || {})
    const gmailService = accountManager.getAccount(input.accountId)
    const accountInfo = accountManager.getAccountInfo(input.accountId)
    
    // Search for email IDs matching the query
    console.error(`🔍 DEBUG: Searching emails with query: "${input.query}"`)
    const emailIds = await gmailService.searchEmailIds({
      query: input.query,
      maxResults: input.maxResults || 100
    })

    if (emailIds.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: `📭 **No emails found matching your query**

📧 **Account:** ${accountInfo.displayName} (${accountInfo.email})
🔍 **Query:** "${input.query}"

💡 **Tips:**
• Check your search syntax
• Try broader search terms  
• Use Gmail search operators like from:, subject:, has:attachment
• Example: from:noreply@uber.com OR subject:"order confirmation"`
          }
        ]
      }
    }

    // Preview mode - show what will be trashed
    if (input.preview !== false) {
      // Get sample email details for preview (max 5)
      const sampleIds = emailIds.slice(0, Math.min(5, emailIds.length))
      const sampleDetails = await Promise.all(
        sampleIds.map(id => gmailService.getEmailDetails(id, "minimal"))
      )
      
      const sampleEmails = sampleDetails.map(msg => gmailService.parseEmailDetails(msg))
      
      let previewText = `🔍 **PREVIEW: Emails that will be trashed**

📧 **Account:** ${accountInfo.displayName} (${accountInfo.email})
🔍 **Query:** "${input.query}"
📊 **Total found:** ${emailIds.length} email${emailIds.length !== 1 ? 's' : ''}

⚠️ **PREVIEW MODE** - No emails have been trashed yet.

**Sample emails (showing first ${sampleEmails.length} of ${emailIds.length}):**

`

      sampleEmails.forEach((email, index) => {
        previewText += `**${index + 1}. ${email.subject}**\n`
        previewText += `   📤 From: ${email.from}\n`
        previewText += `   📅 Date: ${email.date}\n`
        previewText += `   🆔 ID: ${email.id}\n\n`
      })

      if (emailIds.length > 5) {
        previewText += `... and ${emailIds.length - 5} more emails\n\n`
      }

      previewText += `🔄 **To proceed with trashing these emails:**
• Run the command again with \`preview: false\`
• Example: bulk_trash_emails({ query: "${input.query}", preview: false })

⚠️ **Warning:** This will move ${emailIds.length} emails to trash (30-day auto-delete)`

      return {
        content: [
          {
            type: "text",
            text: previewText
          }
        ]
      }
    }

    // Execute mode - actually trash the emails
    console.error(`🗑️ DEBUG: Trashing ${emailIds.length} emails`)
    await gmailService.batchTrashEmails(emailIds)

    return {
      content: [
        {
          type: "text",
          text: `🗑️ **Bulk trash completed successfully!**

📧 **Account:** ${accountInfo.displayName} (${accountInfo.email})
🔍 **Query:** "${input.query}"
📊 **Emails trashed:** ${emailIds.length}

✅ All matching emails have been moved to trash.
📅 **Auto-deletion:** Gmail will permanently delete these emails after 30 days.
♻️ **Recovery:** You can restore them from Gmail's trash folder if needed.

💡 **Common queries for future use:**
• \`from:noreply@uber.com\` - All emails from Uber
• \`subject:"Your order"\` - Emails with "Your order" in subject
• \`older_than:30d is:unread\` - Old unread emails
• \`has:attachment from:newsletters\` - Newsletter attachments`
        }
      ]
    }

  } catch (error: any) {
    if (error.name === 'ZodError') {
      return {
        content: [
          {
            type: "text",
            text: `❌ Invalid input: ${error.errors.map((e: any) => e.message).join(', ')}\n\n💡 **Required:** query (search string)\n💡 **Optional:** maxResults (1-1000), preview (true/false), accountId`
          }
        ]
      }
    }
    
    console.error("Error in bulk trash emails:", error)
    return {
      content: [
        {
          type: "text",
          text: `❌ Error processing bulk trash: ${error.message || error}

💡 **Troubleshooting:**
• Check your search query syntax
• Reduce maxResults if hitting limits
• Verify account permissions
• Try simpler search terms first

🔍 **Gmail search examples:**
• from:example@domain.com
• subject:newsletter
• is:unread older_than:7d`
        }
      ]
    }
  }
}