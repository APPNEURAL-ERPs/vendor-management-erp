#!/bin/bash

echo "=== MediaOS API Test Suite ==="
echo ""

# Test health endpoint
echo "1. Testing Health Check..."
curl -s http://localhost:6300/health | head -20
echo ""
echo ""

# Test overview endpoint
echo "2. Testing Overview..."
curl -s -H "x-role: admin" http://localhost:6300/mediaos/overview | head -20
echo ""
echo ""

# Test list libraries
echo "3. Testing List Libraries..."
curl -s -H "x-role: media_manager" http://localhost:6300/mediaos/libraries | head -30
echo ""
echo ""

# Test list assets
echo "4. Testing List Assets..."
curl -s -H "x-role: media_manager" http://localhost:6300/mediaos/assets | head -50
echo ""
echo ""

# Test list folders
echo "5. Testing List Folders..."
curl -s -H "x-role: media_manager" http://localhost:6300/mediaos/folders | head -20
echo ""
echo ""

# Test list jobs
echo "6. Testing List Processing Jobs..."
curl -s -H "x-role: admin" http://localhost:6300/mediaos/jobs | head -30
echo ""
echo ""

echo "=== Test Complete ==="
