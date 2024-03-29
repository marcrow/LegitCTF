#!/bin/bash

# Styles used by ctf scripts

BOLD='\033[1m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

function title {
  echo ""
  echo ""
  echo "============================================"
  echo "=== "
  echo "=== $1"
  echo "=== "
  echo "============================================"
  echo ""

}

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
    echo -e "${RED}XXX Error: $1 ${NC}"
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

function askp {
  echo -ne "${BOLD}Enter your password :${NC}"
  read -s password
  echo ""
}

function warning {
  echo -e "${RED}*** Warning: $1 ${NC}"
}

function info {
  echo -e "${BLUE}${BOLD}--- Info: $1 ${NC}"
}