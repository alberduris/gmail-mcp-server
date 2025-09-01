# Gmail MCP Server Setup Commands
# Standard Operating Procedures for configuring this server with Claude Code

1. Build the server:
```bash
npm run build
```

2. Remove existing configuration (if any):
```bash
claude mcp remove gmail
```

3. Add Gmail MCP server with environment variables:
```bash
claude mcp add gmail --env GMAIL_CLIENT_ID=${GMAIL_CLIENT_ID} --env GMAIL_CLIENT_SECRET=${GMAIL_CLIENT_SECRET} --env GMAIL_REFRESH_TOKEN=${GMAIL_REFRESH_TOKEN} -- node /Users/alber/Repos/mcp-servers/gmail-mcp-server/dist/server.js
```

4. Verify connection:
```bash
claude mcp list
```