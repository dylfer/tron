//
// Tron - a server based multiplayer tron game for the web
// Copyright (C) 2024 Dylan Ferrow
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.
//
//
//NOTE: this has only been used for personal use. i dont own the images used in this project, use them at your own risk, thy are not part of this license suplied with this project

let canvas;
let ctx;
let player1 = new Image();
player1.src = "/player1.png";
let player2 = new Image();
player2.src = "/player2.png";
let stage = "menu";
// let trails = []; // sent by server
// let cords = []; // sent by server
let game = {}; // sent by server
let lastUpdate = Date.now();
let socket;
let conected = false;
let disconected = false;
let lobby_creator = false;
let last_view; // more presise version of stage for lobby views
let directions = ["up", "right", "down", "left"];
let direction = 1;
let game_active = false;
let reverse = false; // so evreyone is on the left side of the screen

///////////////

let lobby_hidden = true;
// let menu;
// let lobby;
// let game;
// let end;
// let starting;
let starting_info;
let code_join_section;
let lobby_name_section;
let lobby_joined_section;
let join_code;
let username;
let screens = {
  menu: menu,
  lobby: lobby,
  game: game,
  end: end,
  starting: starting,
};

///////////////

let lobby_max_players;
let lobby_rounds;
let lobby_speed;
let lobby_trail;
let lobby_color;
let lobby_rgb;

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
  screens[stage].classList.add("hidden");
  screens[screen].classList.remove("hidden");
  stage = screen;
}

function draw_grid() {
  ctx.strokeStyle = "lightgrey";
  ctx.lineWidth = 0.1;
  ctx.beginPath();
  for (let i = 0; i < canvas.width; i += 10) {
    ctx.moveTo(i, 0);
    ctx.lineTo(i, canvas.height);
  }
  for (let i = 0; i < canvas.height; i += 10) {
    ctx.moveTo(0, i);
    ctx.lineTo(canvas.width, i);
  }
  ctx.moveTo(canvas.width, canvas.height);
  ctx.lineTo(0, canvas.height);
  ctx.moveTo(canvas.width, canvas.height);
  ctx.lineTo(canvas.width, 0);
  ctx.stroke();
}

function end_game() {}

function update() {
  //(main loop) caled every packet from server 10ms
  draw();
}

function load(mode) {
  socket.emit("play", { mode: mode });
}

// function conection() {
//   // might not need this
//   if (Date.now() - lastUpdate > 1000) {
//     // make it a custom alert (overlay)
//     // alert("connection lost/ server error");
//   }

//   setTimeout(conection, 500);
// }

function keydown(e) {
  console.log(e.key);
  switch (e.key) {
    case "w":
      socket.emit("speed", { opration: "speed", speed: 2 });
      break;
    case "a":
      direction -= 1;
      if (direction < 0) {
        direction = 3;
      }
      console.log("left", direction); // Add debugging log
      console.log(directions);
      socket.emit("game_update", {
        opration: "direction",
        direction: directions[direction], // ?? works somtimes ??
      });
      break;
    case "d":
      direction += 1;
      if (direction > 3) {
        direction = 0;
      }
      console.log("right", direction); // Add debugging log
      console.log(directions);
      socket.emit("game_update", {
        opration: "direction",
        direction: directions[direction], // ?? works somtimes ??
      });
      break;
  }
}

