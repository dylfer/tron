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
let explosion = new Image();
explosion.src = "/explosion.png";
let stage = "login";
let game = {}; // sent by server
let lastUpdate = Date.now();
let socket;
let conected = false;
let disconected = false;
let lobby_creator = false;
let last_view; // more presise version of stage for lobby views
let directions = ["right", "down", "left", "up"];
let direction = 0;
let game_active = false;
let dead = false;
let reverse = false; // so evreyone is on the left side of the screen
game_mode = "";

///////////////

let lobby_hidden = true;
let starting_info;
let code_join_section;
let lobby_name_section;
let lobby_joined_section;
let join_code;
let username;
let screens = {
  login: null,
  admin: null,
  lobby: null,
  game: null,
  end: null,
  starting: null,
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
let button_end_new_game;
let button_end_menu;
let button_end_rematch;
let button_login;

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

function explode(cord, frame, explosion_background = null) {
  if (explosion_background != null) {
    ctx.putImageData(explosion_background, 0, 0);
  } else {
    ctx.clearRect(cord[0] - 60 / 2, cord[1] - 60 / 2, 60, 60); // Clear the area before drawing the image
  }
  y = 0;
  y = Math.floor(frame / 8);
  ctx.drawImage(
    explosion,
    (frame % 8) * 257.5 + 25,
    y * 257.5 + 20,
    220,
    220,
    cord[0] - 60 / 2,
    cord[1] - 60 / 2,
    60,
    60
  );
  if (frame >= 48) {
    return;
  }
  setTimeout(() => {
    explode(cord, frame + 1, explosion_background);
  }, 25);
}

function kill(user) {
  if (Object.keys(game).length == 2) {
    explosion_background = ctx.getImageData(0, 0, canvas.width, canvas.height);
    explode(game[user].cord, 0, explosion_background);
  } else {
    explode(game[user].cord, 0);
  }
  if (user == socket.id) {
    dead = true;
    Swal.fire({
      allowOutsideClick: false,
      allowEscapeKey: false,
      position: "top",
      customClass: {
        popup: "mt-20",
      },
      confirmButtonText: "View game",
      title: `You died`,
    });
  }
}

function end_game() {
  const opponentId = Object.keys(game).find((id) => id !== socket.id);
  if (dead) {
    Swal.fire({
      allowOutsideClick: false,
      allowEscapeKey: false,
      position: "top",
      customClass: {
        popup: "mt-20 bg-gray-800 text-white rounded-lg shadow-lg",
        title: "text-2xl font-bold text-red-500",
        confirmButton:
          "bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded",
      },
      confirmButtonText: "Next",
      title: `You died`,
      html: `
        <div class="flex w-full justify-center items-center space-x-8">
          <div class="flex flex-col items-center p-5 bg-gray-700 rounded-lg shadow-md">
          <h2 class="text-lg font-semibold  text-red-400">Your Stats</h2>
          <p class="mt-2">Username: <span class="font-bold">${
            game[socket.id].username
          }</span></p>
          <p>Games Won: <span class="font-bold text-green-400">${
            game[socket.id].gamesWon || 0
          }</span></p>
          <p>Games Lost: <span class="font-bold text-red-400">${
            game[socket.id].gamesLost || 0
          }</span></p>
          </div>
          <div class="flex flex-col items-center p-5 bg-gray-700 rounded-lg shadow-md">
          <h2 class="text-lg font-semibold  text-green-400">Opponent Stats</h2>
          <p class="mt-2">Username: <span class="font-bold">${
            game[opponentId].username
          }</span></p>
          <p>Games Won: <span class="font-bold text-green-400">${
            game[opponentId].gamesWon || 0
          }</span></p>
          <p>Games Lost: <span class="font-bold text-red-400">${
            game[opponentId].gamesLost || 0
          }</span></p>
          </div>
        </div>
        `,
    }).then((result) => {
      if (result.isConfirmed) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setScreen("end");
      }
    });
  } else {
    Swal.fire({
      allowOutsideClick: false,
      allowEscapeKey: false,
      position: "top",
      customClass: {
        popup: "mt-20 bg-gray-800 text-white rounded-lg shadow-lg",
        title: "text-2xl font-bold text-green-500",
        confirmButton:
          "bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded",
      },
      confirmButtonText: "Next",
      title: `You won`,
      html: `
        <div class="flex w-full justify-center items-center space-x-8">
        <div class="flex flex-col items-center p-5 bg-gray-700 rounded-lg shadow-md">
          <h2 class="text-lg font-semibold text-green-400">Your Stats</h2>
          <p class="mt-2">Username: <span class="font-bold">${
            game[socket.id].username
          }</span></p>
          <p>Games Won: <span class="font-bold text-green-400">${
            game[socket.id].gamesWon || 0
          }</span></p>
          <p>Games Lost: <span class="font-bold text-red-400">${
            game[socket.id].gamesLost || 0
          }</span></p>
        </div>
        <div class="flex flex-col items-center p-5 bg-gray-700 rounded-lg shadow-md">
          <h2 class="text-lg font-semibold text-red-400">Opponent Stats</h2>
          <p class="mt-2">Username: <span class="font-bold">${
            game[opponentId].username
          }</span></p>
          <p>Games Won: <span class="font-bold text-green-400">${
            game[opponentId].gamesWon || 0
          }</span></p>
          <p>Games Lost: <span class="font-bold text-red-400">${
            game[opponentId].gamesLost || 0
          }</span></p>
        </div>
        </div>
        `,
    }).then((result) => {
      if (result.isConfirmed) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setScreen("end");
      }
    });
  }
}

