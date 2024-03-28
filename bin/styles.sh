#!/bin/bash
BOLD='\033[1m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

function title1 {
  echo "============================================"
  echo "=== $1"
  echo "============================================"
}

function title2 {
  echo ""
  echo "=== $1"
}

function error {
# Colorize the output
    echo -e "${RED}Error: $1${NC}"
    exit 1
}

function success {
# Colorize the output
    echo -e "${GREEN}OK${NC} - $1"
}

function ask {
  echo -ne "${BOLD}$1${NC}"
  read response
}
