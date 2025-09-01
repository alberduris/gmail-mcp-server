import { AccountManager } from "../services/account-manager"
import { EmptyTrashSchema } from "../schemas/tool-schemas"

export async function handleEmptyTrash(
  accountManager: AccountManager,
  args: unknown
): Promise<{ content: Array<{ type: string; text: string }> }> {
  try {
    const input = EmptyTrashSchema.parse(args || {})
    const gmailService = accountManager.getAccount(input.accountId)
    const accountInfo = accountManager.getAccountInfo(input.accountId)
    
    // Search for email IDs in trash
    console.error(`🔍 DEBUG: Searching trash emails for account ${accountInfo.email}`)
    const emailIds = await gmailService.searchEmailIds({
      query: "in:trash",
      maxResults: input.maxResults || 500
    })

    if (emailIds.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: `🗑️ **Trash is already empty**

📧 **Account:** ${accountInfo.displayName} (${accountInfo.email})
✨ Your trash folder contains no emails to delete.

💡 **Tip:** Emails in trash are automatically deleted by Gmail after 30 days.`
          }
        ]
      }
    }

    // Preview mode - show what will be permanently deleted
    if (input.preview !== false) {
      // Get sample email details for preview (max 5)
      const sampleIds = emailIds.slice(0, Math.min(5, emailIds.length))
      const sampleDetails = await Promise.all(
        sampleIds.map(id => gmailService.getEmailDetails(id, "minimal"))
      )
      
      const sampleEmails = sampleDetails.map(msg => gmailService.parseEmailDetails(msg))
      
      let previewText = `⚠️ **PREVIEW: Emails that will be PERMANENTLY DELETED**

📧 **Account:** ${accountInfo.displayName} (${accountInfo.email})
📊 **Total in trash:** ${emailIds.length} email${emailIds.length !== 1 ? 's' : ''}

🚨 **DANGER: This operation CANNOT be undone!**
These emails will be permanently deleted, not moved to trash.

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

      previewText += `🚨 **TO PERMANENTLY DELETE THESE EMAILS:**
• Run the command again with \`preview: false\`
• Example: empty_trash({ preview: false })

⚠️ **FINAL WARNING:** This will permanently delete ${emailIds.length} emails with NO RECOVERY POSSIBLE!`

      return {
        content: [
          {
            type: "text",
            text: previewText
          }
        ]
      }
    }

    // Execute mode - permanently delete all emails in trash
    console.error(`🗑️ DEBUG: Permanently deleting ${emailIds.length} emails from trash`)
    await gmailService.batchPermanentDelete(emailIds)

    return {
      content: [
        {
          type: "text",
          text: `🗑️ **Trash emptied successfully!**

📧 **Account:** ${accountInfo.displayName} (${accountInfo.email})
📊 **Emails permanently deleted:** ${emailIds.length}

✅ All emails in trash have been permanently deleted.
🚨 **Recovery:** These emails cannot be recovered by any means.

💡 **Storage freed:** Your Gmail storage usage has been reduced.

🔄 **Future emails:** New emails moved to trash will still follow the 30-day auto-delete rule.`
        }
      ]
    }

  } catch (error: any) {
    if (error.name === 'ZodError') {
      return {
        content: [
          {
            type: "text",
            text: `❌ Invalid input: ${error.errors.map((e: any) => e.message).join(', ')}\n\n💡 **Optional parameters:** maxResults (1-500), preview (true/false), accountId`
          }
        ]
      }
    }
    
    console.error("Error emptying trash:", error)
    return {
      content: [
        {
          type: "text",
          text: `❌ Error emptying trash: ${error.message || error}

💡 **Troubleshooting:**
• Verify account permissions for permanent deletion
• Reduce maxResults if hitting limits
• Check your internet connection
• Some emails might be too large for batch operations

🔍 **Alternative:** Try deleting emails in smaller batches by setting a lower maxResults value.`
        }
      ]
    }
  }
}