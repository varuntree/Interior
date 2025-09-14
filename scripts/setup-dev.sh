#!/bin/bash

# QuickDesignHome - Development Setup Script
# This script helps set up local development using Cloudflare Tunnel for webhook support.

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

# Ensure .env.local exists
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

# Check if cloudflared is installed
if command -v cloudflared &> /dev/null; then
  echo -e "${GREEN}✓${NC} cloudflared is installed"
else
  echo -e "${YELLOW}⚠${NC} cloudflared (Cloudflare Tunnel) is not installed"
  echo "  Please install it first:"
  echo "    • macOS (Homebrew):   brew install cloudflare/cloudflare/cloudflared"
  echo "    • Linux:              https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/"
  echo "    • Windows (MSI):      https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/"
  exit 1
fi

# Check if NEXT_PUBLIC_APP_URL is set in .env.local
if grep -q "^NEXT_PUBLIC_APP_URL=" .env.local && ! grep -q "your-url-here" .env.local; then
  echo -e "${GREEN}✓${NC} NEXT_PUBLIC_APP_URL is configured"
  CURRENT_URL=$(grep "^NEXT_PUBLIC_APP_URL=" .env.local | cut -d'=' -f2)
  echo "  Current URL: ${CURRENT_URL}"
  read -p "Do you want to update it with a new Cloudflare Tunnel URL? (y/N): " -r
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
  echo -e "${BLUE}🌐 Start a Cloudflare Tunnel in another terminal:${NC}"
  echo "    cloudflared tunnel --url http://localhost:3000"
  echo ""
  echo "Paste the HTTPS Cloudflare URL (e.g., https://<random>.trycloudflare.com):"
  read -r CF_URL

  if [[ -z "$CF_URL" ]]; then
    echo -e "${RED}✗${NC} No URL provided. Aborting."
    exit 1
  fi
  if [[ "$CF_URL" != https://* ]]; then
    echo -e "${RED}✗${NC} URL must start with https://"
    exit 1
  fi

  # Update .env.local with the provided URL
  if grep -q "^NEXT_PUBLIC_APP_URL=" .env.local; then
    # Replace existing line
    sed -i.bak "s|^NEXT_PUBLIC_APP_URL=.*|NEXT_PUBLIC_APP_URL=${CF_URL}|" .env.local
  else
    # Add new line
    echo "NEXT_PUBLIC_APP_URL=${CF_URL}" >> .env.local
  fi

  echo -e "${GREEN}✓${NC} Updated NEXT_PUBLIC_APP_URL in .env.local"
fi

echo ""
echo -e "${GREEN}🎉 Setup complete!${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. ${YELLOW}Start Cloudflare Tunnel:${NC} cloudflared tunnel --url http://localhost:3000"
echo "2. ${YELLOW}Copy the HTTPS URL${NC} from the cloudflared output"
echo "3. ${YELLOW}Update .env.local:${NC} NEXT_PUBLIC_APP_URL=https://<random>.trycloudflare.com"
echo "4. ${YELLOW}Start development server:${NC} npm run dev"
echo ""
echo -e "${BLUE}💡 Tips:${NC}"
echo "• Keep cloudflared running in a separate terminal while developing"
echo "• Each time you restart cloudflared, update NEXT_PUBLIC_APP_URL if the URL changed"
echo "• For a stable URL, use a named Cloudflare Tunnel and DNS hostname"
echo "• Generation features require the HTTPS URL for webhooks"
echo ""
echo -e "${BLUE}📖 Need help?${NC}"
echo "• Check README.md for detailed setup instructions"
echo "• Cloudflare Tunnel docs: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/"
echo ""

