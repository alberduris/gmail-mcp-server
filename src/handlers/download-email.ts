import { AccountManager } from "../services/account-manager"
import { DownloadEmailSchema } from "../schemas/tool-schemas"
import { writeFileSync, existsSync, mkdirSync } from "fs"
import { join, isAbsolute } from "path"

function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, '_')
    .substring(0, 100)
}

function generateSafeFilename(subject: string, emailId: string): string {
  const timestamp = new Date().toISOString()
    .replace(/:/g, '')
    .replace(/\./g, '')
    .substring(0, 15)
  
  const sanitizedSubject = sanitizeFilename(subject)
  const shortEmailId = emailId.substring(0, 8)
  
  return `${sanitizedSubject}_${shortEmailId}_${timestamp}.eml`
}

export async function handleDownloadEmail(
  accountManager: AccountManager,
  args: unknown
): Promise<{ content: Array<{ type: string; text: string }> }> {
  try {
    const input = DownloadEmailSchema.parse(args || {})
    const gmailService = accountManager.getAccount(input.accountId)
    const accountInfo = accountManager.getAccountInfo(input.accountId)
    
    // Validate that outputDir is absolute
    if (!isAbsolute(input.outputDir)) {
      return {
        content: [
          {
            type: "text",
            text: `❌ **Error: Relative path not supported**

📂 **Provided path:** ${input.outputDir}

🚫 **Problem:** Relative paths resolve relative to the MCP server location, not your current directory.

✅ **Solution:** Use an absolute path instead:

**Examples:**
• macOS/Linux: \`/Users/username/Downloads\`
• Windows: \`C:\\Users\\username\\Downloads\`
• Current working directory: Use your shell to get the absolute path first

💡 **Tip:** In most shells, you can run \`pwd\` (Unix) or \`cd\` (Windows) to get your current absolute path.`
          }
        ]
      }
    }
    
    const outputDir = input.outputDir
    
    // Ensure directory exists
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true })
    }
    
    // Download email data
    const { rawData, subject } = await gmailService.downloadEmailAsEml(input.emailId)
    
    // Generate safe filename
    const filename = generateSafeFilename(subject, input.emailId)
    const filepath = join(outputDir, filename)
    
    // Write file to disk
    writeFileSync(filepath, rawData)
    
    // Get file size for display
    const fileSizeKB = Math.round(rawData.length / 1024 * 100) / 100

    return {
      content: [
        {
          type: "text",
          text: `📁 **Email downloaded successfully as .eml file!**

📧 **Account:** ${accountInfo.displayName} (${accountInfo.email})
📋 **Subject:** ${subject}
🆔 **Email ID:** ${input.emailId}
📂 **File path:** ${filepath}
📏 **File size:** ${fileSizeKB} KB

✅ The email has been saved in RFC 822 (.eml) format.

💡 **Usage tips:**
• Open with email clients: Thunderbird, Outlook, Apple Mail
• Import to other email systems for migration
• Archive for backup and compliance purposes
• View raw email headers and MIME structure

🔍 **File contains:**
• All email headers (From, To, Date, Message-ID, etc.)
• Complete email body (text and HTML)
• All attachments as MIME parts
• Original email formatting and encoding`,
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
    
    console.error("Error downloading email:", error)
    return {
      content: [
        {
          type: "text",
          text: `❌ Error downloading email: ${error.message || error}

💡 **Troubleshooting:**
• Check that the email ID is valid
• Verify you have read permissions for this account
• Ensure the output directory is writable
• Make sure there's sufficient disk space
• The email might have been deleted

🔍 **Common solutions:**
• Try a different output directory with \`outputDir\` parameter
• Verify email exists with \`get_email_details\` first
• Check account permissions and re-authenticate if needed`,
        },
      ],
    }
  }
}