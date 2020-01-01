# MeshCentral-RoutePlus

Port routing plugin for the [MeshCentral2](https://github.com/Ylianst/MeshCentral) Project.

## Installation

 Pre-requisite: First, make sure you have plugins enabled for your MeshCentral installation by adding this to the settings section of your './meshcentral/meshcentral-data/config.json' file:
>     "plugins": {
>          "enabled": true
>     },
Restart your MeshCentral server after making this change.

 To install, simply add the plugin configuration URL when prompted:
 `https://raw.githubusercontent.com/ryanblenis/MeshCentral-RoutePlus/master/config.json`

## Features
This plugin allows users to map local ports to remote ports on machines through the MeshCentral server, similar to how MeshCmd with an actions.txt forwards a port. However, instead of having MeshCmd, the user only needs a Mesh Agent installed on each machine.

- Supports multiple ports and endpoints simultaneously
- Settings are saved on the MeshCentral server
- Users can re-map ports and computers on the fly
- Port forwarding is activated on login to MeshCentral

## Usage Notes
- Active port maps can always be viewed and changed under "My Account" > "Account Actions" > "RoutePlus"
- Tunnels are created in the same way that MeshCmd creates them, and subject to the same authentication.
- Source ports are randomly generated, however they use a "best efforts" approach to keep the same source port for as long as you have the mapping in place. If the port is found to be in use, it will be re-mapped (and can always be viewed in the settings)

## Getting Started
1. Head over to "My Account" > "Account Actions" > "RoutePlus"
2. In the Node Selection (left) side, choose "Set" on the computer you use on a daily basis to set a computer as "My Computer"
This is "your" computer where the ports will be mapped similar to where you would run MeshCmd.
3. In the Node Selection list, choose the computer(s) and protocol(s) you'd like to forward and click "Add"
4. The node will now appear in the "Active Mappings" section
5. Note the "Source Port" for this service. You can now connect to "localhost:<source port>" on the "My Computer" node and be redirected to that nodes protocol that was chosen in step 3.

## Screenshots

![Settings](https://user-images.githubusercontent.com/1929277/71492397-ef6b7a80-2804-11ea-9bf6-695192430aa6.png)
