import { AccountManager } from '../services/account-manager.js';

export interface ListAccountsInput {
  // No parameters needed
}

export async function handleListAccounts(
  accountManager: AccountManager,
  args: unknown
) {
  try {
    const accountsList = accountManager.listAccounts();
    const defaultAccountId = accountManager.getDefaultAccountId();

    let response_text = `📬 **Available Gmail Accounts**\n\n`;

    // Get additional config info for each account
    accountsList.forEach((account, index) => {
      const accountConfig = accountManager.getAccountConfig(account.accountId);
      const allowDirectSend = accountConfig.allowDirectSend || false;
      const status = account.hasToken ? '✅' : '❌';
      const defaultFlag = account.isDefault ? ' (default)' : '';
      
      response_text += `**${index + 1}. ${account.displayName}${defaultFlag}**\n`;
      response_text += `   🆔 ID: \`${account.accountId}\`\n`;
      response_text += `   📧 Email: ${account.email}\n`;
      response_text += `   🛡️ Direct Send: ${allowDirectSend ? '✅ Enabled' : '❌ Disabled (drafts only)'}\n`;
      response_text += `   📊 Status: ${status} ${account.hasToken ? 'Active' : 'Token Missing'}\n\n`;
    });

    response_text += `📊 **Summary:**\n`;
    response_text += `   • Total accounts: ${accountsList.length}\n`;
    response_text += `   • Default account: ${defaultAccountId}\n`;

    return {
      content: [
        {
          type: "text",
          text: response_text,
        },
      ],
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: "text", 
          text: `❌ Error listing accounts: ${error.message}\n\n💡 Tip: Check your accounts.json configuration file.`
        }
      ]
    };
  }
}