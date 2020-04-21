/** 
* @description MeshCentral RoutePlus Plugin
* @author Ryan Blenis
* @copyright 
* @license Apache-2.0
*/

"use strict";

module.exports.routeplus = function (parent) {
    var obj = {};
    obj.parent = parent;
    obj.meshServer = parent.parent;
    obj.debug = obj.meshServer.debug;
    obj.onlineNodes = [];
    obj.VIEWS = __dirname + '/views/';
    obj.exports = [
      'onWebUIStartupEnd',
      'openSettings',
      'goPageStart',
      'mapUpdate',
      'resizeContent',
      'onDeviceRefreshEnd',
      'setUserRdpLinks',
      'updateUserRdpLinks',
      'dlRDPfile',
      'updateRdpDeviceLinks',
      'cantMap'
    ];
    
    obj.server_startup = function() {
        obj.meshServer.pluginHandler.routeplus_db = require (__dirname + '/db.js').CreateDB(obj.meshServer);
        obj.db = obj.meshServer.pluginHandler.routeplus_db;
    };
    
    obj.onWebUIStartupEnd = function() {
        var ld = document.querySelectorAll('#p2AccountActions > p.mL')[0];
        var as = Q('plugin_routePlusSettings');
        if (as) as.parentNode.removeChild(as);
        var x = '<span id="plugin_routePlusSettings" style="display: block;"><a onclick="pluginHandler.routeplus.openSettings();">RoutePlus</a></span>';
        ld.innerHTML += x;
        pluginHandler.routeplus.updateUserRdpLinks();
    };
    
    obj.updateUserRdpLinks = function() {
        if (userinfo == null) { setTimeout(pluginHandler.routeplus.updateUserRdpLinks, 100); return; }
        meshserver.send({
            'action': 'plugin',
            'plugin': 'routeplus',
            'pluginaction': 'getRdpLinks',
            'user': userinfo._id
        });
    };
    
    obj.updateRdpDeviceLinks = function() {
        var links = document.querySelectorAll('.routePlusRdpLink');
        if (links.length) {
            links.forEach(function(l) {
                l.parentNode.removeChild(l);
            });
        }
        if (pluginHandler.routeplus.myRDPLinks != null) {
            if (currentNode != null && pluginHandler.routeplus.myRDPLinks[currentNode._id] != null) {
                let l = pluginHandler.routeplus.myRDPLinks[currentNode._id];
                var holderC = Q('p10html3'), holder = holderC.querySelectorAll('.p10html3left')[0];
                let tpl = `<a href="#" class="routePlusRdpLink" onclick="pluginHandler.routeplus.dlRDPfile('${l}', '${currentNode.name}');">RoutePlus RDP</a>`;
                holder.insertAdjacentHTML( 'beforeend', tpl );
            }
        }
    };
    
    obj.onDeviceRefreshEnd = function() {
        pluginHandler.routeplus.updateRdpDeviceLinks();
    };
    
    obj.dlRDPfile = function(port, name) {
        var element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + 'full address:s:127.0.0.1:' + port);
        element.setAttribute('download', encodeURIComponent(name) + '.rdp');
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };
    
    obj.hook_userLoggedIn = function(user) {
        var myComp = null;
        const rcookie = parent.parent.encodeCookie({ userid: user._id, domainid: user.domain }, obj.meshServer.loginCookieEncryptionKey);
        obj.debug('PLUGIN', 'RoutePlus', 'User logged in... Processing');
        obj.onlineNodes = Object.keys(obj.meshServer.webserver.wsagents);
        //console.log('s1', obj.meshServer.webserver.wssessions);
        //console.log('s2', Object.keys(obj.meshServer.webserver.wssessions2));
        obj.db.getMyComputer(user._id)
        .then(mys => {
            if (mys.length) {
                myComp = mys[0].node;
            }
            return obj.db.getUserMaps(user._id);
        })
        .then((maps) => {
            if (myComp == null) return;
            obj.debug('PLUGIN', 'RoutePlus', 'Number of user maps found: ' + maps.length);
            if (maps.length == 0) return;
            maps.forEach(map => {
                //if (obj.onlineNodes.indexOf(fromNode) === -1) return; // skip offline nodes
                obj.startRoute(myComp, map, rcookie);
            });
        })
        .catch(e => console.log('PLUGIN: RoutePlus: Error starting routes for user '+ user._id + '. Error was: ', e));
        
    };
    
    obj.hook_agentCoreIsStable = function(myparent, gp) { // check for remaps when an agent logs in
        obj.db.getMyComputerByNode(myparent.dbNodeKey)
        .then((mys) => {
            if (mys.length) {
                var my = mys[0];
                obj.db.getUserMaps(my.user)
                .then(maps => {
                    var onlineUsers = Object.keys(obj.meshServer.webserver.wssessions);
                    if (maps.length && onlineUsers.indexOf(my.user) !== -1) { // if we have a mapping and our user is online, map it
                        var uinfo = my.user.split('/');
                        var rcookie = parent.parent.encodeCookie({ userid: my.user, domainid: uinfo[1] }, obj.meshServer.loginCookieEncryptionKey);
                        maps.forEach(function(map) {
                            obj.startRoute(my.node, map, rcookie);
                        });
                    }
                })
                .catch(e => console.log('PLUGIN: RoutePlus: Error adding routes to agent on checkin 1: ', e));
            }
        })
        .catch(e => console.log('PLUGIN: RoutePlus: Error adding routes to agent on checkin 2: ', e));
    };
    
    obj.startRoute = function(comp, map, rcookie) {
        const command = {
            action: 'plugin',
            plugin: 'routeplus',
            pluginaction: 'startRoute',
            mid: map._id,
            rauth: rcookie,
            nodeid: map.toNode,
            remotetarget: map.toIP,
            remoteport: map.port,
            localport: map.localport,
            forceSrcPort: map.forceSrcPort ? map.forceSrcPort : false
        };
        //obj.debug('PLUGIN', 'RoutePlus', 'Mapping route to ', map.toNode);
        try { 
            obj.debug('PLUGIN', 'RoutePlus', 'Starting route ' + map._id + ' to ' + comp);
            obj.meshServer.webserver.wsagents[comp].send(JSON.stringify(command)); 
        } catch (e) { 
            obj.debug('PLUGIN', 'RoutePlus', 'Could not send map to ' + comp); 
        }
    };
    
    obj.mapUpdate = function() {
        // placeholder. If settings is never opened, updates sent to user throw console error.
    };
    
    obj.cantMap = function(e, msg) {
        if (pluginHandler.routeplus.cantMapStore == null) pluginHandler.routeplus.cantMapStore = [];
        pluginHandler.routeplus.cantMapStore.push(msg.mapId);
        try {
            pluginHandler.routeplus.cantMapIn();
        } catch (e) { }
    };
    
    obj.setUserRdpLinks = function(state, msg) {
        var links = msg.data;
        pluginHandler.routeplus.myRDPLinks = {};
        if (links.length) {
            links.forEach(function(l) {
                pluginHandler.routeplus.myRDPLinks[l.toNode] = l.localport;
            });
        }
        pluginHandler.routeplus.updateRdpDeviceLinks();
    };
    
    obj.openSettings = function() {
        let spage = `<div id="routePlusSettings" style="height:100%;">
            <div><div class="backButton" tabindex=0 onclick="go(2);" title="Back" onkeypress="if (event.key == 'Enter') go(2);"><div class="backButtonEx"></div></div></div>
            <h1>My Server Plugins - <span>RoutePlus</span></h1>
            <iframe id="routePlusiframe" src="/pluginadmin.ashx?pin=routeplus" frameBorder=0 style="width:100%;height:calc(100vh - 245px);max-height:calc(100vh - 245px)"></iframe>
        </div>`;
        QV('p2', 0);
        xxcurrentView = null;
        document.getElementById('column_l').insertAdjacentHTML( 'beforeend', spage );
    };
    
    obj.goPageStart = function(pageNum, event) {
        let r = Q('routePlusSettings');
        if (r) r.parentNode.removeChild(r);
    };
    
    obj.resizeContent = function() {
        var iFrame = document.getElementById('routePlusiframe');
        var newHeight = 800;
        var sHeight = iFrame.contentWindow.document.body.scrollHeight;
        if (sHeight > newHeight) newHeight = sHeight;
        iFrame.style.height = newHeight + 'px';
    };
    
    obj.handleAdminReq = function(req, res, user) {
        if ((user.siteadmin & 0xFFFFFFFF) == 1 && req.query.admin == 1) 
        {
            // admin wants admin, grant
            var vars = {};
            res.render(obj.VIEWS + 'admin', vars);
            return;
        } else {
            var vars = {};
            obj.db.getUserMaps(user._id)
            .then(maps => {
                if (maps.length) vars.mappings = JSON.stringify(maps);
                else vars.mappings = 'null';
                return obj.db.getMyComputer(user._id);
            })
            .then(mys => {
                if (mys.length) {
                    vars.myComputer = JSON.stringify(mys[0]);
                } else {
                    vars.myComputer = 'null';
                }
                return Promise.resolve();
            })
            .then(() => {
                res.render(obj.VIEWS + 'user', vars);
            })
            .catch(e => console.log('PLUGIN: RoutePlus: Error parsing user options. ', e));
            
            return;
        }
        res.sendStatus(401); 
        return;
    };
    
    obj.removeMapFromComp = function(id) {
        var usr = null;
        obj.endRoute(id)
        .then(() => {
            return obj.db.get(id);
        })
        .then((maps) => {
            if (maps.length) {
                usr = maps[0].user;
            }
            return obj.db.delete(id);
        })
        .then(() => obj.db.getUserMaps(usr))
        .then(maps => {
            var x = { action: "plugin", plugin: "routeplus", method: "mapUpdate", data: maps };
            obj.sendUpdateToUser(usr, x);
            return Promise.resolve();
        })
        .catch(e => console.log('PLUGIN: RoutePlus: Error removing map: ', e));
    };
    obj.endRoute = function (mapId) {
        var mapRef = null;
        return obj.db.get(mapId)
            .then((maps) => {
                mapRef = maps[0];
                return obj.db.getMyComputer(maps[0].user);
            })
            .then((mcs) => {
                var mc = mcs[0];
                // destroy the user map
                const cmd = {
                    action: 'plugin',
                    plugin: 'routeplus',
                    pluginaction: 'endRoute',
                    mid: mapId
                };
                try { 
                    obj.debug('PLUGIN', 'RoutePlus', 'Ending route for ID ' + mapId + ' (User: ' + mapRef.user + ')'); 
                    obj.meshServer.webserver.wsagents[mc.node].send(JSON.stringify(cmd)); 
                } catch (e) { 
                    obj.debug('PLUGIN', 'RoutePlus', 'Could not end map route for ' + mc.node + ' (agent offline)'); 
                }
            });
    };
    obj.sendUpdateToUser = function(user, msg) {
        if (obj.meshServer.webserver.wssessions[user] != null) {
            obj.meshServer.webserver.wssessions[user].forEach(function(sess) {
                obj.meshServer.webserver.wssessions2[sess.sessionId].send(JSON.stringify(msg));
            });
        }
    };
    obj.serveraction = function(command, myparent, grandparent) {
        switch (command.pluginaction) {
            case 'addMap':
                var newMapId = null, myComp = null;
                obj.db.addMap(command.user, command.toNode, command.port, command.srcport, command.forceSrcPort, command.toIP)
                .then((newMapInfo) => {
                    newMapId = newMapInfo.insertedId;
                    return obj.db.getUserMaps(command.user);
                })
                .then(maps => {
                    var x = { action: "plugin", plugin: "routeplus", method: "mapUpdate", data: maps};
                    myparent.ws.send(JSON.stringify(x));
                    return obj.db.getMyComputer(command.user);
                })
                .then((mcs) => {
                    myComp = mcs[0].node;
                    return obj.db.get(newMapId);
                })
                .then((maps) => {
                    var uinfo = command.user.split('/');
                    var rcookie = parent.parent.encodeCookie({ userid: command.user, domainid: uinfo[1] }, obj.meshServer.loginCookieEncryptionKey);

                    obj.startRoute(myComp, maps[0], rcookie);
                })
                .catch(e => console.log('PLUGIN: RoutePlus: Error adding a map: ', e));
            break;
            case 'removeMap':
                obj.removeMapFromComp(command.id);
            break;
            case 'userLoggedIn':
                // obj.userLoggedIn();
            break;
            case 'setMyComputer':
                // remove mappings from current computer first
                obj.db.getMyComputer(command.user)
                .then(mys => {
                    if (mys.length == 0) return Promise.resolve();
                    var my = mys[0];
                    return obj.db.getUserMaps(mys[0].user)
                        .then(maps => {
                            obj.debug('PLUGIN', 'RoutePlus', 'setMyComputer maps length: ' + maps.length); 
                            if (maps.length == 0) return Promise.resolve();
                            maps.forEach(function(map) {
                                obj.endRoute(map._id);
                            });
                            return Promise.resolve();
                        })
                        .catch(e => console.log('PLUGIN: RoutePlus: setMyComputer user map changing failed with: ', e));
                })
                .then(() => {
                    return obj.db.setMyComputer({
                        user: command.user,
                        node: command.node
                    });
                })
                .then(() => { // update new MyComputer with mappings
                    return obj.db.getUserMaps(command.user)
                        .then(maps => {
                            if (maps.length == 0) return Promise.resolve();
                            var uinfo = command.user.split('/');
                            var rcookie = parent.parent.encodeCookie({ userid: command.user, domainid: uinfo[1] }, obj.meshServer.loginCookieEncryptionKey);
                            maps.forEach(function(map) {
                                obj.startRoute(command.node, map, rcookie);
                            });
                            return Promise.resolve();
                        })
                        .catch(e => console.log('PLUGIN: RoutePlus: setMyComputer user map adding failed with: ', e));
                })
                .then(() => { // update front end
                    obj.db.getMyComputer(command.user)
                    .then(rows => {
                        if (rows.length) {
                            var x = { action: "plugin", plugin: "routeplus", method: "myComputerUpdate", data: rows[0]};
                            myparent.ws.send(JSON.stringify(x));
                        }
                    })
                });
            break;
            case 'updateMapPort':
                obj.debug('PLUGIN', 'RoutePlus', 'Updating mapped port for ' + command.mid + ' to ' + command.port);
                var upUser = null;
                obj.db.update(command.mid, { localport: command.port })
                .then(() => {
                    return obj.db.get(command.mid);
                })
                .then((mObj) => {
                    mObj = mObj[0];
                    upUser = mObj.user;
                    return obj.db.getUserMaps(mObj.user);
                })
                .then(maps => {
                    var x = { action: "plugin", plugin: "routeplus", method: "mapUpdate", data: maps};
                    //myparent.ws.send(JSON.stringify(x));
                    //obj.debug('PLUGIN', 'RoutePlus', 'Checking for session for '+ maps[0].user);
                    // send the port to the RoutePlus settings screen
                    obj.sendUpdateToUser(maps[0].user, x);
                    //console.log('s1', Object.keys(obj.meshServer.webserver.wssessions));
                    //var targets = ['*', 'server-users'];
                    //obj.meshServer.DispatchEvent(targets, obj, { action: 'plugin', plugin: 'routeplus', pluginaction: 'mapUpdate', data: maps });
                })
                .catch(e => console.log('PLUGIN: RoutePlus: Error updating mapped port: ', e));
            break;
            case 'cantMapPort':
                obj.debug('PLUGIN', 'RoutePlus', 'Client cannot map forced port for id: ' + command.mid);
                obj.db.get(command.mid)
                .then(maps => {
                    var x = { action: "plugin", plugin: "routeplus", method: "cantMap", mapId: maps[0]._id };
                    obj.sendUpdateToUser(maps[0].user, x);
                })
                .catch(e => console.log('PLUGIN: RoutePlus: CantMap Reporting Error: ', e));
            break;
            case 'rdpLinkUpdate':
                var upUser = null;
                obj.db.update(command.mid, { rdplink: command.rdplink })
                .then(() => {
                    return obj.db.get(command.mid);
                })
                .then((mObj) => {
                    mObj = mObj[0];
                    upUser = mObj.user;
                    return obj.db.getUserMaps(mObj.user);
                })
                .then(maps => {
                    var x = { action: "plugin", plugin: "routeplus", method: "mapUpdate", data: maps};
                    obj.sendUpdateToUser(maps[0].user, x);
                })
                .then(() => {
                    return obj.db.getRdpLinksForUser(upUser)
                })
                .then(links => {
                    var x = { action: "plugin", plugin: "routeplus", method: "setUserRdpLinks", data: links};
                    obj.sendUpdateToUser(upUser, x);
                })
                .catch(e => console.log('PLUGIN: RoutePlus: Error updating RDP link setting: ', e));
            break;
            case 'getRdpLinks':
                obj.db.getRdpLinksForUser(command.user)
                .then(links => {
                    var x = { action: "plugin", plugin: "routeplus", method: "setUserRdpLinks", data: links};
                    obj.sendUpdateToUser(command.user, x);
                })
                .catch(e => console.log('PLUGIN: RoutePlus: Error updating RDP link maps: ', e));
            break;
            default:
                console.log('PLUGIN: RoutePlus: unknown action');
            break;
        }
    };
    
    return obj;
}