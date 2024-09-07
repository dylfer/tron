let canvas;
let ctx;
let player1 = new Image();
player1.src = "player1.png";
let player2 = new Image();
player2.src = "player2.png";
let stage = "menu";
let trail1 = [
  { x: 10, y: 50 }, // temp values
  { x: 50, y: 50 },
  { x: 50, y: 90 },
]; // sent by server
let trail2 = [
  { x: 190, y: 50 },
  { x: 150, y: 50 },
  { x: 150, y: 10 },
];
let cords1 = { x: 50, y: 90 }; // sent by server
let cords2 = { x: 150, y: 10 };

function setScreen(screen) {
  switch (screen) {
    case "menu":
      document.getElementById(stage).style.display = "none";
      document.getElementById("menu").style.display = "block";
      break;
    case "game":
      start();
      break;
    case "end":
      end();
      break;
  }
  stage = screen;
}

function start() {
  // start using sockets
}

function end() {}

function update() {
  //(main loop) caled every packet from server 10ms
}

function menu() {}

function draw() {
  // check this
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.beginPath();
  ctx.strokeStyle = "#0000ff";
  ctx.moveTo(trail1[0].x, trail1[0].y);
  for (let i = 1; i < trail1.length; i++) {
    ctx.lineTo(trail1[i].x, trail1[i].y);
  }
  ctx.stroke();
  ctx.beginPath();
  ctx.strokeStyle = "#ff0000";
  ctx.moveTo(trail2[0].x, trail2[0].y);
  for (let i = 1; i < trail2.length; i++) {
    ctx.lineTo(trail2[i].x, trail2[i].y);
  }
  ctx.stroke();
}

window.onload = function () {
  canvas = document.getElementById("game");
  ctx = canvas.getContext("2d");
  ctx.drawImage(canvas, 0, 0);

  const socket = io("localhost:5001/");
};
