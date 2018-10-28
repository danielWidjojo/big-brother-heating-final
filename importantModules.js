var dgram = require('dgram');
var admin = require('firebase-admin');
const OpenWeatherMapHelper = require("openweathermap-node");

class UdpComm {
    constructor(ipAdd, port,eventEmitter) {
      this.ipAdd = ipAdd;
      this.port = port;
      this.eventEmitter=eventEmitter;
      
    }

    updateUdp(msg) {
      var PORT = this.port;
      var HOST = this.ipAdd;
      var message = new Buffer(String(msg));
      var client = dgram.createSocket('udp4');
      client.bind();
      var eventEmitter=this.eventEmitter;
      var counter=0;
      var intervalObj;
      
      intervalObj = setInterval(() => {
        client.send(message, 0, message.length, PORT, HOST, function(err, bytes) {
          if (err) throw err;
          console.log('UDP message: '+msg+' sent to ' + HOST +':'+ PORT);
      });
      counter=counter+1;
      if(counter>=4){
        //Interval must be deleted after socket is closed
        //attempting to send message after socket is closed will result in an error
        //without details explaining why it is like that
        clearInterval(intervalObj);
        eventEmitter.emit('timeOut','timeOut');
        console.log('tried 4 times');
        client.close();
       
      }
      }, 500);
      
     
    
   client.on('message', function (message, remote) {

    //clearTimeout(intervalObj);
      console.log(remote.address + ':' + remote.port +' - ' + message);
      msg=String(message);
      eventEmitter.emit('content',msg);
      clearInterval(intervalObj);
      client.close();
  });
  
  client.on('close', function() {
      console.log('Connection closed');
  });
    }
    
  }
  //module.exports = UdpComm;
//Sample code
/*
var em = new events.EventEmitter();

var eventEmitter = new events.EventEmitter();

const square = new UdpComm('192.168.0.60',2808,em);
square.updateUdp('D6b');
  //Subscribe for FirstEvent

em.on('timeOut', function (data) {
  console.log('First subscriber: ' + data);
});
*/

class FirebaseDatabase{
  constructor(creds,collection,document){
    this.creds=creds;
    this.collection=collection;
    this.document=document;
    var serviceAccount = require(creds);
    try { 
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        //databaseURL: 'https://big-brother-heating.firebaseio.com'
          });
          var db = admin.firestore().settings( { timestampsInSnapshots: true });
  }
  catch(err) {
      console.log('Error initializing Firebase! Prob Firebase App has been initialized and settings cannot be changed');
  }
    
    this.db2=admin.firestore();

    this.docRef = this.db2.collection(collection).doc(document);
  }
  updateDatabase(dataDic){
    var setAda = this.docRef.update(
      dataDic
    );
 
  }
  addDatabase(dataDic){
    var setAda = this.docRef.set({
      set: true,
      status: true,
      updated: admin.firestore.FieldValue.serverTimestamp(),
    });

  }
  realtimeUpdate(eventEmitter,dataMap){
    var observer = this.docRef.onSnapshot(docSnapshot => {
      //console.log(`Received doc snapshot: ${docSnapshot.data()['set']}`);
      console.log(`Received doc snapshot: ${docSnapshot.data()}`);
      console.log('Update firebase Database from collection: '+this.collection+', document: '+this.document);
      if(dataMap!==undefined){
        dataMap.set(this.document,docSnapshot.data());
      }else{
        console.log('dataMap is not defined')
      }
      //console.log(docSnapshot['set'])
      if(eventEmitter!==undefined){
        eventEmitter.emit('content',docSnapshot.data());
      }else{
        console.log('eventEmitter is not defined')
      }
     
      // ...
    }, err => {
      if(eventEmitter!==undefined){
        eventEmitter.emit('error','err0r');
      }else{
        console.log('eventEmitter is not defined')
      }
      
      console.log(`Encountered error: ${err}`);
    });

  }
  getDatabase(){
    var getDoc = this.docRef.get()
    .then(doc => {
      if (!doc.exists) {
        console.log('No such document!');
      } else {
        console.log('Document data:', doc.data());
        return doc.data();
      }
    })
    .catch(err => {
      console.log('Error getting document', err);
    });
  }

}

/* sample code
var em = new events.EventEmitter();

var eventEmitter = new events.EventEmitter();

const firebaseTest=new FirebaseDatabase('./big-brother-heating-c44fe577b535.json','first_user','hardware_overide');
var setAda = {
  set: true,
  status: true,
  updated: admin.firestore.FieldValue.serverTimestamp(),}
firebaseTest.updateDatabase(setAda);
firebaseTest.realtimeUpdate(em);
em.on('content', function (data) {
  console.log('First subscriber: ' + data['set']);
});
console.log('test')
*/
class OpenWeatherMap
{
  constructor(city,apiCode){
    this.city=city;
    this.apiCode=apiCode;
    this.helper = new OpenWeatherMapHelper(
      {
          APPID: apiCode,
          units: "metric"
      }
    );
    
   
  }
  getWeatherMain(eventEmitter){
    this.helper.getCurrentWeatherByCityName(this.city, (err, currentWeather) => {
      if(err){
          console.log(err);
          if(eventEmitter!==undefined){
            eventEmitter.emit('content','main');
          }else{
            console.log('eventEmitter is not defined')
          }
      }
      else{
        if(eventEmitter!==undefined){
          eventEmitter.emit('content',currentWeather.main,currentWeather.wind,currentWeather.clouds);

        }else{
          console.log('eventEmitter is not defined')
        }
          console.log(currentWeather.main);
   
      }
    });

  }
  

}

module.exports = {FirebaseDatabase:FirebaseDatabase,
  UdpComm:UdpComm,
OpenWeatherMap:OpenWeatherMap};
