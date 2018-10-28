
var tools = require('./importantModules.js');
var events = require('events');
var admin = require('firebase-admin');
var myInt;
var heaterOn=false;
var isSleeping=false;
var setTemp=24.0;
var currentTemp=20.0;
var upperTempThreshold=2.0;
var lowerTempThreshold=2.0;
var ipAdd='192.168.0.60';
var port=2807;
var onMsg='D6b';
var offMsg='D6a';
//a class that store data from firebase for other function to use
//making eventemitter or any function or class as a variable allows it to excess variable outside
var dataFirebaseMap= new Map();    
var tempHumMap= new Map();    
var openWeatherDataMap= new Map();
var intelligentModeBoolean=false;



class Time{
    getDate(){
        var date = new Date();
        return date;
    }
    getHour(){
        return parseInt(this.getDate().getHours());
    }
    getMinute(){
        return parseInt(this.getDate().getMinutes());
    }
    getSecond(){
        return parseInt(this.getDate().getSeconds());
    }
    getTimeInSeconds(){
        return parseInt(this.getHour()*3600+this.getMinute()*60+this.getSecond());

    }
    convertingTimeToSeconds(hour,minute){
        return parseInt((hour*3600)+(minute*60));
    }
    
    };
class CurrentStatus{
        isAtHome(wifiDetection,timeToGoHomeinSeconds,currentTimeInSeconds){
            if(wifiDetection){
                return true;
            }else{if(currentTimeInSeconds>=timeToGoHomeinSeconds){
                return true
                }else{
                    return false;
                }
            }
        }
        
        isSleeping(sleepDetection,timeToGoToBedSeconds,timeToWakeUpSeconds,currentTimeSeconds){
            if(timeToGoToBedSeconds>timeToWakeUpSeconds){
                if(currentTimeSeconds<=timeToWakeUpSeconds){
                    if(sleepDetection){
                        if(currentTimeSeconds<=timeToGoToBedSeconds){
                            return true;
                        }else{
                            return false;
                        }
                        
                    }else{
                        return true;
                    }
                }else{
                    return false;
                }
            }else{

                if(currentTimeSeconds>=timeToGoToBedSeconds){
                
                    if(sleepDetection){
                        if(currentTimeSeconds>=timeToWakeUpSeconds){
                            return false;
                        }else{
                            return true;
                        }
                        
                    }else{
                        return false;
                    }
                }else{
                    return false;
                }
            }
        }
        isGoingToSleep(){

        }
        
