#!/bin/bash

# QuickDesignHome - Development Setup Script
# This script helps set up local development with ngrok for webhook support

set -e  # Exit on any error

echo "🏠 QuickDesignHome - Development Setup"
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if .env.local exists
if [ -f ".env.local" ]; then
    echo -e "${GREEN}✓${NC} Found .env.local file"
else
    echo -e "${YELLOW}⚠${NC} No .env.local file found"
    echo "  Creating from .env.local.example..."
    if [ -f ".env.local.example" ]; then
        cp .env.local.example .env.local
        echo -e "${GREEN}✓${NC} Created .env.local from example"
        echo -e "${YELLOW}  Please edit .env.local with your actual values${NC}"
    else
        echo -e "${RED}✗${NC} No .env.local.example found. Please create .env.local manually."
        exit 1
    fi
fi

# Check if ngrok is installed
if command -v ngrok &> /dev/null; then
    echo -e "${GREEN}✓${NC} ngrok is installed"
else
    echo -e "${YELLOW}⚠${NC} ngrok is not installed"
    echo "  Installing ngrok..."
    
    # Try npm install first
    if command -v npm &> /dev/null; then
        npm install -g ngrok
        echo -e "${GREEN}✓${NC} ngrok installed via npm"
    else
        echo -e "${RED}✗${NC} npm not found. Please install ngrok manually:"
        echo "  Visit: https://ngrok.com/download"
        echo "  Or use homebrew: brew install ngrok"
        exit 1
    fi
fi

# Check if NEXT_PUBLIC_APP_URL is set in .env.local
if grep -q "^NEXT_PUBLIC_APP_URL=" .env.local && ! grep -q "your-url-here" .env.local; then
    echo -e "${GREEN}✓${NC} NEXT_PUBLIC_APP_URL is configured"
    CURRENT_URL=$(grep "^NEXT_PUBLIC_APP_URL=" .env.local | cut -d'=' -f2)
    echo "  Current URL: ${CURRENT_URL}"
    
    read -p "Do you want to update it with a new ngrok tunnel? (y/N): " -r
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        UPDATE_URL=true
    else
        UPDATE_URL=false
        echo -e "${BLUE}ℹ${NC} Using existing URL. You can run this script again to update it."
    fi
else
    echo -e "${YELLOW}⚠${NC} NEXT_PUBLIC_APP_URL not configured or using example value"
    UPDATE_URL=true
fi

if [ "$UPDATE_URL" = true ]; then
    echo ""
    echo -e "${BLUE}🌐 Starting ngrok tunnel...${NC}"
    
    # Kill any existing ngrok processes
    pkill ngrok 2>/dev/null || true
    sleep 1
    
    # Start ngrok in background
    ngrok http 3000 > /dev/null &
    NGROK_PID=$!
    
    echo "  Waiting for ngrok to start..."
    sleep 3
    
    # Get the public URL from ngrok API
    NGROK_URL=""
    for i in {1..10}; do
        NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"https://[^"]*' | cut -d'"' -f4 | head -1)
        if [ ! -z "$NGROK_URL" ]; then
            break
        fi
        echo "  Waiting for ngrok URL... (attempt $i/10)"
        sleep 1
    done
    
    if [ -z "$NGROK_URL" ]; then
        echo -e "${RED}✗${NC} Failed to get ngrok URL. Please check if ngrok started correctly."
        kill $NGROK_PID 2>/dev/null || true
        exit 1
    fi
    
    echo -e "${GREEN}✓${NC} ngrok tunnel created: ${NGROK_URL}"
    
    # Update .env.local file
    if grep -q "^NEXT_PUBLIC_APP_URL=" .env.local; then
        # Replace existing line
        sed -i.bak "s|^NEXT_PUBLIC_APP_URL=.*|NEXT_PUBLIC_APP_URL=${NGROK_URL}|" .env.local
    else
        # Add new line
        echo "NEXT_PUBLIC_APP_URL=${NGROK_URL}" >> .env.local
    fi
    
    echo -e "${GREEN}✓${NC} Updated NEXT_PUBLIC_APP_URL in .env.local"
    
    # Kill the background ngrok (we just needed it to get the URL)
    kill $NGROK_PID 2>/dev/null || true
fi

echo ""
echo -e "${GREEN}🎉 Setup complete!${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. ${YELLOW}Start ngrok tunnel:${NC} ngrok http 3000"
echo "2. ${YELLOW}Copy the HTTPS URL${NC} from ngrok output"
echo "3. ${YELLOW}Update .env.local:${NC} NEXT_PUBLIC_APP_URL=https://your-subdomain.ngrok.io"
echo "4. ${YELLOW}Start development server:${NC} npm run dev"
echo ""
echo -e "${BLUE}💡 Tips:${NC}"
echo "• Keep ngrok running in a separate terminal while developing"
echo "• Each time you restart ngrok, update NEXT_PUBLIC_APP_URL"
echo "• For a stable URL, create a free ngrok account"
echo "• Generation features require the HTTPS URL for webhooks"
echo ""
echo -e "${BLUE}📖 Need help?${NC}"
echo "• Check README.md for detailed setup instructions"
echo "• Visit ngrok.com for more information about ngrok"
echo ""
