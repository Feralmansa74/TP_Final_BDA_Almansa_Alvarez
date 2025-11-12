#include <Servo.h>

Servo servoPiernaIzq;
Servo servoPiernaDer;
Servo servoPieIzq;
Servo servoPieDer;

const int pinTrig = 7;
const int pinEcho = 8;

long duracion;
int distancia;

void setup() {
  servoPiernaIzq.attach(2);
  servoPiernaDer.attach(3);
  servoPieIzq.attach(4);
  servoPieDer.attach(5);
  pinMode(pinTrig, OUTPUT);
  pinMode(pinEcho, INPUT);
  servoPiernaIzq.write(90);
  servoPiernaDer.write(90);
  servoPieIzq.write(90);
  servoPieDer.write(90);
}

void loop() {
  digitalWrite(pinTrig, LOW);
  delayMicroseconds(2);
  digitalWrite(pinTrig, HIGH);
  delayMicroseconds(10);
  digitalWrite(pinTrig, LOW);
  duracion = pulseIn(pinEcho, HIGH, 30000);  // timeout de 30ms por seguridad
  if (duracion == 0) {
    distancia = 999;  // fuera de rango
  } else {
    distancia = duracion * 0.034 / 2;  // convertir microsegundos a cm
  }

  if (distancia < 15) {
    // **Evitación de obstáculo**: paso atrás y giro
    // Paso atrás: mover piernas hacia atrás 
    servoPiernaIzq.write(120);
    servoPiernaDer.write(60);
    servoPieIzq.write(90);
    servoPieDer.write(90);
    delay(500);
    servoPieIzq.write(120);
    servoPieDer.write(60);
    delay(500);
    servoPieIzq.write(90);
    servoPieDer.write(90);
    servoPiernaIzq.write(90);
    servoPiernaDer.write(90);
    servoPieIzq.write(90);
    servoPieDer.write(90);
    servoPiernaIzq.write(60);  
    servoPiernaDer.write(60);
    delay(500);
    servoPiernaIzq.write(90);
    servoPiernaDer.write(90);
  } else {
    servoPieIzq.write(60);
    servoPieDer.write(90);
    servoPiernaIzq.write(120);
    servoPiernaDer.write(120);
    delay(500);
    servoPieIzq.write(90);
    servoPieDer.write(60);
    servoPiernaIzq.write(60);
    servoPiernaDer.write(60);
    delay(500);
    servoPiernaIzq.write(90);
    servoPiernaDer.write(90);
    servoPieIzq.write(90);
    servoPieDer.write(90);
    delay(200);
  }
}