function update() {
  //(main loop) caled every packet from server 10ms
  draw();
}

function load(mode) {
  game_mode = mode;
  username = document.getElementById("username").value;
  localStorage.setItem("username", username);
  socket.emit("play", { mode: mode, username: username });
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
      socket.emit("speed", { operation: "speed", speed: 2 });
      break;
    case "a":
      direction -= 1;
      if (direction < 0) {
        direction = 3;
      }
      console.log("left", direction); // Add debugging log
      console.log(directions);
      socket.emit("game_update", {
        operation: "direction",
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
        operation: "direction",
        direction: directions[direction], // ?? works somtimes ??
      });
      break;
  }
}

function keyup(e) {
  switch (e.key) {
    case "w":
      if (game_active) {
        socket.emit("speed", { operation: "speed", speed: 1 });
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
      ctx.save(); // Save the current state
      ctx.translate(game[id].cord[0], game[id].cord[1]); // Move to the player's position
      ctx.rotate((direction * Math.PI) / 2); // Rotate based on direction
      console.log(direction);
      ctx.drawImage(player1, -10, -10, 60, 20); // Draw the image centered at the position
      ctx.restore(); // Restore the original state
    } else {
      ctx.save(); // Save the current state
      ctx.translate(game[id].cord[0], game[id].cord[1]); // Move to the player's position
      ctx.rotate((directions.indexOf(game[id].direction) * Math.PI) / 2); // Rotate based on direction
      console.log(directions.indexOf(game[id].direction));
      ctx.drawImage(player2, -10, -10, 60, 20); // Draw the image centered at the position
      ctx.restore(); // Restore the original state
    }
  }
}

///////////////

function display_games(games) {
  const gamesList = document.getElementById("admin-games");
  gamesList.innerHTML = "";
  for (const people of Object.keys(games)) {
    for (let game_no = 0; game_no < games[people].length; game_no++) {
      const div = document.createElement("div");
      div.className =
        "grid grid-cols-6 gap-2 bg-gray-700 text-white p-2 rounded-lg shadow-md";
      div.innerHTML = `
        <span>${games[people][game_no].room}</span>
        <span>${people}_player</span>
        <span>${games[people][game_no].state}</span>
        <span>${games[people][game_no].players.length}</span>
        <span>${games[people][game_no].frame}</span>
        <span>players alive</span>`;
      gamesList.appendChild(div);
    }
  }
}

