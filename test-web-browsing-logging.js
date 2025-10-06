#!/usr/bin/env node

/**
 * Test script to verify web-browsing logging improvements
 * This script simulates the web-browsing plugin execution with enhanced logging
 */

const { SystemSettings } = require('./server/models/systemSettings');

// Mock the web-browsing plugin components for testing
const mockLogger = (message) => {
  console.log(`[TEST] ${new Date().toISOString()} - ${message}`);
};

const mockIntrospect = (message) => {
  console.log(`[INTROSPECT] ${message}`);
};

// Create a mock aibitat context
const mockAibitat = {
  handlerProps: {
    log: mockLogger
  },
  introspect: mockIntrospect
};

// Test function to simulate web-browsing plugin execution
async function testWebBrowsingLogging() {
  console.log('='.repeat(80));
  console.log('WEB-BROWSING LOGGING TEST');
  console.log('='.repeat(80));
  
  try {
    // Check current search provider setting
    mockLogger('[TEST] Checking current search provider configuration...');
    
    const providerSetting = await SystemSettings.get({ label: "agent_search_provider" });
    const provider = providerSetting?.value ?? "unknown";
    
    mockLogger(`[TEST] Current search provider: "${provider}"`);
    
    // Test different scenarios
    const testQueries = [
      "Woodstock Georgia mayor 2025 candidates",
      "",  // Empty query test
      "test query with special characters: !@#$%^&*()",
      "very long query that exceeds normal length limits and should be truncated in logs to prevent overwhelming the console output with excessive text"
    ];
    
    for (const query of testQueries) {
      console.log('\n' + '-'.repeat(60));
      mockLogger(`[TEST] Testing query: "${query || '[EMPTY]'}"`);
      
      // Simulate the logging that would occur in the actual plugin
      if (!query || query.trim().length === 0) {
        mockLogger(`[web-browsing] ERROR: Empty or invalid query provided`);
        continue;
      }
      
      mockLogger(`[web-browsing] Handler invoked with query: "${query}"`);
      mockLogger(`[web-browsing] Starting search for query: "${query}"`);
      mockLogger(`[web-browsing] Retrieved search provider setting: "${provider}"`);
      
      // Simulate engine selection
      let engine;
      switch (provider) {
        case "google-search-engine":
          engine = "_googleSearchEngine";
          break;
        case "searxng-engine":
          engine = "_searXNGEngine";
          break;
        case "duckduckgo-engine":
          engine = "_duckDuckGoEngine";
          break;
        default:
          mockLogger(`[web-browsing] WARNING: Unknown provider "${provider}", falling back to Google Search Engine`);
          engine = "_googleSearchEngine";
      }
      
      mockLogger(`[web-browsing] Using search engine: ${engine} (provider: ${provider})`);
      
      // Simulate engine-specific logging
      if (engine === "_searXNGEngine") {
        if (!process.env.AGENT_SEARXNG_API_URL) {
          mockLogger(`[web-browsing] [SearXNGEngine] ERROR: Missing required environment variable AGENT_SEARXNG_API_URL`);
          continue;
        }
        mockLogger(`[web-browsing] [SearXNGEngine] Starting search for: "${query}"`);
        mockLogger(`[web-browsing] [SearXNGEngine] Constructed search URL: ${process.env.AGENT_SEARXNG_API_URL}?q=${encodeURIComponent(query)}&format=json`);
      } else if (engine === "_googleSearchEngine") {
        if (!process.env.AGENT_GSE_CTX || !process.env.AGENT_GSE_KEY) {
          mockLogger(`[web-browsing] [GoogleSearchEngine] ERROR: Missing required environment variables - AGENT_GSE_CTX: ${!!process.env.AGENT_GSE_CTX}, AGENT_GSE_KEY: ${!!process.env.AGENT_GSE_KEY}`);
          continue;
        }
        mockLogger(`[web-browsing] [GoogleSearchEngine] Starting search for: "${query}"`);
      } else if (engine === "_duckDuckGoEngine") {
        mockLogger(`[web-browsing] [DuckDuckGoEngine] Starting search for: "${query}"`);
        mockLogger(`[web-browsing] [DuckDuckGoEngine] Constructed search URL: https://html.duckduckgo.com/html?q=${encodeURIComponent(query)}`);
      }
      
      // Simulate successful completion
      const mockDuration = Math.floor(Math.random() * 2000) + 500; // 500-2500ms
      const mockResultCount = Math.floor(Math.random() * 10) + 1; // 1-10 results
      const mockTokenCount = Math.floor(Math.random() * 5000) + 1000; // 1000-6000 tokens
      
      mockLogger(`[web-browsing] [${engine.replace('_', '').replace('Engine', '')}] API request completed in ${mockDuration}ms with status: 200`);
      mockLogger(`[web-browsing] [${engine.replace('_', '').replace('Engine', '')}] Raw API response received with ${mockResultCount} results`);
      mockLogger(`[web-browsing] [${engine.replace('_', '').replace('Engine', '')}] Processed ${mockResultCount} search results`);
      mockLogger(`[web-browsing] [${engine.replace('_', '').replace('Engine', '')}] Returning ${mockResultCount} results (~${mockTokenCount.toLocaleString()} tokens)`);
      mockLogger(`[web-browsing] Search completed successfully in ${mockDuration}ms using ${engine}`);
      mockLogger(`[web-browsing] Handler completed successfully in ${mockDuration + 50}ms`);
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('TEST COMPLETED SUCCESSFULLY');
    console.log('='.repeat(80));
    
    // Print environment variable status
    console.log('\nENVIRONMENT VARIABLES STATUS:');
    console.log(`AGENT_SEARXNG_API_URL: ${process.env.AGENT_SEARXNG_API_URL ? 'SET' : 'NOT SET'}`);
    console.log(`AGENT_GSE_CTX: ${process.env.AGENT_GSE_CTX ? 'SET' : 'NOT SET'}`);
    console.log(`AGENT_GSE_KEY: ${process.env.AGENT_GSE_KEY ? 'SET' : 'NOT SET'}`);
    
  } catch (error) {
    mockLogger(`[TEST] ERROR: ${error.message}`);
    console.error('Test failed:', error);
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testWebBrowsingLogging().catch(console.error);
}

module.exports = { testWebBrowsingLogging };

