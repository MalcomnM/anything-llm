# Web-Browsing Plugin Logging Improvements

## Overview
This document outlines the comprehensive logging improvements made to the web-browsing plugin to help debug issues and provide better visibility into the search process.

## Changes Made

### 1. Enhanced Handler Logging
**File:** `server/utils/agents/aibitat/plugins/web-browsing.js`

- **Query Validation Logging**: Added logging for empty/invalid queries
- **Timing Information**: Added start/end timestamps and duration tracking
- **Error Context**: Enhanced error messages with stack traces and timing information

```javascript
// Before
handler: async function ({ query }) {
  try {
    if (query) return await this.search(query);
    return "There is nothing we can do...";
  } catch (error) {
    return `There was an error...`;
  }
}

// After
handler: async function ({ query }) {
  const startTime = Date.now();
  this.super.handlerProps.log(`[web-browsing] Handler invoked with query: "${query || 'undefined'}"`);
  
  try {
    if (!query || query.trim().length === 0) {
      this.super.handlerProps.log(`[web-browsing] ERROR: Empty or invalid query provided`);
      return "There is nothing we can do...";
    }
    
    const result = await this.search(query);
    const duration = Date.now() - startTime;
    this.super.handlerProps.log(`[web-browsing] Handler completed successfully in ${duration}ms`);
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    this.super.handlerProps.log(`[web-browsing] ERROR: Handler failed after ${duration}ms - ${error.message}`);
    this.super.handlerProps.log(`[web-browsing] ERROR Stack: ${error.stack}`);
    return `There was an error...`;
  }
}
```

### 2. Search Provider Detection Logging
- **Provider Resolution**: Log which search provider is configured
- **Fallback Logging**: Log when falling back to default provider
- **Engine Selection**: Log which search engine is being used

```javascript
// Added comprehensive provider detection logging
const providerSetting = await SystemSettings.get({ label: "agent_search_provider" });
provider = providerSetting?.value ?? "unknown";
this.super.handlerProps.log(`[web-browsing] Retrieved search provider setting: "${provider}"`);

// Log fallback scenarios
default:
  this.super.handlerProps.log(`[web-browsing] WARNING: Unknown provider "${provider}", falling back to Google Search Engine`);
  engine = "_googleSearchEngine";
```

### 3. Engine-Specific Logging

#### Google Search Engine
- **Environment Variable Validation**: Log missing API keys with specific details
- **URL Construction**: Log constructed search URL (with API key redacted)
- **API Request Timing**: Log request duration and response status
- **Result Processing**: Log number of raw results and processed results

#### SearXNG Engine
- **URL Validation**: Log URL construction and validation errors
- **API Response**: Log response structure and result count
- **Error Handling**: Enhanced error messages with timing information

#### DuckDuckGo Engine
- **HTML Parsing**: Log HTML response receipt and parsing progress
- **Result Extraction**: Log number of results parsed from HTML

### 4. Agent Handler Integration
**File:** `server/utils/agents/aibitat/index.js`

Added specific logging for web-browsing tool invocations:

```javascript
// Additional logging for web-browsing tool
if (name === 'web-browsing') {
  this.handlerProps?.log?.(
    `[AgentHandler] [web-browsing] Tool invocation started with query: "${args?.query || 'undefined'}"`
  );
}

const toolStartTime = Date.now();
const result = await fn.handler(args);
const toolDuration = Date.now() - toolStartTime;

// Additional logging for web-browsing tool completion
if (name === 'web-browsing') {
  this.handlerProps?.log?.(
    `[AgentHandler] [web-browsing] Tool completed in ${toolDuration}ms with result length: ${result?.length || 0} characters`
  );
}
```

## Logging Format

All new logging follows a consistent format:
```
[web-browsing] [EngineType] Message with context
```

Examples:
- `[web-browsing] Handler invoked with query: "Woodstock Georgia mayor 2025 candidates"`
- `[web-browsing] [SearXNGEngine] Starting search for: "test query"`
- `[web-browsing] [GoogleSearchEngine] API request completed in 1250ms with status: 200`
- `[web-browsing] [DuckDuckGoEngine] ERROR: Request failed after 5000ms - timeout`

## Benefits

1. **Debugging**: Easy to identify where failures occur in the search pipeline
2. **Performance Monitoring**: Track request durations and identify slow searches
3. **Configuration Issues**: Quickly identify missing environment variables or misconfigurations
4. **Result Analysis**: Understand result counts and token usage
5. **Error Tracking**: Comprehensive error context with stack traces and timing

## Testing

A test script has been created at `test-web-browsing-logging.js` to simulate the logging behavior and verify the improvements work correctly.

## Usage

To see the enhanced logging in action:

1. Enable agent debugging in your AnythingLLM instance
2. Use the web-browsing tool through an agent
3. Check the console logs for detailed information about the search process

The logs will help you identify:
- Which search provider is being used
- Whether API keys are properly configured
- How long searches are taking
- What results are being returned
- Where failures are occurring

## Environment Variables to Check

Based on the logging, you can verify these environment variables are set:

- `AGENT_SEARXNG_API_URL` - For SearXNG searches
- `AGENT_GSE_CTX` and `AGENT_GSE_KEY` - For Google Custom Search
- `AGENT_SERPER_DEV_KEY` - For Serper.dev
- `AGENT_SEARCHAPI_API_KEY` - For SearchApi
- `AGENT_BING_SEARCH_API_KEY` - For Bing Search
- `AGENT_SERPLY_API_KEY` - For Serply
- `AGENT_TAVILY_API_KEY` - For Tavily
- `AGENT_EXA_API_KEY` - For Exa Search

The enhanced logging will clearly indicate which variables are missing and causing search failures.

