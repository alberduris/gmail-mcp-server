import { AccountManager } from "../services/account-manager"
import { BulkArchiveEmailsSchema } from "../schemas/tool-schemas"

export async function handleBulkArchiveEmails(
  accountManager: AccountManager,
  args: unknown
): Promise<{ content: Array<{ type: string; text: string }> }> {
  try {
    const input = BulkArchiveEmailsSchema.parse(args || {})
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
• Example: from:noreply@example.com OR subject:"newsletter"`
          }
        ]
      }
    }

    // Preview mode - show what will be archived
    if (input.preview !== false) {
      // Get sample email details for preview (max 5)
      const sampleIds = emailIds.slice(0, Math.min(5, emailIds.length))
      const sampleDetails = await Promise.all(
        sampleIds.map(id => gmailService.getEmailDetails(id, "minimal"))
      )
      
      const sampleEmails = sampleDetails.map(msg => gmailService.parseEmailDetails(msg))
      
      let previewText = `🔍 **PREVIEW: Emails that will be archived**

📧 **Account:** ${accountInfo.displayName} (${accountInfo.email})
🔍 **Query:** "${input.query}"
📊 **Total found:** ${emailIds.length} email${emailIds.length !== 1 ? 's' : ''}

⚠️ **PREVIEW MODE** - No emails have been archived yet.

**Sample emails (showing first ${sampleEmails.length} of ${emailIds.length}):**

`

      sampleEmails.forEach((email, index) => {
        previewText += `**${index + 1}. ${email.subject}**
   📤 From: ${email.from}
   📅 Date: ${email.date}
   🆔 ID: ${email.id}

`
      })

      if (emailIds.length > 5) {
        previewText += `... and ${emailIds.length - 5} more emails

`
      }

      previewText += `🔄 **To proceed with archiving these emails:**
• Run the command again with \`preview: false\`
• Example: bulk_archive_emails({ query: "${input.query}", preview: false })

📁 **Note:** Archiving will remove ${emailIds.length} emails from your inbox (they'll still be searchable in "All Mail")`

      return {
        content: [
          {
            type: "text",
            text: previewText
          }
        ]
      }
    }

    // Execute mode - actually archive the emails
    console.error(`📁 DEBUG: Archiving ${emailIds.length} emails`)
    await gmailService.batchArchiveEmails(emailIds)

    return {
      content: [
        {
          type: "text",
          text: `📁 **Bulk archive completed successfully!**

📧 **Account:** ${accountInfo.displayName} (${accountInfo.email})
🔍 **Query:** "${input.query}"
📊 **Emails archived:** ${emailIds.length}

✅ All matching emails have been archived (removed from inbox).
🔍 **Finding archived emails:** Search "all mail" in Gmail or use specific queries.
♻️ **Recovery:** You can restore them to your inbox from Gmail if needed.

💡 **Common queries for future use:**
• \`from:noreply@example.com\` - All emails from specific sender
• \`subject:"newsletter"\` - Emails with "newsletter" in subject  
• \`older_than:30d is:unread\` - Old unread emails
• \`has:attachment from:work\` - Work emails with attachments`
        }
      ]
    }

  } catch (error: any) {
    if (error.name === 'ZodError') {
      return {
        content: [
          {
            type: "text",
            text: `❌ Invalid input: ${error.errors.map((e: any) => e.message).join(', ')}

💡 **Required:** query (search string)
💡 **Optional:** maxResults (1-500), preview (true/false), accountId`
          }
        ]
      }
    }
    
    console.error("Error in bulk archive emails:", error)
    return {
      content: [
        {
          type: "text",
          text: `❌ Error processing bulk archive: ${error.message || error}

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