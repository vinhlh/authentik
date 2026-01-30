# Fixing Stitch MCP Server Connection

## Issue
The Stitch MCP server is configured in `mcp_config.json` but not connecting to Antigravity.

## Root Cause
Based on research, the issue is likely that:
1. **Stitch MCP service not enabled in Google Cloud**
2. **Antigravity not refreshing MCP servers**

## Solution Steps

### Step 1: Enable Stitch MCP in Google Cloud

Run this command to enable the Stitch MCP service:

```bash
gcloud beta services mcp enable stitch.googleapis.com --project=fun-trails-485614
```

### Step 2: Verify MCP Service is Enabled

Check if it's enabled:

```bash
gcloud beta services mcp list --project=fun-trails-485614
```

You should see `stitch.googleapis.com` in the list.

### Step 3: Refresh Antigravity MCP Servers

According to the documentation, after modifying `mcp_config.json`:

1. **In Antigravity UI:**
   - Click the MCP server icon (or "..." dropdown in agent panel)
   - Select "Manage MCP Servers"
   - Click "Refresh" or "Reload" to pick up the new configuration

2. **Or restart Antigravity completely**

### Step 4: Verify Connection

After refreshing, test the connection:

```
list_resources stitch
```

Should return available Stitch tools like:
- `stitch:create_project`
- `stitch:generate_screen_from_text`
- `stitch:get_screen`

## Current Configuration (Verified ✅)

Your `mcp_config.json` is correctly formatted:

```json
{
  "mcpServers": {
    "stitch": {
      "serverUrl": "https://stitch.googleapis.com/mcp",
      "headers": {
        "Authorization": "Bearer <token>",
        "X-Goog-User-Project": "fun-trails-485614"
      }
    }
  }
}
```

## Alternative: Check if gcloud is authenticated

Make sure you're authenticated:

```bash
gcloud auth list
gcloud config get-value project
```

Should show:
- Active account
- Project: `fun-trails-485614`

## Next Steps

1. Run the `gcloud beta services mcp enable` command above
2. Refresh MCP servers in Antigravity UI
3. Test connection with `list_resources stitch`
4. If still not working, check Antigravity logs for MCP errors

---

**Note:** The Bearer token in your config will expire. Consider using Application Default Credentials (ADC) for automatic refresh by running:

```bash
gcloud auth application-default login
```

Then update config to use ADC instead of manual Bearer tokens (if Antigravity supports it).
