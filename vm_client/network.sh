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

configure_traditional() {
    CFG_FILE="/etc/network/interfaces.d/${INTERFACE}.cfg"
    echo "Configure with /etc/network/interfaces.d/"

    ip addr flush dev $INTERFACE
    
    echo "auto ${INTERFACE}" > $CFG_FILE
    echo "iface ${INTERFACE} inet static" >> $CFG_FILE
    echo "    address ${IPADDR}" >> $CFG_FILE
    echo "    netmask ${NETMASK}" >> $CFG_FILE

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
    echo "Finished. The IP address ${IPADDR}/${NETMASK} has been configured on ${INTERFACE}."
}

# check if netplan is installed
if command -v netplan >/dev/null 2>&1; then
    configure_netplan
else
    configure_traditional
fi
