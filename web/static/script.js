let canvas;
let ctx;
let player1 = new Image();
player1.src = "/player1.png";
let player2 = new Image();
player2.src = "/player2.png";
let stage = "menu";
let trails = []; // sent by server
let cords = []; // sent by server
let lastUpdate = Date.now();
let socket;
let conected = false;
let disconected = false;
let lobby_creator = false;
let last_view; // more presise version of stage for lobby views
let directions = ["up", "right", "down", "left"];
let direction = 1;
let game_active = false;

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

function start(players) {
  // start sockets coms
}

function end_game() {}

function update() {
  //(main loop) caled every packet from server 10ms
  draw();
}

function load(mode) {
  socket.emit("play", { mode: mode });
}

function conection() {
  // might not need this
  if (Date.now() - lastUpdate > 1000) {
    // make it a custom alert (overlay)
    // alert("connection lost/ server error");
  }

  setTimeout(conection, 500);
}

function draw() {
  // check this
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  draw_grid();
  for (let i = 0; i < trails.length; i++) {
    if (trails[i].id == socket.id) {
      // wont work find place to get id
      ctx.fillStyle = "blue";
    } else {
      ctx.fillStyle = "red";
    }
    ctx.fillStyle = trails[i].color;
    for (let j = 0; j < trails[i].trail.length; j++) {
      ctx.fillRect(trails[i].trail[j].x, trails[i].trail[j].y, 10, 10);
    }
  }
  for (let i = 0; i < cords.length; i++) {
    if (cords[i].id == socket.id) {
      ctx.drawImage(player1, cords[i].x, cords[i].y, 10, 10);
    } else {
      ctx.drawImage(player2, cords[i].x, cords[i].y, 10, 10);
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

  socket = io("localhost:80/");

  socket.on("connect", () => {
    console.log("connected");
    if (disconected) {
      alert("reconnected"); // TODO make it a custom alert (overlay) or use a modul
    }
    conection();
    conected = true;
    disconected = false;
    console.log(socket.id);
  });

  socket.on("disconnected", (reason, details) => {
    console.log("disconnected because " + reason);
    setScreen("menu");
    alert("disconnected"); // make it a custom alert (overlay)
    conected = false;
    disconected = true;
  });

  socket.on("game_update", (data) => {
    if (data.opration == "end") {
      setScreen("end");
      end_game();
    } else if (data.opration == "kill") {
      console.log("dead");
    } else {
      trails = data.trails;
      cords = data.cords;
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
      screens.game.addEventListener("keydown", (e) => {
        switch (e.key) {
          case "w":
            socket.emit("speed", { speed: 2 });
          case "a":
            direction += 1;
            if (direction > 3) {
              direction = 0;
            }
            socket.emit("game_update", { direction: directions[direction] });
          case "s":
            direction -= 1;
            if (direction < 0) {
              direction = 3;
            }
            socket.emit("game_update", { direction: directions[direction] });
        }
      });
      screens.game.addEventListener("keyup", (e) => {
        switch (e.key) {
          case "w":
            if (game_active) {
              socket.emit("speed", { speed: 1 });
            }
        }
      });
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
