#include <Adafruit_NeoPixel.h>
#include <avr/power.h>

//NeoPixel用ピン番号
#define TAPE1 12
#define TAPE2 11
#define TAPE3 10
#define TAPE4 9

//通信用RX、TXピン番号
#define RX_PIN A4
#define TX_PIN A5

//ガスセンサ用ピン番号
#define H2_PIN A3
#define CH4_PIN A2
#define ALC_PIN A1

#include <SoftwareSerial.h>

//softwareserial用変数
SoftwareSerial mySerial(RX_PIN, TX_PIN); // RX, TX
//NeoPixel用変数
Adafruit_NeoPixel strip1 = Adafruit_NeoPixel(14 , TAPE1, NEO_GRB + NEO_KHZ800);

void setup()
{
  mySerial.begin(9600);
  Serial.begin(9600);
  strip1.begin();
  strip1.show(); // Initialize all pixels to 'off'
  strip1.setBrightness(128);
  /*
  strip2.begin();
  strip2.show(); // Initialize all pixels to 'off'
  strip3.begin();
  strip3.show(); // Initialize all pixels to 'off'
  strip4.begin();
  strip4.show(); // Initialize all pixels to 'off'
  */

  //
  //ledSetColor(strip1.Color(100, 0, 0), 80);
}

void loop() // run over and over
{
  int sen1 = analogRead(ALC_PIN);
  int sen2 = analogRead(CH4_PIN);
  int sen3 = analogRead(H2_PIN);
/*
  mySerial.print("ALC:");
  mySerial.print(sen1);
  mySerial.print(",");
  mySerial.print("CH4:");
  mySerial.print(sen2);
  mySerial.print(",");
  mySerial.print("H2:");
  mySerial.println(sen3);
  */
  mySerial.print(sen1);
  mySerial.print(",");
  mySerial.print(sen2);
  mySerial.print(",");
  mySerial.print(sen3);
  mySerial.print("-");

  Serial.print(sen1);
  Serial.print(",");
  Serial.print(sen2);
  Serial.print(",");
  Serial.print(sen3);
  Serial.println("-");

  //levelMeter(100, 0, 0);
  //delay(1000);
  //colorWipe(strip1.Color(sen1*0.25, sen2*0.25, sen3*0.25), 50);
  //colorWipe(strip1.Color(50, 0, 0), 50);
  //delay(1000);
  //colorWipe(strip1.Color(50, 50, 50), 50);
  //delay(1000);
  //theaterChase1(strip1.Color(sen1*0.25, sen2*0.25, sen3*0.25), 50);//0.25=255/1024
  //theaterChase2(strip2.Color(sen1, sen2, sen3), 50);
  //theaterChase3(strip3.Color(sen1, sen2, sen3), 50);
  //theaterChase4(strip4.Color(sen1, sen2, sen3), 50);

  ledSetColor(strip1.Color(sen1*0.25, sen2*0.25, sen3*0.25), 50);
}

void levelMeter(uint32_t r,uint32_t g,uint32_t b){
 for(uint16_t i=0; i<strip1.numPixels(); i++) {
  strip1.setPixelColor(i, strip1.Color(isFlash(r,i),isFlash(g,i),isFlash(b,i)));
  strip1.show();
  }
}

int isFlash(uint32_t c,uint32_t celNum){
  if(c>celNum*18)return 255;
  else return 0;
}

// Fill the dots one after the other with a color
void colorWipe(uint32_t c, uint8_t wait) {
  for(uint16_t i=0; i<strip1.numPixels(); i++) {
  strip1.setPixelColor(i, c);
  strip1.show();
  delay(wait);
  }
}

void ledSetColor(uint32_t c,uint8_t wait){
  for(uint16_t i = 0 ; i< strip1.numPixels();i++){
  strip1.setPixelColor(i,c);
  strip1.show();
  delay(100);
  }
}

void theaterChase1(uint32_t c, uint8_t wait) {
  for (int j=0; j<10; j++) { //do 10 cycles of chasing
  for (int q=0; q < 3; q++) {
  for (int i=0; i < strip1.numPixels(); i=i+3) {
  strip1.setPixelColor(i+q, c); //turn every third pixel on
  }
  strip1.show();

  delay(wait);

  for (int i=0; i < strip1.numPixels(); i=i+3) {
  strip1.setPixelColor(i+q, 0); //turn every third pixel off
  }
  }
  }
}
