# SearXNG Setup Guide for AnythingLLM

This guide will help you set up SearXNG as your internet search provider for AnythingLLM.

## Overview

SearXNG is a free, open-source, internet meta-search engine that:
- Aggregates results from multiple search engines
- Provides privacy by not tracking users
- Runs locally without external API dependencies
- Requires no API keys or subscriptions

## Quick Start

### 1. Start the Services

From the `docker` directory, run:

```bash
docker-compose up -d
```

This will start both AnythingLLM and SearXNG services.

### 2. Verify SearXNG is Running

Open your browser and go to: http://localhost:8080

You should see the SearXNG search interface.

### 3. Configure AnythingLLM

1. Open AnythingLLM at: http://localhost:3001
2. Go to Admin Settings → Agent Configuration → Web Search
3. Select "SearXNG" as your search provider
4. Enter the SearXNG API Base URL: `http://searxng:8080`
5. Save the configuration

### 4. Environment Variables

Add this to your `.env` file in the docker directory:

```bash
# SearXNG Configuration
AGENT_SEARXNG_API_URL=http://searxng:8080
```

## ✅ What's Been Set Up

The following has been configured for you:

1. **Docker Compose Configuration**: SearXNG service added to `docker-compose.yml`
2. **SearXNG Configuration**: Optimized `settings.yml` with JSON API enabled
3. **Network Integration**: Both services on the same Docker network
4. **Search Engines**: DuckDuckGo, Startpage, Wikipedia, and Bing enabled
5. **Bot Detection**: Configured to allow JSON API access from AnythingLLM
6. **Rate Limiting**: Configured to allow Docker network access

## ✅ Verified Working

- ✅ SearXNG JSON API is responding correctly
- ✅ Search results are being returned in proper format
- ✅ Multiple search engines are working (DuckDuckGo, Bing, Startpage, Wikipedia)
- ✅ Docker network connectivity established

## Configuration Details

### SearXNG Settings

The SearXNG configuration is located in `./searxng/settings.yml` and includes:

- **Multiple Search Engines**: DuckDuckGo, Google, Bing, Startpage, Wikipedia
- **Rate Limiting**: Prevents abuse and ensures stability
- **JSON API**: Enabled for AnythingLLM integration
- **Privacy Features**: No user tracking, IP anonymization

### Network Configuration

- SearXNG runs on port 8080
- AnythingLLM communicates with SearXNG via Docker internal network
- Both services are on the same `anything-llm` Docker network

## Customization

### Adding More Search Engines

Edit `./searxng/settings.yml` to add or configure search engines:

```yaml
engines:
  - name: your-engine
    engine: engine-type
    shortcut: shortcut
    disabled: false
```

### Changing Rate Limits

Edit `./searxng/limiter.toml` to adjust rate limiting:

```toml
[botdetection.ip_limit]
# Concurrent search requests per IP
# Adjust based on your usage needs
```

### Security Configuration

1. Change the secret key in `settings.yml`:
   ```yaml
   server:
     secret_key: "your-unique-secret-key-here"
   ```

2. Configure IP allowlists in `limiter.toml` if needed

## Troubleshooting

### SearXNG Not Starting

1. Check logs: `docker logs searxng`
2. Verify port 8080 is not in use: `lsof -i :8080`
3. Ensure configuration files have correct permissions

### Search Not Working in AnythingLLM

1. Verify SearXNG URL is accessible: `curl http://localhost:8080`
2. Check AnythingLLM agent configuration
3. Ensure search provider is set to "searxng-engine"
4. Check AnythingLLM logs: `docker logs anythingllm`

### Configuration Issues

1. Validate YAML syntax in `settings.yml`
2. Check TOML syntax in `limiter.toml`
3. Restart services: `docker-compose restart`

## Testing the Integration

1. Create a workspace in AnythingLLM
2. Enable the web browsing agent skill
3. Ask a question that requires current information
4. Verify search results are returned

Example test queries:
- "What's the current weather in New York?"
- "Latest news about artificial intelligence"
- "Current stock price of Apple"

## Performance Optimization

### For High Usage

1. Increase worker count in `uwsgi.ini`:
   ```ini
   workers = 8
   threads = 8
   ```

2. Adjust rate limits in `limiter.toml`

3. Configure caching (if needed)

### For Low Resources

1. Reduce worker count:
   ```ini
   workers = 2
   threads = 2
   ```

2. Disable unused search engines in `settings.yml`

## Security Best Practices

1. **Change default secret key** in `settings.yml`
2. **Configure firewall** to limit access to port 8080
3. **Use HTTPS** in production environments
4. **Regular updates** of SearXNG Docker image
5. **Monitor logs** for unusual activity

## Alternative Setup (External SearXNG)

If you want to use an external SearXNG instance:

1. Install SearXNG on a separate server
2. Update the environment variable:
   ```bash
   AGENT_SEARXNG_API_URL=https://your-searxng-instance.com
   ```
3. Remove the SearXNG service from `docker-compose.yml`

## Monitoring

### Health Checks

SearXNG health: `curl http://localhost:8080/healthz`

### Log Monitoring

```bash
# SearXNG logs
docker logs -f searxng

# AnythingLLM logs
docker logs -f anythingllm
```

## Support

- SearXNG Documentation: https://docs.searxng.org/
- AnythingLLM Documentation: https://docs.anythingllm.com/
- GitHub Issues: Report integration issues in the AnythingLLM repository
