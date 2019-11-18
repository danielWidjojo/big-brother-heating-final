



#include <ESP8266WiFi.h>
#include <WiFiUdp.h>
#include "DHT.h"

#define DHTPIN D5     // what digital pin we're connected to

// Uncomment whatever type you're using!
//#define DHTTYPE DHT11   // DHT 11
#define DHTTYPE DHT22   // DHT 22  (AM2302), AM2321
//#define DHTTYPE DHT21   // DHT 21 (AM2301)

int ledPin = 16; // GPIO13
char ledPin2=D6;
char ledPin3=D7;
char pirPin= D3;
int pirReading = 0;
const char* ssid     = "L2KInternetCafe 2.4G Slow";
const char* password = "sc0tt0ls0n";
boolean motionD6=false;
boolean motionD7=false;
int motionD6Time=0;
int motionD7Time=0;

WiFiUDP UDPTestServer;
unsigned int UDPPort = 2807;

const int packetSize = 10;
byte packetBuffer[packetSize];

DHT dht(DHTPIN, DHTTYPE);

void setup() {
  //setting up leds
  pinMode(ledPin, OUTPUT);
   pinMode(ledPin2, OUTPUT);
   pinMode(ledPin3, OUTPUT);
   pinMode( pirPin, INPUT);
  digitalWrite(ledPin, HIGH);
  digitalWrite(ledPin2, HIGH);
  digitalWrite(ledPin3, HIGH);
  Serial.begin(9600);
  delay(10);

  Serial.println();
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);
  
  WiFi.begin(ssid, password);
  WiFi.config(IPAddress(192, 168, 0, 60), IPAddress(192, 168, 0, 1), IPAddress(255, 255, 255, 0));
  //disabling access point or AP mode
  //sta refer to workSTAtion mode
  WiFi.mode(WIFI_STA);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.println("WiFi connected");  
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());

  UDPTestServer.begin(UDPPort);

   dht.begin();
}

int value = 0;
//counter to check whether udp server is still active
int udpServerCheck=0;
// Generally, you should use "unsigned long" for variables that hold time
// The value will quickly become too large for an int to store
unsigned long previousMillis = 0;        // will store last time udpServer was updated

// constants won't change :
unsigned long interval = 10000;           // interval at which to increase counter of udp servercheck

void loop() {
  handleUDPServer();
  unsigned long currentMillis = millis();
  //check how long since the server respond
  unsigned long times=currentMillis-previousMillis;
  if (times>= interval) {
    // save the last time you blinked the LED
    previousMillis = currentMillis;
    //increase counter every 10 seconds
    udpServerCheck++;
    //check whether lights should be on based on motion
    lightsBasedOnMotion();
    
    }
    //turn on led if the server has not reponded for a certain period of time
    //450 is equal to 75 minutes
    if (udpServerCheck>450){
      digitalWrite(ledPin, HIGH);
  digitalWrite(ledPin2, HIGH);
  digitalWrite(ledPin3, HIGH);

      
    }
pirReading=digitalRead(pirPin);
  if( pirReading==1){
    Serial.println("motion");
    if(motionD6){
      motionD6Time=3;
      digitalWrite(ledPin2, HIGH);
      
    }
    if(motionD7){
      motionD7Time=3;
      digitalWrite(ledPin3, HIGH);
    }
    }else{
      Serial.println("no motion");
    }
   
        
  delay(1);
 
}


