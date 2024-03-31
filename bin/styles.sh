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

function bold {
  echo -e "${BOLD}$1${NC}"
}

function init_dir {
  # Set dir variable to the script directory
  dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
}

function sql_request {
  sql="$1"
  # test if dir is set
  if [ -z "$dir" ]; then
      error "The dir variable is not set"
  fi
  #test if sql is set
  if [ -z "$sql" ]; then
      error "The sql variable is not set"
  fi

  # Connect to the database and execute the SQL request
  source "${dir}/../myapp/.env"

  cd "${dir}/.."
  containers=$(docker-compose images)
  db_container=$(echo "$containers" | cut -d " " -f1 | grep db)
  app_container=$(echo "$containers" | cut -d " " -f1 | grep app)
  # Test if the db_container and app_container are set
  if [ -z "$db_container" ] || [ -z "$app_container" ]; then
      error "The db_container or app_container is not set"
  fi

  #echo "docker exec -it $db_container mariadb -u${DB_USER} -p${DB_PASSWORD} ${DB_NAME} -e ${sql}"
  # mysql -u $DB_USER -p$DB_PASSWORD -h $DB_HOST -D $DB_NAME -e "$sql"
  result=$(docker exec $db_container mariadb -u${DB_USER} -p${DB_PASSWORD} ${DB_NAME} -e "${sql}")

}

function select_machine() {
    sql="SELECT machine_name FROM ctfs_machines WHERE ctf_id = $ctf_id;"
    sql_request "${sql}"
    result=$(echo $result | cut -d ' ' -f2- | tr " " "\n")
    if [ -z "$result" ]; then
        error "No machine/challenge found, run createMachine.sh script to create a machine/challenge"
    fi

    bold "Select a machine/challenge: "
    select machine in $result; do
        if [ -z "$machine" ]; then
            error "Please select a machine"
        else
            break
        fi
    done
}

function select_ctf {
    # List all the ctf from ansible/inventories/*_hosts.yml
    ctfs=$(ls ${dir}/../ansible/inventory/*_hosts.yml | awk -F'/' '{print $NF}' | awk -F'_' '{print $1}')
    # test if the ctfs is empty
    if [ -z "$ctfs" ]; then
        error "No ctf found, run createCtf.sh script to create a ctf"
    fi
    # If there is only one ctf, select it directly
    if [ $(echo $ctfs | wc -w) -eq 1 ]; then
        ctf_name=$(echo $ctfs | cut -d " " -f1)
    else
        # Select a ctf
        title2 "Select a ctf"
        select ctf_name in $ctfs; do
            if [ -z "$ctf_name" ]; then
                error "Please select a ctf"
            else
                break
            fi
        done
    fi 
    # Retrieve the ctf_id from ctf_hosts.yml
    ctf_id=$(grep "ctf_id" ${dir}/../ansible/inventory/${ctf_name}_hosts.yml | cut -d ":" -f2 | tr -d ' ')

    success "Ctf selected : $ctf_name"
}