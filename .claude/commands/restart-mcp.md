# Restart MCP Server Command

## Description
Command to restart the Gmail MCP server after making code changes.

## Usage
Run after any code changes (new tools, fixes, etc.)

## Commands
```bash
# Get environment variables from .env file first
source .env

# 1. Remove existing server
claude mcp remove gmail -s local

# 2. Add server again with environment variables (read from .env)
claude mcp add gmail stdio "node dist/server.js" --env GMAIL_CLIENT_ID=$GMAIL_CLIENT_ID --env GMAIL_CLIENT_SECRET=$GMAIL_CLIENT_SECRET
```

## Complete Process
1. Make changes to code
2. `npm run build`
3. Run the commands above
4. **🔑 CRITICAL STEP FOR USER:** The user must manually use `/mcp` command in Claude Code and click "Reconnect" - make sure you inform the user to do this after your steps.
5. New tools/changes are now available

## Notes
- Environment variables are read from `.env` file in project root
- Without the manual "Reconnect" step by the user, new tools won't appear
- Always run `npm run build` before restarting MCP
- The reconnect step must be done by the user in Claude Code interface
- If something goes wrong, use WebFetch for https://docs.anthropic.com/en/docs/claude-code/mcp