function keyup(e) {
  switch (e.key) {
    case "w":
      if (game_active) {
        socket.emit("speed", { opration: "speed", speed: 1 });
      }
      break; // Add break here
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  draw_grid();
  ctx.lineWidth = 1;
  for (const id in game) {
    if (id == socket.id) {
      ctx.strokeStyle = "rgb(0, 150, 255)";
    } else {
      ctx.strokeStyle = "red";
    }

    ctx.beginPath(); // Begin a new path for each player's trail

    for (let i = 0; i < game[id].trail.length - 1; i++) {
      ctx.moveTo(game[id].trail[i][0], game[id].trail[i][1]);
      ctx.lineTo(game[id].trail[i + 1][0], game[id].trail[i + 1][1]);
    }

    ctx.stroke(); // Stroke the path
    ctx.closePath(); // Optionally close the path
  }

  for (const id in game) {
    if (id == socket.id) {
      ctx.drawImage(player1, game[id].cord[0], game[id].cord[1] - 5, 30, 10);
    } else {
      ctx.drawImage(player2, game[id].cord[0], game[id].cord[1] - 5, 30, 10);
    }
  }
}

///////////////

window.onload = function () {
  canvas = document.getElementById("game");
  canvas.width = 1500;
  canvas.height = 800;
  ctx = canvas.getContext("2d");
  ctx.drawImage(canvas, 0, 0);

  socket = io(window.location.host + "/", {
    transports: ["websocket", "polling", "flashsocket"],
  });

  socket.on("connect", () => {
    console.log("connected");
    if (disconected) {
      alert("reconnected"); // TODO make it a custom alert (overlay) or use a modul
    }
    // conection();
    conected = true;
    disconected = false;
    console.log(socket.id);
  });

  socket.on("connect_error", (err) => {
    console.log(`connect_error due to ${err.message}`);
  });

  socket.on("disconnected", (reason, details) => {
    console.log("disconnected because " + reason);
    setScreen("menu");
    alert("disconnected"); // make it a custom alert (overlay)
    conected = false;
    disconected = true;
  });

  socket.on("game_update", (data) => {
    // console.log("update");
    if (data.opration == "end") {
      setScreen("end");
      end_game();
    } else if (data.opration == "kill") {
      console.log("dead");
      alert("end");
      window.location.reload();
    } else {
      // console.log("movement");
      game = data.data;
      lastUpdate = Date.now();
      update();
    }
  });

  socket.on("start", (data) => {
    if (data.opration == "4") {
      setScreen("game");
      draw_grid();
      console.log("game starting");
    }

    if (data.opration == "0") {
      game_active = true;
      direction = 1;
      console.log(screens.game);
      screens.game.focus();
      screens.game.addEventListener("keydown", keydown);
      screens.game.addEventListener("keyup", keyup);
    }
    // alert(`starting in ${data.secconds}`); // make it a custom alert (overlay)
  });

  socket.on("starting", (data) => {
    if (data.opration == "matching") {
      setScreen("starting");
    }
    starting_info.innerHTML = data.opration;
  });

  socket.on("code", (data) => {
    screens.lobby.innerHTML += data.code;
    if (lobby_hidden) {
      // ?????????????????
      lobby.classList.remove("hidden");
      lobby_hidden = false;
    }
    switch (data.section) {
      case "lobby_name_section":
        lobby_name_section = document.getElementById("lobby-name");
        button_lobby_name = document.getElementById("lobby-name-btn");
        username = document.getElementById("name-input");
        screens.menu.classList.add("hidden");
        lobby_name_section.classList.remove("hidden");
        button_lobby_name.addEventListener("click", () => {});
        break;
      case "code_join_section":
        code_join_section = document.getElementById("lobby-code-join");
        button_lobby_join = document.getElementById("lobby-join-btn");
        screens.menu.classList.add("hidden");
        code_join_section.classList.remove("hidden");
        button_lobby_join.addEventListener("click", () => {});
        break;
      case "lobby_joined_section":
        lobby_joined_section = document.getElementById("lobby-joined");
        button_lobby_settings = document.getElementById("lobby-settings-btn");
        button_lobby_start = document.getElementById("lobby-start-btn");
        screens.menu.classList.add("hidden");
        lobby_joined_section.classList.remove("hidden");
        button_lobby_settings.addEventListener("click", () => {});
        button_lobby_start.addEventListener("click", () => {});
        break;
      case "lobby_settings_section":
        lobby_settings_section = document.getElementById("lobby-settings");
        button_lobby_settings_save = document.getElementById(
          "lobby-settings-save-btn"
        );
        screens.menu.classList.add("hidden");
        lobby_settings_section.classList.remove("hidden");
        button_lobby_settings_save.addEventListener("click", () => {});
        break;
    }
  });

  screens.menu = document.getElementById("menu");
  screens.lobby = document.getElementById("lobby");
  screens.game = document.getElementById("game-screen");
  screens.end = document.getElementById("end");
  screens.starting = document.getElementById("starting");
  starting_info = document.getElementById("starting-info");

  // code_join_section = document.getElementById("lobby-code-join");
  // lobby_name_section = document.getElementById("lobby-name");
  // lobby_joined_section = document.getElementById("lobby-joined");
  // join_code = document.getElementById("join-code-input");
  // username = document.getElementById("name-input");

  last_view = menu;

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
  // button_lobby_join = document.getElementById("lobby-join-btn"); // add when html added from server
  // button_lobby_name = document.getElementById("lobby-name-btn"); //
  // button_lobby_settings = document.getElementById("lobby-settings-btn");
  // button_lobby_start = document.getElementById("lobby-start-btn");
  // button_lobby_settings_save = document.getElementById("lobby-settings-save-btn");

  /////////////

  // button_local_1_player.addEventListener("click", () => {

  // });
  // button_local_2_player.addEventListener("click", () => {

  // });
  button_2_player.addEventListener("click", () => {
    load("2_player");
  });
  button_4_player.addEventListener("click", () => {
    load("4_player");
  });

  // button_cerate_lobby.addEventListener("click", () => {
  //   load("create_lobby");
  //   // menu.classList.add("hidden");
  //   // lobby_name_section.classList.remove("hidden");
  // });

  // button_join_lobby.addEventListener("click", () => {
  //   load("join_lobby");
  // });
};
