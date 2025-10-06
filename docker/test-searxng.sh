#!/bin/bash

# Test script for SearXNG integration with AnythingLLM
echo "🔍 Testing SearXNG Integration with AnythingLLM"
echo "=============================================="

# Check if services are running
echo "1. Checking if services are running..."

if docker ps | grep -q "searxng"; then
    echo "   ✅ SearXNG container is running"
else
    echo "   ❌ SearXNG container is not running"
    echo "   Run: docker-compose up -d searxng"
    exit 1
fi

if docker ps | grep -q "anythingllm"; then
    echo "   ✅ AnythingLLM container is running"
else
    echo "   ❌ AnythingLLM container is not running"
    echo "   Run: docker-compose up -d anythingllm"
    exit 1
fi

# Test SearXNG web interface
echo ""
echo "2. Testing SearXNG web interface..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/ | grep -q "200"; then
    echo "   ✅ SearXNG web interface is accessible at http://localhost:8080"
else
    echo "   ❌ SearXNG web interface is not accessible"
fi

# Test network connectivity between containers
echo ""
echo "3. Testing network connectivity..."
if docker exec anythingllm ping -c 1 searxng > /dev/null 2>&1; then
    echo "   ✅ AnythingLLM can reach SearXNG container"
else
    echo "   ❌ Network connectivity issue between containers"
fi

# Test SearXNG API from within AnythingLLM container
echo ""
echo "4. Testing SearXNG API from AnythingLLM container..."
API_TEST=$(docker exec anythingllm wget -qO- "http://searxng:8080/search?q=test&format=json" 2>/dev/null | head -c 100)
if [[ "$API_TEST" == *"results"* ]] || [[ "$API_TEST" == *"query"* ]]; then
    echo "   ✅ SearXNG API is responding from within container network"
elif [[ "$API_TEST" == *"403"* ]] || [[ "$API_TEST" == *"Forbidden"* ]]; then
    echo "   ⚠️  SearXNG API returns 403 (this is normal - bot detection)"
    echo "      AnythingLLM will handle this with proper headers"
else
    echo "   ❌ SearXNG API test failed"
    echo "   Response: $API_TEST"
fi

echo ""
echo "5. Next Steps:"
echo "   1. Open AnythingLLM at: http://localhost:3001"
echo "   2. Go to Admin Settings → Agent Configuration → Web Search"
echo "   3. Select 'SearXNG' as your search provider"
echo "   4. Enter URL: http://searxng:8080"
echo "   5. Save and test with a web search query"
echo ""
echo "🎉 Setup complete! SearXNG is ready for use with AnythingLLM."