        isHeaterSupposedToBeOn(setTemp,currentStatusBoolean,currentTemp,thresholdUpper,thresholdLower){
            if(setTemp-currentTemp>thresholdLower){
                return true;
            }else if( currentTemp-setTemp>thresholdUpper){
                return false;
            }else{
                return currentStatusBoolean;
            }
        }
        //new line by WILLIAM
        idealTempToSet(setTemp,outsideTemp,tempToAdd) {
            var intelligentSetTemp;
            var idealTemp=outsideTemp+tempToAdd;
            if (15 <= idealTemp && idealTemp<= setTemp) {
                intelligentSetTemp = parseFloat(idealTemp);
            } else if (idealTemp > setTemp) {
                intelligentSetTemp = parseFloat(setTemp);
            } else {
                intelligentSetTemp = parseFloat(15);
            }
            return intelligentSetTemp;
        }
        //new line by WILLIAM
    }
    function dataLogTofirebase(dataMap,dataMapOutdoor) {
        console.log('###---DataLogging---###');
        console.log(dataMap);
        
        try{
             
    
            var collection='first_user';
            var document='currentEnv';
            console.log('Updating temp and hum to firebase');
            const dB=new tools.FirebaseDatabase('./big-brother-heating-c44fe577b535.json',collection,document);
                
            if (dataMapOutdoor.size!==0){
                
                const dB2=new tools.FirebaseDatabase('./big-brother-heating-c44fe577b535.json',collection,document);
                var dataFormatted2={outdoorEnv:dataMapOutdoor};
                dB2.updateDatabase(dataFormatted2);
                
            }
            var dataFormatted={indoorEnv:dataMap}
                dB.updateDatabase(dataFormatted);
           }catch(err){
               console.log(err);
           }
    }
    function dataLogTempHum(){
        var emDataLog=new events.EventEmitter();
        const dataLog= new tools.UdpComm(ipAdd,port,emDataLog);
        dataLog.updateUdp('tempHum');
            emDataLog.on('content',function(content){

               var msg=[];
               msg=String(content).split(' ');
  
       
               if(isNaN(msg[0])||isNaN(msg[1])){
                   console.log('Error Temperature or hummidity is not a number!!')

               }else{

                   
                var setAda = {
                    temp: parseFloat(msg[0]),
                    hum: parseFloat(msg[1]),
                    updated: admin.firestore.FieldValue.serverTimestamp(),
               }
               
               //poor pratice
               //however when using set the object is illegal under firebase
               //when using equal from a variable passed to it 
               //it does not work becomes global and use variable from global that is declared outside the function
               tempHumMap=setAda;
               console.log(setAda);

               
            }
            
            })
    }
    function dataLogTempHum(){
        var emDataLog=new events.EventEmitter();
        const dataLog= new tools.UdpComm(ipAdd,port,emDataLog);
        dataLog.updateUdp('tempHum');
            emDataLog.on('content',function(content){

               var msg=[];
               msg=String(content).split(' ');
  
       
               if(isNaN(msg[0])||isNaN(msg[1])){
                   console.log('Error Temperature or hummidity is not a number!!')

               }else{

                   
                var setAda = {
                    temp: parseFloat(msg[0]),
                    hum: parseFloat(msg[1]),
                    updated: admin.firestore.FieldValue.serverTimestamp(),
               }
               
               //poor pratice
               //however when using set the object is illegal under firebase
               //when using equal from a variable passed to it 
               //it does not work becomes global and use variable from global that is declared outside the function
               tempHumMap=setAda;
               console.log(setAda);

               
            }
            
            })
    }
    function dataLogTempHumOutdoor(){
        //var datamap=dataMap;
     
        var openWeatherMap=new tools.OpenWeatherMap('Sheffield,UK','4942a608890120d72ce36d365026ba7f')
        var emDataLog2=new events.EventEmitter();
           openWeatherMap.getWeatherMain(emDataLog2);
        var datalogger=emDataLog2.on('content',function(main,wind,cloud){
            
             var   setAda = {
                    temp: parseFloat(main.temp),
                    tempMax: parseFloat(main.temp_max),
                    tempMin: parseFloat(main.temp_min),
                    hum: parseFloat(main.humidity),
                    wind:parseFloat(wind.speed),
                    cloud:parseFloat(cloud.all),
                    updated: admin.firestore.FieldValue.serverTimestamp(),
               }
               openWeatherDataMap=setAda;
               console.log(setAda);
            })
                

           
    }
    function dataLogHeaterStatusFirebase(heaterOnBoolean,tempSet){
        //var datamap=dataMap;
     
     
       
            var collection="first_user";
            var document="heaterStatus";
             var   setAda = {
                    heaterIsOn: heaterOnBoolean,
                    tempSet: tempSet,
                    updated: admin.firestore.FieldValue.serverTimestamp(),
               }
               const dB2=new tools.FirebaseDatabase('./big-brother-heating-c44fe577b535.json',collection,document);
                
                dB2.updateDatabase(setAda);
              
                

           
    }
    

    var currentStatus=new CurrentStatus();
    const time= new Time();



/*
var eventEmitter = new events.EventEmitter();
const test=new tools.FirebaseDatabase('./big-brother-heating-c44fe577b535.json','first_user','hardware_overide');
var data={set: true,
    status: true,
    updated: admin.firestore.FieldValue.serverTimestamp(),}
test.updateDatabase(data);
test.realtimeUpdate(eventEmitter);
eventEmitter.on('content', function (data) {
    console.log('First subscriber: ' + data['set']);
  });
  */

function realtimeUpdateFirebase(collection,document,dataMap,eventsEmitter){
// to get data from firebase for realtime update and then place the data in a map
// eventemitter will also provide data back 
// if no dataMap or eventEmitter is given then the function will only log realtime update
const dB=new tools.FirebaseDatabase('./big-brother-heating-c44fe577b535.json',collection,document);
dB.realtimeUpdate(eventsEmitter,dataMap,eventsEmitter);
  /*
var b=emTimeSettingsDB.on('content', function (data){
    dataMap.set(document,data);

    console.log('Update firebase Database from collection: '+collection+', document: '+document);
});
*/
}

//Getting all the necessary data
var emTimeSettings=new events.EventEmitter();
realtimeUpdateFirebase('first_user','timeSettings',dataFirebaseMap,emTimeSettings);
emTimeSettings.on('content',function(content){
    mainLoop();
    dataLogHeaterStatusFirebase(heaterOn,setTemp);

})
var emCurrentStatus=new events.EventEmitter();
realtimeUpdateFirebase('first_user','currentStatus',dataFirebaseMap,emCurrentStatus);
emCurrentStatus.on('content',function(content){
    mainLoop();
    dataLogHeaterStatusFirebase(heaterOn,setTemp);

})
var emTempSettings=new events.EventEmitter();
realtimeUpdateFirebase('first_user','tempSettings',dataFirebaseMap,emTempSettings);
emTempSettings.on('content',function(content){
    mainLoop();
    dataLogHeaterStatusFirebase(heaterOn,setTemp);

})

var emHardwareOverride=new events.EventEmitter();
realtimeUpdateFirebase('first_user','hardware_overide',dataFirebaseMap,emHardwareOverride);
emHardwareOverride.on('content',function(content){
    mainLoop();
    dataLogHeaterStatusFirebase(heaterOn,setTemp);

})
realtimeUpdateFirebase('first_user','currentEnv',dataFirebaseMap);
var emLastOnline=new events.EventEmitter();

