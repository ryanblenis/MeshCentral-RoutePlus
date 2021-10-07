/** 
* @description MeshCentral-RoutePlus database module
* @author Ryan Blenis
* @copyright Ryan Blenis 2019
* @license Apache-2.0
*/

"use strict";
require('promise');
var Datastore = null;
var formatId = null;

module.exports.CreateDB = function(meshserver) {
    var obj = {};
    var NEMongo = require(__dirname + '/nemongo.js');
    obj.dbVersion = 1;
    
    obj.initFunctions = function () {
        obj.updateDBVersion = function(new_version) {
          return obj.file.updateOne({type: "db_version"}, { $set: {version: new_version} }, {upsert: true});
        };
        
        obj.getDBVersion = function() {
            return new Promise(function(resolve, reject) {
                obj.file.find( { type: "db_version" } ).project( { _id: 0, version: 1 } ).toArray(function(err, vers){
                    if (vers.length == 0) resolve(1);
                    else resolve(vers[0]['version']);
                });
            });
        };

        obj.update = function(id, args) {
            id = formatId(id);
            return obj.file.updateOne( { _id: id }, { $set: args } );
        };
        obj.delete = function(id) {
            id = formatId(id);
            return obj.file.deleteOne( { _id: id } );
        };
        obj.get = function(id) {
            if (id == null || id == 'null') return new Promise(function(resolve, reject) { resolve([]); });
            id = formatId(id);
            return obj.file.find( { _id: id } ).toArray();
        };
        obj.getUserMaps = function(userId) {
            return obj.file.find( { user: userId, type: 'portMap' } ).toArray();
        };
        obj.getMyComputer = function(userId) {
            return obj.file.find({ type: 'myComputer', user: userId }).toArray();
        };
        obj.getMyComputerByNode = function (nodeId) {
            return obj.file.find({ type: 'myComputer', node: nodeId }).toArray();
        };
        obj.setMyComputer = function(opts) {
            return obj.getMyComputer(opts.user)
            .then(ms => {
                if (ms.length) {
                    return obj.update( ms[0]._id, { node: opts.node } );
                } else {
                    return obj.file.insertOne({
                        type: 'myComputer',
                        node: opts.node,
                        user: opts.user
                    });
                }
            })
        };
        obj.addMap = function(user, toNode, port, srcport, forceSrcPort, toIP) {
            return obj.file.insertOne( {
                type: 'portMap',
                user: user,
                toNode: toNode,
                toIP: toIP,
                port: port,
                localport: srcport == '' ? 0 : srcport,
                forceSrcPort: forceSrcPort,
                auto: false,
                rdplink: port == 3389 ? true : false
            });
        };
        obj.getRdpLinksForUser = function(userId) {
            return obj.file.find({ type: 'portMap', user: userId, rdplink: true }).toArray();
        };
        obj.checkDefaults = function() {
            
        };
        
        obj.checkDefaults();
    };
    
    if (meshserver.args.mongodb) { // use MongDB
      require('mongodb').MongoClient.connect(meshserver.args.mongodb, { useNewUrlParser: true, useUnifiedTopology: true }, function (err, client) {
          if (err != null) { console.log("Unable to connect to database: " + err); process.exit(); return; }
          
          var dbname = 'meshcentral';
          if (meshserver.args.mongodbname) { dbname = meshserver.args.mongodbname; }
          const db = client.db(dbname);
          
          obj.file = db.collection('plugin_routeplus');
          obj.file.indexes(function (err, indexes) {
              // Check if we need to reset indexes
              var indexesByName = {}, indexCount = 0;
              for (var i in indexes) { indexesByName[indexes[i].name] = indexes[i]; indexCount++; }
              if ((indexCount != 2) || (indexesByName['User1'] == null)) {
                  // Reset all indexes
                  console.log('Resetting plugin (RoutePlus) indexes...');
                  obj.file.dropIndexes(function (err) {
                      obj.file.createIndex({ user: 1 }, { name: 'User1' });
                  }); 
              }
          });
          
          if (typeof require('mongodb').ObjectID == 'function') {
              formatId = require('mongodb').ObjectID;
          } else {
              formatId = require('mongodb').ObjectId;
          }
          obj.initFunctions();
    });  
    } else { // use NeDb
        Datastore = require('nedb');
        if (obj.filex == null) {
            obj.filex = new Datastore({ filename: meshserver.getConfigFilePath('plugin-routeplus.db'), autoload: true });
            obj.filex.persistence.setAutocompactionInterval(40000);
            obj.filex.ensureIndex({ fieldName: 'user' });
        }
        obj.file = new NEMongo(obj.filex);
        formatId = function(id) { return id; };
        obj.initFunctions();
    }
    
    return obj;
}