void handleUDPServer() {

  int cb = UDPTestServer.parsePacket();

  if (cb) {
    UDPTestServer.read(packetBuffer, packetSize);
 
    String myData = "";
    
    for(int i = 0; i < packetSize; i++) {
      myData += (char)packetBuffer[i];
      
    }

    Serial.println(myData.substring(0,3));
    
    //dht
    if(myData.substring(0,3)=="D6a"){
      motionD6=false;
       digitalWrite(ledPin, LOW);
       digitalWrite(ledPin2, LOW);
       Serial.write("high");
       UDPTestServer.beginPacket(UDPTestServer.remoteIP(),UDPTestServer.remotePort());
       UDPTestServer.write("D6a");
       UDPTestServer.endPacket(); 
       //sendUdpMessage('D6a');
       
      }
      else if(myData.substring(0,3)=="D7a"){
        motionD7=false;
        digitalWrite(ledPin3, LOW);
       Serial.write("high");
       UDPTestServer.beginPacket(UDPTestServer.remoteIP(),UDPTestServer.remotePort());
       UDPTestServer.write("D7a");
       UDPTestServer.endPacket(); 
       //sendUdpMessage('D7a');
        }
      
      else if(myData=="tempHum"){
         // Reading temperature or humidity takes about 250 milliseconds!
        // Sensor readings may also be up to 2 seconds 'old' (its a very slow sensor)
         float h = dht.readHumidity();
        // Read temperature as Celsius (the default)
         float t = dht.readTemperature();
         String hum=String(h);
         String temp=String(t);
         pirReading = digitalRead(pirPin);
         /*UDPTestServer.beginPacket(UDPTestServer.remoteIP(),UDPTestServer.remotePort());
         UDPTestServer.print(temp);
         UDPTestServer.print(" ");
         UDPTestServer.print(hum);
         UDPTestServer.print(" ");
         UDPTestServer.print(pirReading);
         UDPTestServer.endPacket();
         */
         
         UDPTestServer.beginPacket(UDPTestServer.remoteIP(),UDPTestServer.remotePort());
         UDPTestServer.print(temp);
         UDPTestServer.print(" ");
         UDPTestServer.print(hum);
         UDPTestServer.print(" ");
         UDPTestServer.print(pirReading);
         UDPTestServer.endPacket();
        }
      else if (myData.substring(0,3)=="D6b"){
        motionD6=false;
        digitalWrite(ledPin, HIGH);
        digitalWrite(ledPin2, HIGH);
       UDPTestServer.beginPacket(UDPTestServer.remoteIP(),UDPTestServer.remotePort());
       UDPTestServer.write("D6b");
       UDPTestServer.endPacket(); 
       //sendUdpMessage('D6b');

      }
      else if (myData.substring(0,3)=="D7b"){
        motionD7=false;
        digitalWrite(ledPin3, HIGH);
        UDPTestServer.beginPacket(UDPTestServer.remoteIP(),UDPTestServer.remotePort());
       UDPTestServer.write("D7b");
       UDPTestServer.endPacket(); 
       //sendUdpMessage('D7b');

      }
      else if (myData.substring(0,3)=="D6c"){
         UDPTestServer.beginPacket(UDPTestServer.remoteIP(),UDPTestServer.remotePort());
       UDPTestServer.write("D6c");
       UDPTestServer.endPacket(); 
        motionD6=true;
        
        }
      else if (myData.substring(0,3)=="D7c"){
         UDPTestServer.beginPacket(UDPTestServer.remoteIP(),UDPTestServer.remotePort());
       UDPTestServer.write("D7c");
       UDPTestServer.endPacket(); 
        motionD7=true;
        }

      //reset counter for Server check as message is received
      udpServerCheck=0;
  }
  
}
void sendUdpMessage(char msg){
       UDPTestServer.beginPacket(UDPTestServer.remoteIP(),UDPTestServer.remotePort());
       UDPTestServer.write(msg);
       UDPTestServer.endPacket();
  
}

void lightsBasedOnMotion(){
  if(motionD6){
      if(motionD6Time>0){
         motionD6Time--;
      }else{
        digitalWrite(ledPin2, LOW);
      }  
    }else{
      motionD6Time=0;
    }

    if(motionD7){
      if(motionD7Time>0){
         motionD7Time--;
      }else{
        digitalWrite(ledPin3, LOW);
      }  
    }else{
      motionD7Time=0;
    }
}