realtimeUpdateFirebase('first_user','lastOnline',dataFirebaseMap,emLastOnline);
emLastOnline.on('content',function(content){
    //phone is probably online
    //try to update to the latest data
    try{
    dataLogTofirebase(tempHumMap,openWeatherDataMap);
    dataLogHeaterStatusFirebase(heaterOn,setTemp);
    }catch(err){

    }
})
function mainLoop(){
    try{
    hardwareOverideBoolean=dataFirebaseMap.get('hardware_overide')['set'];
    hardwareOverideHeaterOnBoolean=dataFirebaseMap.get('hardware_overide')['status'];
    var emComm=new events.EventEmitter();
        
    const comm= new tools.UdpComm(ipAdd,port,emComm);
    if(!hardwareOverideBoolean){
    try{
        console.log('============');
        console.log(time.getDate());
        //console.log("Hello "+dataFirebaseMap.get('tempSettings')['setTemp']);
        //console.log("Time"+dataFirebaseMap.get('timeSettings'));
        //getting all the time settings and converting it to seconds
        dataLogTempHum();
       
        
        
        var timeGoHomeSeconds=time.convertingTimeToSeconds(dataFirebaseMap.get('timeSettings')['timeGoHome'][0],
        dataFirebaseMap.get('timeSettings')['timeGoHome'][1]);

        var timeGoToBedSeconds=time.convertingTimeToSeconds(dataFirebaseMap.get('timeSettings')['timeGoToBed'][0],
        dataFirebaseMap.get('timeSettings')['timeGoToBed'][1]);
        var timeWakeUpSeconds=time.convertingTimeToSeconds(dataFirebaseMap.get('timeSettings')['timeWakeUp'][0],
        dataFirebaseMap.get('timeSettings')['timeWakeUp'][1]);
        var firebaseIsAtHome=dataFirebaseMap.get('currentStatus')['atHome'];
        var firebaseIsSleeping=dataFirebaseMap.get('currentStatus')['isSleeping'];
         var isAtHome=currentStatus.isAtHome(firebaseIsAtHome,timeGoHomeSeconds,time.getTimeInSeconds());
         console.log('The person is at home '+isAtHome)
        isSleeping=currentStatus.isSleeping(firebaseIsSleeping,timeGoToBedSeconds,timeWakeUpSeconds,time.getTimeInSeconds());
        console.log("is sleeping "+isSleeping);
        if(isAtHome==false){
            heaterOn=false;
            console.log('The person is not at home heater is on: '+heaterOn);
            //heaterOn=currentStatus.isHeaterSupposedToBeOn(setTemp,heaterOn,currentTemp,upperTempThreshold,lowerTempThreshold);
            console.log('Heater is on: '+heaterOn);
            if(heaterOn){
                comm.updateUdp(onMsg);
            }else{
                comm.updateUdp(offMsg);
            }
            
        }else{
            if(isSleeping){
            //set sleeping temp
            setTemp=parseFloat(dataFirebaseMap.get('tempSettings')['setSleepTemp']);
            console.log('set Temp is the sleep Temp '+setTemp);
            }else{
            setTemp=parseFloat(dataFirebaseMap.get('tempSettings')['setTemp']);
            console.log('set Temp is the normal Temp '+setTemp);
            }
            currentTemp=parseFloat(dataFirebaseMap.get('currentEnv')['indoorEnv']['temp']);
            intelligentModeBoolean=dataFirebaseMap.get('hardware_overide')['intelligentMode'];
            if(intelligentModeBoolean){
                setTemp=currentStatus.idealTempToSet(setTemp,openWeatherDataMap.temp,7);
                console.log('Intelligent mode is set temp = '+String(setTemp));

            }
      
            
            heaterOn=currentStatus.isHeaterSupposedToBeOn(setTemp,heaterOn,currentTemp,upperTempThreshold,lowerTempThreshold);
            console.log('Heater is on: '+heaterOn)
            if(heaterOn){
                comm.updateUdp(onMsg);
            }else{
                comm.updateUdp(offMsg);
            }
            

        }
        //if is at home is false then the heater should be off


    }catch(err){
        console.log("Error" +err)
    }
}else{
    if(hardwareOverideHeaterOnBoolean){
        heaterOn=true
    }else{
        heaterOn=false
    }
    console.log('Heater is on: '+heaterOn)
            if(heaterOn){
                comm.updateUdp(onMsg);
            }else{
                comm.updateUdp(offMsg);
            }
}
    }catch(err){
        console.log("Error" +err)
    }
    
}
myInt = setInterval(function () {
    
    mainLoop();
    
}, 10000); 


var datalog=setInterval(function(){
    dataLogTempHumOutdoor();
    dataLogTofirebase(tempHumMap,openWeatherDataMap);
    dataLogHeaterStatusFirebase(heaterOn,setTemp);
},5*60*1000);

  
//get temp data from env first so that firebase can update directly
dataLogTempHumOutdoor();
 console.log(parseInt(time.getTimeInSeconds()));