function display_clients(clients) {
  const clientsList = document.getElementById("admin-clients");
  clientsList.innerHTML = "";
  for (const client of Object.keys(clients)) {
    const div = document.createElement("div");
    div.className =
      "grid grid-cols-4 gap-2 bg-gray-700 text-white p-2 rounded-lg shadow-md";
    div.innerHTML = `
      <span>${client}</span>
      <span>${clients[client].username}</span>
      <span>${clients[client].status}</span>
      <span>${clients[client].mode}</span>`;
    clientsList.appendChild(div);
  }
}

function login() {
  let login_username = document.getElementById("login-username").value;
  let login_password = document.getElementById("login-password").value;
  socket.emit("admin", {
    operation: "login",
    username: login_username,
    password: login_password,
  });
}

function live_check() {
  if (stage == "admin") {
    if (lastUpdate - Date.now() > 1000) {
      // TODO add alert
      setScreen("login");
    }
  }
  setTimeout(live_check, 1000);
}

///////////////

window.onload = function () {
  document.getElementById("username").value = "admin";
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

  socket.on("login", (data) => {
    if (data.complete) {
      setScreen("admin");
    } else {
      document.getElementById("error-box").innerHTML =
        "Invalid username or password";
    }
    document.getElementById("error-box").classList.remove("hidden");
  });

  socket.on("admin_update", (data) => {
    if (data.operation == "update") {
      display_games(data.games);
      display_clients(data.clients);
    }
  });

  socket.on("game_update", (data) => {
    if (data.operation == "end") {
      game_active = false;
      // setScreen("end");
      end_game(data);
    } else if (data.operation == "kill") {
      console.log("dead");
      kill(data.user);
      // window.location.reload();
    } else if (data.operation == "update") {
      // console.log("movement");
      game = data.data;
      lastUpdate = Date.now();
      update();
    } else {
      alert("error: " + data.operation); // make it a custom alert (overlay)
    }
  });

  socket.on("error", (data) => {
    if (data.operation == "inappropriate username") {
      Swal.fire({
        position: "top",
        customClass: {
          popup: "mt-20",
        },
        title: `${data.operation}`,
        showConfirmButton: false,
        timer: 5000,
      });
    }
  });

  socket.on("start", (data) => {
    if (data.operation == "4") {
      setScreen("game");
      draw_grid();
      console.log("game starting");
    }

    if (data.operation == "0") {
      dead = false;
      game = {};
      game_active = true;
      direction = 0;
      console.log(screens.game);
      screens.game.focus();
      screens.game.addEventListener("keydown", keydown);
      screens.game.addEventListener("keyup", keyup);
    } else {
      if (data.operation == "1") {
        Swal.fire({
          position: "top",
          width: "10%",
          customClass: {
            popup: "mt-20",
          },
          title: `${data.operation}`,
          showConfirmButton: false,
          timer: 500,
        });
      }
      Swal.fire({
        position: "top",
        width: "10%",
        customClass: {
          popup: "mt-20",
        },
        title: `${data.operation}`,
        showConfirmButton: false,
        timer: 900,
      });
    }
    // alert(`starting in ${data.secconds}`); // make it a custom alert (overlay)
  });

  socket.on("starting", (data) => {
    if (data.operation == "matching") {
      setScreen("starting");
    }
    starting_info.innerHTML = data.operation;
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
        username = document.getElementById("name-input"); //?? fix for new username system
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
  screens.login = document.getElementById("login");
  screens.admin = document.getElementById("admin");
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
  // username = document.getElementById("name-input"); //?? fix for new username system

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

  button_end_new_game = document.getElementById("end-new-game-btn");
  button_end_menu = document.getElementById("end-main-menu-btn");
  button_end_rematch = document.getElementById("end-rematch-btn");

  //////////////

  button_login = document.getElementById("login-btn");

  //////////////

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

  button_end_new_game.addEventListener("click", () => {
    setScreen("menu");
    load(game_mode);
  });
  button_end_menu.addEventListener("click", () => {
    setScreen("menu");
  });

  button_login.addEventListener("click", () => {
    login();
  });
  document.getElementById("login-password").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      login();
    }
  });
};
