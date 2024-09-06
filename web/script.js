let trail1 = [];
let trail2 = [];
let cords1 = []; // sent by server
let cords2 = [];

function end() {}

function update() {
  //(main loop) caled every packet from server 10ms
}

function menu() {}

function draw() {
  // check this
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.beginPath();
  ctx.moveTo(trail1[0].x, trail1[0].y);
  for (let i = 1; i < trail1.length; i++) {
    ctx.lineTo(trail1[i].x, trail1[i].y);
  }
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(trail2[0].x, trail2[0].y);
  for (let i = 1; i < trail2.length; i++) {
    ctx.lineTo(trail2[i].x, trail2[i].y);
  }
  ctx.stroke();
}

window.onload = function () {
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
};
