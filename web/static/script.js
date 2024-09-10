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
let socket;
let conected = false;
let disconected = false;
let lobby_creator = false;
let last_view; // more presise version of stage for lobby views

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

function start(players) {
  // start sockets coms
}

function end_game() {}

function update() {
  //(main loop) caled every packet from server 10ms
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

  socket = io("localhost:80/");

  socket.on("connect", () => {
    console.log("connected");
    if (disconected) {
      alert("reconnected"); // make it a custom alert (overlay)
    }
    conection();
    conected = true;
    disconected = false;
  });

  socket.on("game_update", (data) => {
    trails = data.trails;
    cords = data.cords;
    lastUpdate = Date.now();
    update();
  });

  socket.on("start", (data) => {
    // alert(`starting in ${data.secconds}`); // make it a custom alert (overlay)
  });

  socket.on("starting", (data) => {
    setScreen("starting");
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
