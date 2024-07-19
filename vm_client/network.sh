#!/bin/bash
# This script can be used to configure a static IP address on vm.


# 
if [[ $EUID -ne 0 ]]; then
   echo "This script must be run as root." 
   exit 1
fi

# Vérification du nombre d'arguments
if [ "$#" -ne 3 ]; then
    echo "Usage: $0 <interface> <ip_address> <netmask>"
    exit 1
fi

INTERFACE=$1
IPADDR=$2
NETMASK=$3

# Check if the interface exists
if ! ip link show $INTERFACE > /dev/null 2>&1; then
    echo "The interface doesn't exists ${INTERFACE}"
    exit 1
fi

# # test the netmask format ex: /24 or 255.255.255.0
# # return 0 if / format
# # return 1 if 255 format
# get_netmask_format() {
#     local netmask=$1
#     #start with / and followed by numbers 
#     if [[ $netmask =~ ^/[0-9]+$ ]]; then
#         # Remove the / before performing the comparison
#         local netmask_value=${netmask:1}
#         if [ $netmask_value -lt 8 ] || [ $netmask_value -gt 30 ]; then
#             echo "Invalid netmask value. It should be between 8 and 30."
#             exit 1
#         fi
#         return 1
#     else 
#         #start by number and followed by 3 dots and numbers
#         if [[ $netmask =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
#             return  0
#         else
#             echo "Invalid netmask format"
#             exit 1
#         fi
#     fi 
# }

configure_traditional() {
    CFG_FILE="/etc/network/interfaces.d/${INTERFACE}.cfg"
    echo "Configure with /etc/network/interfaces.d/"

    ip addr flush dev $INTERFACE
    
    echo "auto ${INTERFACE}" > $CFG_FILE
    echo "iface ${INTERFACE} inet static" >> $CFG_FILE
    echo "    address ${IPADDR}/${NETMASK}" >> $CFG_FILE

    # Remove DHCP configuration if exists
    if grep -q "iface $INTERFACE inet dhcp" /etc/network/interfaces; then
        echo "Suppression de la configuration DHCP pour ${INTERFACE} dans /etc/network/interfaces"
        sed -i "/iface $INTERFACE inet dhcp/d" /etc/network/interfaces
    fi

    echo "IP configuration apply to ${INTERFACE}. Restart the interface..."
    ifdown $INTERFACE && ifup $INTERFACE
    echo "Finished. The IP address ${IPADDR}/${NETMASK} has been configured on ${INTERFACE}."
}

configure_netplan() {
    echo "netplan configuration"
    NETMASK_FORMAT=$?
    NETPLAN_FILE="/etc/netplan/01-netcfg-${INTERFACE}.yaml"

    ip addr flush dev $INTERFACE
    
    echo "network:" > $NETPLAN_FILE
    echo "    version: 2" >> $NETPLAN_FILE
    echo "    ethernets:" >> $NETPLAN_FILE
    echo "        ${INTERFACE}:" >> $NETPLAN_FILE
    echo "            dhcp4: no" >> $NETPLAN_FILE
    echo "            addresses: [${IPADDR}${NETMASK}]" >> $NETPLAN_FILE
    
    echo "IP configuration apply to ${INTERFACE}. Restart the interface..."
    netplan apply
    echo "Finished. The IP address ${IPADDR}${NETMASK} has been configured on ${INTERFACE}."
}

# check if netplan is installed
if command -v netplan >/dev/null 2>&1; then
    configure_netplan
else
    configure_traditional
fi
