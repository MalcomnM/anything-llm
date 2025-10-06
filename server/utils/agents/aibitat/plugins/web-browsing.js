const { SystemSettings } = require("../../../../models/systemSettings");
const { TokenManager } = require("../../../helpers/tiktoken");
const tiktoken = new TokenManager();

const webBrowsing = {
  name: "web-browsing",
  startupConfig: {
    params: {},
  },
  plugin: function () {
    return {
      name: this.name,
      setup(aibitat) {
        aibitat.function({
          super: aibitat,
          name: this.name,
          countTokens: (string) =>
            tiktoken
              .countFromString(string)
              .toString()
              .replace(/\B(?=(\d{3})+(?!\d))/g, ","),
          description:
            "Searches for a given query using a search engine to get better results for the user query.",
          examples: [
            {
              prompt: "Who won the world series today?",
              call: JSON.stringify({ query: "Winner of today's world series" }),
            },
            {
              prompt: "What is AnythingLLM?",
              call: JSON.stringify({ query: "AnythingLLM" }),
            },
            {
              prompt: "Current AAPL stock price",
              call: JSON.stringify({ query: "AAPL stock price today" }),
            },
          ],
          parameters: {
            $schema: "http://json-schema.org/draft-07/schema#",
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "A search query.",
              },
            },
            additionalProperties: false,
          },
          handler: async function ({ query }) {
            const startTime = Date.now();
            this.super.handlerProps.log(
              `[web-browsing] Handler invoked with query: "${query || 'undefined'}"`
            );
            
            try {
              if (!query || query.trim().length === 0) {
                this.super.handlerProps.log(
                  `[web-browsing] ERROR: Empty or invalid query provided`
                );
                return "There is nothing we can do. This function call returns no information.";
              }
              
              const result = await this.search(query);
              const duration = Date.now() - startTime;
              this.super.handlerProps.log(
                `[web-browsing] Handler completed successfully in ${duration}ms`
              );
              return result;
            } catch (error) {
              const duration = Date.now() - startTime;
              this.super.handlerProps.log(
                `[web-browsing] ERROR: Handler failed after ${duration}ms - ${error.message}`
              );
              this.super.handlerProps.log(
                `[web-browsing] ERROR Stack: ${error.stack}`
              );
              return `There was an error while calling the function. No data or response was found. Let the user know this was the error: ${error.message}`;
            }
          },

          /**
           * Use Google Custom Search Engines
           * Free to set up, easy to use, 100 calls/day!
           * https://programmablesearchengine.google.com/controlpanel/create
           */
          search: async function (query) {
            this.super.handlerProps.log(
              `[web-browsing] Starting search for query: "${query}"`
            );
            
            let provider;
            try {
              const providerSetting = await SystemSettings.get({ label: "agent_search_provider" });
              provider = providerSetting?.value ?? "unknown";
              this.super.handlerProps.log(
                `[web-browsing] Retrieved search provider setting: "${provider}"`
              );
            } catch (error) {
              this.super.handlerProps.log(
                `[web-browsing] ERROR: Failed to retrieve search provider setting - ${error.message}`
              );
              provider = "unknown";
            }
            
            let engine;
            switch (provider) {
              case "google-search-engine":
                engine = "_googleSearchEngine";
                break;
              case "searchapi":
                engine = "_searchApi";
                break;
              case "serper-dot-dev":
                engine = "_serperDotDev";
                break;
              case "bing-search":
                engine = "_bingWebSearch";
                break;
              case "serply-engine":
                engine = "_serplyEngine";
                break;
              case "searxng-engine":
                engine = "_searXNGEngine";
                break;
              case "tavily-search":
                engine = "_tavilySearch";
                break;
              case "duckduckgo-engine":
                engine = "_duckDuckGoEngine";
                break;
              case "exa-search":
                engine = "_exaSearch";
                break;
              default:
                this.super.handlerProps.log(
                  `[web-browsing] WARNING: Unknown provider "${provider}", falling back to Google Search Engine`
                );
                engine = "_googleSearchEngine";
            }
            
            this.super.handlerProps.log(
              `[web-browsing] Using search engine: ${engine} (provider: ${provider})`
            );
            
            const searchStartTime = Date.now();
            try {
              const result = await this[engine](query);
              const searchDuration = Date.now() - searchStartTime;
              this.super.handlerProps.log(
                `[web-browsing] Search completed successfully in ${searchDuration}ms using ${engine}`
              );
              return result;
            } catch (error) {
              const searchDuration = Date.now() - searchStartTime;
              this.super.handlerProps.log(
                `[web-browsing] ERROR: Search failed after ${searchDuration}ms using ${engine} - ${error.message}`
              );
              throw error;
            }
          },

          /**
           * Utility function to truncate a string to a given length for debugging
           * calls to the API while keeping the actual values mostly intact
           * @param {string} str - The string to truncate
           * @param {number} length - The length to truncate the string to
           * @returns {string} The truncated string
           */
          middleTruncate(str, length = 5) {
            if (str.length <= length) return str;
            return `${str.slice(0, length)}...${str.slice(-length)}`;
          },

          /**
           * Use Google Custom Search Engines
           * Free to set up, easy to use, 100 calls/day
           * https://programmablesearchengine.google.com/controlpanel/create
           */
          _googleSearchEngine: async function (query) {
            this.super.handlerProps.log(
              `[web-browsing] [GoogleSearchEngine] Starting search for: "${query}"`
            );
            
            if (!process.env.AGENT_GSE_CTX || !process.env.AGENT_GSE_KEY) {
              this.super.handlerProps.log(
                `[web-browsing] [GoogleSearchEngine] ERROR: Missing required environment variables - AGENT_GSE_CTX: ${!!process.env.AGENT_GSE_CTX}, AGENT_GSE_KEY: ${!!process.env.AGENT_GSE_KEY}`
              );
              this.super.introspect(
                `${this.caller}: I can't use Google searching because the user has not defined the required API keys.\nVisit: https://programmablesearchengine.google.com/controlpanel/create to create the API keys.`
              );
              return `Search is disabled and no content was found. This functionality is disabled because the user has not set it up yet.`;
            }

            const searchURL = new URL(
              "https://www.googleapis.com/customsearch/v1"
            );
            searchURL.searchParams.append("key", process.env.AGENT_GSE_KEY);
            searchURL.searchParams.append("cx", process.env.AGENT_GSE_CTX);
            searchURL.searchParams.append("q", query);
            
            this.super.handlerProps.log(
              `[web-browsing] [GoogleSearchEngine] Constructed search URL: ${searchURL.toString().replace(process.env.AGENT_GSE_KEY, '[REDACTED]')}`
            );

            this.super.introspect(
              `${this.caller}: Searching on Google for "${
                query.length > 100 ? `${query.slice(0, 100)}...` : query
              }"`
            );
            const requestStartTime = Date.now();
            const data = await fetch(searchURL)
              .then((res) => {
                const requestDuration = Date.now() - requestStartTime;
                this.super.handlerProps.log(
                  `[web-browsing] [GoogleSearchEngine] API request completed in ${requestDuration}ms with status: ${res.status}`
                );
                if (res.ok) return res.json();
                throw new Error(
                  `${res.status} - ${res.statusText}. params: ${JSON.stringify({ key: this.middleTruncate(process.env.AGENT_GSE_KEY, 5), cx: this.middleTruncate(process.env.AGENT_GSE_CTX, 5), q: query })}`
                );
              })
              .then((searchResult) => {
                this.super.handlerProps.log(
                  `[web-browsing] [GoogleSearchEngine] Raw API response received with ${searchResult?.items?.length || 0} items`
                );
                return searchResult?.items || [];
              })
              .then((items) => {
                const processedItems = items.map((item) => {
                  return {
                    title: item.title,
                    link: item.link,
                    snippet: item.snippet,
                  };
                });
                this.super.handlerProps.log(
                  `[web-browsing] [GoogleSearchEngine] Processed ${processedItems.length} search results`
                );
                return processedItems;
              })
              .catch((e) => {
                const requestDuration = Date.now() - requestStartTime;
                this.super.handlerProps.log(
                  `[web-browsing] [GoogleSearchEngine] ERROR: Request failed after ${requestDuration}ms - ${e.message}`
                );
                this.super.handlerProps.log(
                  `${this.name}: Google Search Error: ${e.message}`
                );
                return [];
              });

            if (data.length === 0) {
              this.super.handlerProps.log(
                `[web-browsing] [GoogleSearchEngine] No results found for query: "${query}"`
              );
              return `No information was found online for the search query.`;
            }

            const result = JSON.stringify(data);
            const tokenCount = this.countTokens(result);
            this.super.handlerProps.log(
              `[web-browsing] [GoogleSearchEngine] Returning ${data.length} results (~${tokenCount} tokens)`
            );
            this.super.introspect(
              `${this.caller}: I found ${data.length} results - reviewing the results now. (~${tokenCount} tokens)`
            );
            return result;
          },

          /**
           * Use SearchApi
           * SearchApi supports multiple search engines like Google Search, Bing Search, Baidu Search, Google News, YouTube, and many more.
           * https://www.searchapi.io/
           */
          _searchApi: async function (query) {
            if (!process.env.AGENT_SEARCHAPI_API_KEY) {
              this.super.introspect(
                `${this.caller}: I can't use SearchApi searching because the user has not defined the required API key.\nVisit: https://www.searchapi.io/ to create the API key for free.`
              );
              return `Search is disabled and no content was found. This functionality is disabled because the user has not set it up yet.`;
            }

            this.super.introspect(
              `${this.caller}: Using SearchApi to search for "${
                query.length > 100 ? `${query.slice(0, 100)}...` : query
              }"`
            );

            const engine = process.env.AGENT_SEARCHAPI_ENGINE;
            const params = new URLSearchParams({
              engine: engine,
              q: query,
            });

            const url = `https://www.searchapi.io/api/v1/search?${params.toString()}`;
            const { response, error } = await fetch(url, {
              method: "GET",
              headers: {
                Authorization: `Bearer ${process.env.AGENT_SEARCHAPI_API_KEY}`,
                "Content-Type": "application/json",
                "X-SearchApi-Source": "AnythingLLM",
              },
            })
              .then((res) => {
                if (res.ok) return res.json();
                throw new Error(
                  `${res.status} - ${res.statusText}. params: ${JSON.stringify({ auth: this.middleTruncate(process.env.AGENT_SEARCHAPI_API_KEY, 5), q: query })}`
                );
              })
              .then((data) => {
                return { response: data, error: null };
              })
              .catch((e) => {
                this.super.handlerProps.log(`SearchApi Error: ${e.message}`);
                return { response: null, error: e.message };
              });
            if (error)
              return `There was an error searching for content. ${error}`;

            const data = [];
            if (response.hasOwnProperty("knowledge_graph"))
              data.push(response.knowledge_graph?.description);
            if (response.hasOwnProperty("answer_box"))
              data.push(response.answer_box?.answer);
            response.organic_results?.forEach((searchResult) => {
              const { title, link, snippet } = searchResult;
              data.push({
                title,
                link,
                snippet,
              });
            });

            if (data.length === 0)
              return `No information was found online for the search query.`;

            const result = JSON.stringify(data);
            this.super.introspect(
              `${this.caller}: I found ${data.length} results - reviewing the results now. (~${this.countTokens(result)} tokens)`
            );
            return result;
          },

          /**
           * Use Serper.dev
           * Free to set up, easy to use, 2,500 calls for free one-time
           * https://serper.dev
           */
          _serperDotDev: async function (query) {
            if (!process.env.AGENT_SERPER_DEV_KEY) {
              this.super.introspect(
                `${this.caller}: I can't use Serper.dev searching because the user has not defined the required API key.\nVisit: https://serper.dev to create the API key for free.`
              );
              return `Search is disabled and no content was found. This functionality is disabled because the user has not set it up yet.`;
            }

            this.super.introspect(
              `${this.caller}: Using Serper.dev to search for "${
                query.length > 100 ? `${query.slice(0, 100)}...` : query
              }"`
            );
            const { response, error } = await fetch(
              "https://google.serper.dev/search",
              {
                method: "POST",
                headers: {
                  "X-API-KEY": process.env.AGENT_SERPER_DEV_KEY,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ q: query }),
                redirect: "follow",
              }
            )
              .then((res) => {
                if (res.ok) return res.json();
                throw new Error(
                  `${res.status} - ${res.statusText}. params: ${JSON.stringify({ auth: this.middleTruncate(process.env.AGENT_SERPER_DEV_KEY, 5), q: query })}`
                );
              })
              .then((data) => {
                return { response: data, error: null };
              })
              .catch((e) => {
                this.super.handlerProps.log(`Serper.dev Error: ${e.message}`);
                return { response: null, error: e.message };
              });
            if (error)
              return `There was an error searching for content. ${error}`;

            const data = [];
            if (response.hasOwnProperty("knowledgeGraph"))
              data.push(response.knowledgeGraph);
            response.organic?.forEach((searchResult) => {
              const { title, link, snippet } = searchResult;
              data.push({
                title,
                link,
                snippet,
              });
            });

            if (data.length === 0)
              return `No information was found online for the search query.`;

            const result = JSON.stringify(data);
            this.super.introspect(
              `${this.caller}: I found ${data.length} results - reviewing the results now. (~${this.countTokens(result)} tokens)`
            );
            return result;
          },
          _bingWebSearch: async function (query) {
            if (!process.env.AGENT_BING_SEARCH_API_KEY) {
              this.super.introspect(
                `${this.caller}: I can't use Bing Web Search because the user has not defined the required API key.\nVisit: https://portal.azure.com/ to create the API key.`
              );
              return `Search is disabled and no content was found. This functionality is disabled because the user has not set it up yet.`;
            }

            const searchURL = new URL(
              "https://api.bing.microsoft.com/v7.0/search"
            );
            searchURL.searchParams.append("q", query);

            this.super.introspect(
              `${this.caller}: Using Bing Web Search to search for "${
                query.length > 100 ? `${query.slice(0, 100)}...` : query
              }"`
            );

            const searchResponse = await fetch(searchURL, {
              headers: {
                "Ocp-Apim-Subscription-Key":
                  process.env.AGENT_BING_SEARCH_API_KEY,
              },
            })
              .then((res) => {
                if (res.ok) return res.json();
                throw new Error(
                  `${res.status} - ${res.statusText}. params: ${JSON.stringify({ auth: this.middleTruncate(process.env.AGENT_BING_SEARCH_API_KEY, 5), q: query })}`
                );
              })
              .then((data) => {
                const searchResults = data.webPages?.value || [];
                return searchResults.map((result) => ({
                  title: result.name,
                  link: result.url,
                  snippet: result.snippet,
                }));
              })
              .catch((e) => {
                this.super.handlerProps.log(
                  `Bing Web Search Error: ${e.message}`
                );
                return [];
              });

            if (searchResponse.length === 0)
              return `No information was found online for the search query.`;

            const result = JSON.stringify(searchResponse);
            this.super.introspect(
              `${this.caller}: I found ${searchResponse.length} results - reviewing the results now. (~${this.countTokens(result)} tokens)`
            );
            return result;
          },
          _serplyEngine: async function (
            query,
            language = "en",
            hl = "us",
            limit = 100,
            device_type = "desktop",
            proxy_location = "US"
          ) {
            //  query (str): The query to search for
            //  hl (str): Host Language code to display results in (reference https://developers.google.com/custom-search/docs/xml_results?hl=en#wsInterfaceLanguages)
            //  limit (int): The maximum number of results to return [10-100, defaults to 100]
            //  device_type: get results based on desktop/mobile (defaults to desktop)

            if (!process.env.AGENT_SERPLY_API_KEY) {
              this.super.introspect(
                `${this.caller}: I can't use Serply.io searching because the user has not defined the required API key.\nVisit: https://serply.io to create the API key for free.`
              );
              return `Search is disabled and no content was found. This functionality is disabled because the user has not set it up yet.`;
            }

            this.super.introspect(
              `${this.caller}: Using Serply to search for "${
                query.length > 100 ? `${query.slice(0, 100)}...` : query
              }"`
            );

            const params = new URLSearchParams({
              q: query,
              language: language,
              hl,
              gl: proxy_location.toUpperCase(),
            });
            const url = `https://api.serply.io/v1/search/${params.toString()}`;
            const { response, error } = await fetch(url, {
              method: "GET",
              headers: {
                "X-API-KEY": process.env.AGENT_SERPLY_API_KEY,
                "Content-Type": "application/json",
                "User-Agent": "anything-llm",
                "X-Proxy-Location": proxy_location,
                "X-User-Agent": device_type,
              },
            })
              .then((res) => {
                if (res.ok) return res.json();
                throw new Error(
                  `${res.status} - ${res.statusText}. params: ${JSON.stringify({ auth: this.middleTruncate(process.env.AGENT_SERPLY_API_KEY, 5), q: query })}`
                );
              })
              .then((data) => {
                if (data?.message === "Unauthorized")
                  throw new Error(
                    "Unauthorized. Please double check your AGENT_SERPLY_API_KEY"
                  );
                return { response: data, error: null };
              })
              .catch((e) => {
                this.super.handlerProps.log(`Serply Error: ${e.message}`);
                return { response: null, error: e.message };
              });

            if (error)
              return `There was an error searching for content. ${error}`;

            const data = [];
            response.results?.forEach((searchResult) => {
              const { title, link, description } = searchResult;
              data.push({
                title,
                link,
                snippet: description,
              });
            });

            if (data.length === 0)
              return `No information was found online for the search query.`;

            const result = JSON.stringify(data);
            this.super.introspect(
              `${this.caller}: I found ${data.length} results - reviewing the results now. (~${this.countTokens(result)} tokens)`
            );
            return result;
          },
          _searXNGEngine: async function (query) {
            this.super.handlerProps.log(
              `[web-browsing] [SearXNGEngine] Starting search for: "${query}"`
            );
            
            let searchURL;
            if (!process.env.AGENT_SEARXNG_API_URL) {
              this.super.handlerProps.log(
                `[web-browsing] [SearXNGEngine] ERROR: Missing required environment variable AGENT_SEARXNG_API_URL`
              );
              this.super.introspect(
                `${this.caller}: I can't use SearXNG searching because the user has not defined the required base URL.\nPlease set this value in the agent skill settings.`
              );
              return `Search is disabled and no content was found. This functionality is disabled because the user has not set it up yet.`;
            }

            try {
              searchURL = new URL(process.env.AGENT_SEARXNG_API_URL);
              searchURL.searchParams.append("q", encodeURIComponent(query));
              searchURL.searchParams.append("format", "json");
              this.super.handlerProps.log(
                `[web-browsing] [SearXNGEngine] Constructed search URL: ${searchURL.toString()}`
              );
            } catch (e) {
              this.super.handlerProps.log(
                `[web-browsing] [SearXNGEngine] ERROR: Invalid URL provided - ${e.message}`
              );
              this.super.handlerProps.log(`SearXNG Search: ${e.message}`);
              this.super.introspect(
                `${this.caller}: I can't use SearXNG searching because the url provided is not a valid URL.`
              );
              return `Search is disabled and no content was found. This functionality is disabled because the user has not set it up yet.`;
            }

            this.super.introspect(
              `${this.caller}: Using SearXNG to search for "${
                query.length > 100 ? `${query.slice(0, 100)}...` : query
              }"`
            );

            const requestStartTime = Date.now();
            const { response, error } = await fetch(searchURL.toString(), {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                "User-Agent": "anything-llm",
              },
            })
              .then((res) => {
                const requestDuration = Date.now() - requestStartTime;
                this.super.handlerProps.log(
                  `[web-browsing] [SearXNGEngine] API request completed in ${requestDuration}ms with status: ${res.status}`
                );
                if (res.ok) return res.json();
                throw new Error(
                  `${res.status} - ${res.statusText}. params: ${JSON.stringify({ url: searchURL.toString() })}`
                );
              })
              .then((data) => {
                this.super.handlerProps.log(
                  `[web-browsing] [SearXNGEngine] Raw API response received with ${data?.results?.length || 0} results`
                );
                return { response: data, error: null };
              })
              .catch((e) => {
                const requestDuration = Date.now() - requestStartTime;
                this.super.handlerProps.log(
                  `[web-browsing] [SearXNGEngine] ERROR: Request failed after ${requestDuration}ms - ${e.message}`
                );
                this.super.handlerProps.log(
                  `SearXNG Search Error: ${e.message}`
                );
                return { response: null, error: e.message };
              });
            if (error) {
              this.super.handlerProps.log(
                `[web-browsing] [SearXNGEngine] Returning error to user: ${error}`
              );
              return `There was an error searching for content. ${error}`;
            }

            const data = [];
            response.results?.forEach((searchResult) => {
              const { url, title, content, publishedDate } = searchResult;
              data.push({
                title,
                link: url,
                snippet: content,
                publishedDate,
              });
            });
            
            this.super.handlerProps.log(
              `[web-browsing] [SearXNGEngine] Processed ${data.length} search results`
            );

            if (data.length === 0) {
              this.super.handlerProps.log(
                `[web-browsing] [SearXNGEngine] No results found for query: "${query}"`
              );
              return `No information was found online for the search query.`;
            }

            const result = JSON.stringify(data);
            const tokenCount = this.countTokens(result);
            this.super.handlerProps.log(
              `[web-browsing] [SearXNGEngine] Returning ${data.length} results (~${tokenCount} tokens)`
            );
            this.super.introspect(
              `${this.caller}: I found ${data.length} results - reviewing the results now. (~${tokenCount} tokens)`
            );
            return result;
          },
          _tavilySearch: async function (query) {
            if (!process.env.AGENT_TAVILY_API_KEY) {
              this.super.introspect(
                `${this.caller}: I can't use Tavily searching because the user has not defined the required API key.\nVisit: https://tavily.com/ to create the API key.`
              );
              return `Search is disabled and no content was found. This functionality is disabled because the user has not set it up yet.`;
            }

            this.super.introspect(
              `${this.caller}: Using Tavily to search for "${
                query.length > 100 ? `${query.slice(0, 100)}...` : query
              }"`
            );

            const url = "https://api.tavily.com/search";
            const { response, error } = await fetch(url, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                api_key: process.env.AGENT_TAVILY_API_KEY,
                query: query,
              }),
            })
              .then((res) => {
                if (res.ok) return res.json();
                throw new Error(
                  `${res.status} - ${res.statusText}. params: ${JSON.stringify({ auth: this.middleTruncate(process.env.AGENT_TAVILY_API_KEY, 5), q: query })}`
                );
              })
              .then((data) => {
                return { response: data, error: null };
              })
              .catch((e) => {
                this.super.handlerProps.log(
                  `Tavily Search Error: ${e.message}`
                );
                return { response: null, error: e.message };
              });

            if (error)
              return `There was an error searching for content. ${error}`;

            const data = [];
            response.results?.forEach((searchResult) => {
              const { title, url, content } = searchResult;
              data.push({
                title,
                link: url,
                snippet: content,
              });
            });

            if (data.length === 0)
              return `No information was found online for the search query.`;

            const result = JSON.stringify(data);
            this.super.introspect(
              `${this.caller}: I found ${data.length} results - reviewing the results now. (~${this.countTokens(result)} tokens)`
            );
            return result;
          },
          _duckDuckGoEngine: async function (query) {
            this.super.handlerProps.log(
              `[web-browsing] [DuckDuckGoEngine] Starting search for: "${query}"`
            );
            
            this.super.introspect(
              `${this.caller}: Using DuckDuckGo to search for "${
                query.length > 100 ? `${query.slice(0, 100)}...` : query
              }"`
            );

            const searchURL = new URL("https://html.duckduckgo.com/html");
            searchURL.searchParams.append("q", query);
            
            this.super.handlerProps.log(
              `[web-browsing] [DuckDuckGoEngine] Constructed search URL: ${searchURL.toString()}`
            );

            const requestStartTime = Date.now();
            const response = await fetch(searchURL.toString())
              .then((res) => {
                const requestDuration = Date.now() - requestStartTime;
                this.super.handlerProps.log(
                  `[web-browsing] [DuckDuckGoEngine] API request completed in ${requestDuration}ms with status: ${res.status}`
                );
                if (res.ok) return res.text();
                throw new Error(
                  `${res.status} - ${res.statusText}. params: ${JSON.stringify({ url: searchURL.toString() })}`
                );
              })
              .catch((e) => {
                const requestDuration = Date.now() - requestStartTime;
                this.super.handlerProps.log(
                  `[web-browsing] [DuckDuckGoEngine] ERROR: Request failed after ${requestDuration}ms - ${e.message}`
                );
                this.super.handlerProps.log(
                  `DuckDuckGo Search Error: ${e.message}`
                );
                return null;
              });

            if (!response) {
              this.super.handlerProps.log(
                `[web-browsing] [DuckDuckGoEngine] No response received from DuckDuckGo`
              );
              return `There was an error searching DuckDuckGo.`;
            }
            
            this.super.handlerProps.log(
              `[web-browsing] [DuckDuckGoEngine] Received HTML response, parsing results...`
            );
            
            const html = response;
            const data = [];
            const results = html.split('<div class="result results_links');

            // Skip first element since it's before the first result
            for (let i = 1; i < results.length; i++) {
              const result = results[i];

              // Extract title
              const titleMatch = result.match(
                /<a[^>]*class="result__a"[^>]*>(.*?)<\/a>/
              );
              const title = titleMatch ? titleMatch[1].trim() : "";

              // Extract URL
              const urlMatch = result.match(
                /<a[^>]*class="result__a"[^>]*href="([^"]*)">/
              );
              const link = urlMatch ? urlMatch[1] : "";

              // Extract snippet
              const snippetMatch = result.match(
                /<a[^>]*class="result__snippet"[^>]*>(.*?)<\/a>/
              );
              const snippet = snippetMatch
                ? snippetMatch[1].replace(/<\/?b>/g, "").trim()
                : "";

              if (title && link && snippet) {
                data.push({ title, link, snippet });
              }
            }

            this.super.handlerProps.log(
              `[web-browsing] [DuckDuckGoEngine] Parsed ${data.length} results from HTML response`
            );

            if (data.length === 0) {
              this.super.handlerProps.log(
                `[web-browsing] [DuckDuckGoEngine] No results found for query: "${query}"`
              );
              return `No information was found online for the search query.`;
            }

            const result = JSON.stringify(data);
            const tokenCount = this.countTokens(result);
            this.super.handlerProps.log(
              `[web-browsing] [DuckDuckGoEngine] Returning ${data.length} results (~${tokenCount} tokens)`
            );
            this.super.introspect(
              `${this.caller}: I found ${data.length} results - reviewing the results now. (~${tokenCount} tokens)`
            );
            return result;
          },
          _exaSearch: async function (query) {
            if (!process.env.AGENT_EXA_API_KEY) {
              this.super.introspect(
                `${this.caller}: I can't use Exa searching because the user has not defined the required API key.\nVisit: https://exa.ai to create the API key.`
              );
              return `Search is disabled and no content was found. This functionality is disabled because the user has not set it up yet.`;
            }

            this.super.introspect(
              `${this.caller}: Using Exa to search for "${
                query.length > 100 ? `${query.slice(0, 100)}...` : query
              }"`
            );

            const url = "https://api.exa.ai/search";
            const { response, error } = await fetch(url, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-api-key": process.env.AGENT_EXA_API_KEY,
              },
              body: JSON.stringify({
                query: query,
                type: "auto",
                numResults: 10,
                contents: {
                  text: true,
                },
              }),
            })
              .then((res) => {
                if (res.ok) return res.json();
                throw new Error(
                  `${res.status} - ${res.statusText}. params: ${JSON.stringify({ auth: this.middleTruncate(process.env.AGENT_EXA_API_KEY, 5), q: query })}`
                );
              })
              .then((data) => {
                return { response: data, error: null };
              })
              .catch((e) => {
                this.super.handlerProps.log(`Exa Search Error: ${e.message}`);
                return { response: null, error: e.message };
              });

            if (error)
              return `There was an error searching for content. ${error}`;

            const data = [];
            response.results?.forEach((searchResult) => {
              const { title, url, text, publishedDate } = searchResult;
              data.push({
                title,
                link: url,
                snippet: text,
                publishedDate,
              });
            });

            if (data.length === 0)
              return `No information was found online for the search query.`;

            const result = JSON.stringify(data);
            this.super.introspect(
              `${this.caller}: I found ${data.length} results - reviewing the results now. (~${this.countTokens(result)} tokens)`
            );
            return result;
          },
        });
      },
    };
  },
};

module.exports = {
  webBrowsing,
};
