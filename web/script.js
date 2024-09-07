let canvas;
let ctx;
let player1 = new Image();
player1.src = "/player1.png";
let player2 = new Image();
player2.src = "/player2.png";
let stage = "menu";
let trail1 = []; // sent by server
let trail2 = [];
let cords1 = { x: 10, y: 50 }; // sent by server
let cords2 = { x: 90, y: 50 };
let lastUpdate = Date.now();
let menu;
let lobby;
let game;
let end;

///////////////

let button_local_1_player;
let button_local_2_player;
let button_2_player;
let button_4_player;
let button_cerate_lobby;
let button_join_lobby;
let button_lobby_join;
let button_lobby_name;
let button_lobby_settings;
let button_lobby_start;
let button_lobby_settings_save;

///////////////

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

function conection() {
  if (Date.now() - lastUpdate > 1000) {
    // make it a custom alert (overlay)
    alert("connection lost");
  }

  setTimeout(conection, 500);
}

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

///////////////

window.onload = function () {
  canvas = document.getElementById("game");
  ctx = canvas.getContext("2d");
  ctx.drawImage(canvas, 0, 0);

  const socket = io("localhost:5001/");

  socket.on("connect", () => {
    console.log("connected");
  });

  socket.on("update", (data) => {
    trail1 = data.trail1;
    trail2 = data.trail2;
    cords1 = data.cords1;
    cords2 = data.cords2;
    lastUpdate = Date.now();
  });

  menu = document.getElementById("menu");
  lobby = document.getElementById("lobby");
  game = document.getElementById("game");
  end = document.getElementById("end");
  code_join_section = document.getElementById("lobby-code-join");
  lobby_name_section = document.getElementById("lobby-name");
  lobby_joined_section = document.getElementById("lobby-joined");
  join_code = document.getElementById("join-code-input");
  username = document.getElementById("name-input");

  /////////////

  lobby_max_players = document.getElementById(
    "lobby-settings-max-players-input"
  );
  lobby_rounds = document.getElementById("lobby-settings-rounds-input");
  lobby_speed = document.getElementById("lobby-settings-speed-input");
  lobby_trail = document.getElementById("lobby-settings-trail-input");
  lobby_color = document.getElementById("lobby-settings-color-input");
  lobby_rgb = document.getElementById("lobby-settings-rgb-input");

  /////////////

  button_local_1_player = document.getElementById("local-1-player-btn");
  button_local_2_player = document.getElementById("local-2-player-btn");
  button_2_player = document.getElementById("2-player-btn");
  button_4_player = document.getElementById("4-player-btn");
  button_cerate_lobby = document.getElementById("create-lobby-btn");
  button_join_lobby = document.getElementById("join-lobby-btn");
  button_lobby_join = document.getElementById("lobby-join-btn");
  button_lobby_name = document.getElementById("lobby-name-btn");
  button_lobby_settings = document.getElementById("lobby-settings-btn");
  button_lobby_start = document.getElementById("lobby-start-btn");
  button_lobby_settings_save = document.getElementById(
    "lobby-settings-save-btn"
  );
};
