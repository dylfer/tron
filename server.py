#
# Tron - a server based multiplayer tron game for the web
# Copyright (C) 2024 Dylan Ferrow
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <https://www.gnu.org/licenses/>.
#
#
# NOTE: this has only been used for personal use. i dont own the images used in this project, use them at your own risk, thy are not part of this license suplied with this project
#
#

from flask import Flask, request, jsonify, render_template
# join_room, leave_room, close_room, rooms, disconnect
from flask_socketio import SocketIO, emit, join_room, close_room, rooms
from flask_cors import CORS
import json
import os
import time
import pygame
import hashlib
# use time to ajust the game clock for error in time

app = Flask(__name__,
            static_folder="web/static",
            template_folder="web/templates",
            static_url_path="")
app.config['SECRET_KEY'] = 'secret!'
CORS(app, resources={r"/*": {"origins": "*"}})
socketio = SocketIO(app, cors_allowed_origins="*")

admin = {"id": "", "username": "", "update": False}
clients = {}
games = {2: [], 4: []}  # active games and players
# game modes just to keep pleayer count
modes = {"2_player": [], "4_player": []}
queues = {"2_player": [], "4_player": []}
lobbies = {}  # lobbies, rooms, players and settings
clock = pygame.time.Clock()
badwords = []


# game logic

def shorten_trail(trail):
    if len(trail) <= 3:
        return trail

    shortened_trail = [trail[0]]  # Start with the first coordinate
    current_direction = None

    for i in range(1, len(trail) - 2):
        prev_coord = trail[i - 1]
        curr_coord = trail[i]

        # Determine the direction
        if curr_coord[0] == prev_coord[0]:  # Vertical movement
            if curr_coord[1] > prev_coord[1]:
                direction = 'down'
            else:
                direction = 'up'
        elif curr_coord[1] == prev_coord[1]:  # Horizontal movement
            if curr_coord[0] > prev_coord[0]:
                direction = 'right'
            else:
                direction = 'left'
        else:
            continue  # Skip diagonal movements

        # Add coordinate if direction changes
        if direction != current_direction:
            shortened_trail.append(prev_coord)
            current_direction = direction

    # Add the last 3 coordinates
    shortened_trail.extend(trail[-3:])

    return shortened_trail


def is_between(a, b, c):
    return min(a, b) <= c <= max(a, b)


def lines_intersect(line1, line2):
    (x1, y1), (x2, y2) = line1
    (x3, y3), (x4, y4) = line2

    if x1 == x2:  # line1 is vertical
        if x3 == x4:  # line2 is also vertical
            return x1 == x3 and (is_between(y1, y2, y3) or is_between(y1, y2, y4))
        else:  # line2 is horizontal
            return is_between(y1, y2, y3) and (is_between(x1, x2, x3) or is_between(x1, x2, x4))
    else:  # line1 is horizontal
        if x3 == x4:  # line2 is vertical
            return is_between(x1, x2, x3) and (is_between(y1, y2, y3) or is_between(y1, y2, y4))
        else:  # line2 is also horizontal
            return y1 == y3 and (is_between(x1, x2, x3) or is_between(x1, x2, x4))


def check_kill(trail, tip):
    for i in range(len(trail) - 1):
        if lines_intersect((trail[i], trail[i + 1]), (tip[0], tip[1])):
            return True
    return False


def game_loop(people, game_no, frame):  # TODO add trail removal
    games[people][game_no-1]["frame"] = frame
    for player in games[people][game_no-1]["players"]:
        if not games[people][game_no-1]["players"][player]["dead"]:
            speed = games[people][game_no-1]["players"][player]["speed"]
            match games[people][game_no-1]["players"][player]["direction"]:
                case "up":
                    games[people][game_no-1]["players"][player]["cord"][1] -= speed
                case "down":
                    games[people][game_no-1]["players"][player]["cord"][1] += speed
                case "left":
                    games[people][game_no-1]["players"][player]["cord"][0] -= speed
                case "right":
                    games[people][game_no-1]["players"][player]["cord"][0] += speed
            games[people][game_no - 1]["players"][player]["trail"].append(
                games[people][game_no-1]["players"][player]["cord"][:])
    for player in games[people][game_no-1]["players"]:
        for player2 in games[people][game_no-1]["players"]:
            # there is a bug where 1 or 2 pixels are not used in the kill check but it would take precise timing to pass through another's trail
            if check_kill(games[people][game_no-1]["players"][player]["trail"][:-2], games[people][game_no-1]["players"][player2]["trail"][-2:]):
                # del games[people][game_no-1]["players"][player] create a function to kill player
                games[people][game_no-1]["players"][player2]["dead"] = True
                emit("game_update", {"operation": "kill", "user": player2},
                     to=f"{people}_player_game_{str(game_no)}")
                if people == 2:
                    end(people, game_no)
                    return False, frame
                elif people == 4 and sum(1 for player in games[people][game_no-1]["players"].values() if not player["dead"]) == 1:
                    end(people, game_no)
                    return False, frame
                else:
                    pass  # TODO check if game end for larger groops/lobbies

    emit("game_update", {"operation": "update", "data": games[people][game_no-1]["players"]},
         to=f"{people}_player_game_{str(game_no)}")
    # TODO add score
    clock.tick(100)
    if frame % 100 == 0:
        for player in games[people][game_no-1]["players"]:
            games[people][game_no-1]["players"][player]["trail"] = shorten_trail(
                games[people][game_no-1]["players"][player]["trail"])
    return True, frame+1


# server logic

def determine_direction(coord, width, height):
    """
    Determine the initial direction based on the starting coordinates.

    :param coord: Tuple representing the coordinates (x, y)
    :param width: Width of the play area
    :param height: Height of the play area
    :return: String representing the direction ("up", "down", "left", "right")
    """
    x, y = coord
    if x <= 20:
        return "right"
    elif x >= width - 20:
        return "left"
    elif y <= 20:
        return "down"
    else:
        return "up"


def generate_coordinates(players):
    # Define play area dimensions
    width, height = 1500, 800

    # Initialize list to store coordinates and directions
    coordinates_and_directions = []

    # Define positions for 2 players
    if players == 2:
        coords = [[20, height // 2], [width - 20, height // 2]]
        coordinates_and_directions = [
            (coord, determine_direction(coord, width, height)) for coord in coords]

    # Define positions for 3 players
    elif players == 3:
        coords = [[20, height // 2], [width - 20, height // 3],
                  [width - 20, 2 * height // 3]]
        coordinates_and_directions = [
            (coord, determine_direction(coord, width, height)) for coord in coords]

    # Define positions for 4 players
    elif players == 4:
        coords = [[20, height // 3], [20, 2 * height // 3],
                  [width - 20, height // 3], [width - 20, 2 * height // 3]]
        coordinates_and_directions = [
            (coord, determine_direction(coord, width, height)) for coord in coords]

    # Define positions for more than 4 players up to 20
    else:
        coords = []
        for i in range(players):
            if i % 2 == 0:
                x = 20
            else:
                x = width - 20
            y = (i // 2 + 1) * height // (players // 2 + 1)
            coords.append([x, y])
        coordinates_and_directions = [
            (coord, determine_direction(coord, width, height)) for coord in coords]

    return coordinates_and_directions


def matching(players, sid):
    # TODO check if a game is being prepared and can alow for more to join and make sure sid is not the same as other player (refrech page)
    if len(modes[f"{players}_player"]) % players == 0:
        if players == 4 and len(modes["2_player"]) % 2 == 1:
            return 2, ""
        elif players == 2 and len(modes["4_player"]) % 4 == 1 and len(queues["4_player"]) == 1:
            return 2, ""
        else:
            modes[f"{players}_player"].append(sid)
            queues[f"{players}_player"].append(sid)
            return 0, "waiting for players"
    if players == 4 and len(modes["4_player"]) % 4 != 0 and len(queues["4_player"]) == 0:
        modes[f"4_player"].append(sid)
        queues["4_player"].append(sid)
        return 0, "waiting for game to end"
    if players == 2 and len(modes["2_player"]) % 2 > 0:
        modes[f"2_player"].append(sid)
        return 1, ""
    if players == 4 and len(modes["4_player"]) % 4 > 0:
        modes[f"4_player"].append(sid)
        return 1, ""
    else:
        modes[f"{players}_player"].append(sid)
        queues[f"{players}_player"].append(sid)
        return 0, "waiting for players"


def start(people, game_no):  # count down then start game
    for i in range(5):
        emit("starting", {"operation": f"starting {5-i}"},
             to=f"{people}_player_game_{str(game_no)}")
        time.sleep(1)
    emit("start", {"operation": "4"},
         to=f"{people}_player_game_{str(game_no)}")
    time.sleep(1)
    for i in range(3):
        emit("start", {"operation": f"{3-i}"},
             to=f"{people}_player_game_{str(game_no)}")
        time.sleep(1)
    emit("start", {"operation": "0"},
         to=f"{people}_player_game_{str(game_no)}")
    # TODO set starting cordonates
    i = 0
    cords = generate_coordinates(people)
    for player in games[people][game_no-1]["players"]:
        games[people][game_no-1]["players"][player].update(
            {"cord": cords[i][0]})
        games[people][game_no-1]["players"][player].update(
            {"trail": [cords[i][0][:]]})
        games[people][game_no-1]["players"][player].update(
            {"direction": cords[i][1]})
        i += 1

    games[people][game_no-1].update({"state": "running"})
    loop_run(people, game_no, 0)


def loop_run(people, game_no, frame):
    alive = True
    while alive:
        alive, frame = game_loop(people, game_no, frame)


def clear_game(people, game_no):
    time.sleep(180)
    if games[people][game_no-1]["state"] == "end":
        del games[people][game_no-1]
        close_room(f"{people}_player_game_{str(game_no)}")


def end(people, game_no):
    modes[f"{people}_player"].remove(
        request.sid)
    games[people][game_no-1].update({"state": "end"})
    for player in games[people][game_no-1]["players"]:
        clients[player].update({"status": "end"})
    emit("game_update", {"operation": "end"},
         to=f"{people}_player_game_{str(game_no)}")
    clear_game(people, game_no)
    # TODO add score and rematch logic


def admin_update_loop():
    while True:
        if admin["update"]:
            emit("admin_update", {"operation": "update",
                                  "games": games, "clients": clients}, to=admin["id"])
        time.sleep(0.1)


def admin_view_game(game_name):  # from game or folow player
    admin["update"] = False
    join_room(game_name, admin["id"])


def admin_end_game():
    pass  # end game with reason admin


def admin_kill_player():
    pass  # kill player with reason admin

# server end points


@app.route("/")
def main():
    return render_template("index.html")


@socketio.on("connect")
def connected():
    """event listener for when client connects to the server"""
    # print(request.sid)
    print(f"client {request.sid} has connected")
    clients.update({request.sid: {"status": "menu"}})
    # emit("connect", {"data": f"id: {request.sid} is connected"})


@socketio.on('game_update')
def handle_message(data):
    """event listener for when client sends data"""
    match(data["operation"]):  # change to rooms brodcast
        case "direction":
            current_direction = games[int(rooms()[1][0])][int(
                rooms()[1][-1])-1]["players"][request.sid]["direction"]
            new_direction = data["direction"]

            # Check if the new direction is perpendicular to the current direction
            if (current_direction in ["up", "down"] and new_direction in ["left", "right"]) or \
               (current_direction in ["left", "right"] and new_direction in ["up", "down"]):
                games[int(rooms()[1][0])][int(rooms()[1][-1]) -
                                          1]["players"][request.sid]["direction"] = new_direction
            else:
                emit("invalid", {"operation": "invalid direction"})

        case "speed":
            if data["speed"] not in [1, 2]:
                emit("invalid", {"operation": "invalid speed"})
            games[rooms()[1][0]][rooms()[1][-1]]["players"][request.sid].update(
                {"speed": data["speed"]})
        # case "inactive":
        #     emit("game_update", {'data': data,
        #          'id': request.sid}, broadcast=True)
        case _:
            # emit("data", {'data': data, 'id': request.sid}, broadcast=True)
            pass


@socketio.on("play")
def play(data):
    print(data)
    hashed_username = [hashlib.sha256(
        word.encode()).hexdigest() for word in data["username"].split()]
    if any(word in badwords for word in hashed_username):
        emit("error", {"operation": "inappropriate username"})
        return
    clients[request.sid].update({"username": data["username"]})
    match data["mode"]:
        case "2_player":
            clients[request.sid].update({"status": "play_que", "mode": 2})
            # modes["2_player"].append(request.sid)
            emit("starting", {"operation": "matching"})
            action, other = matching(2, request.sid)
            match action:
                case 0:  # waiting
                    emit("starting", {"operation": other})
                case 1:
                    game_no = len(games[2])+1
                    join_room(f"2_player_game_{str(game_no)}")
                    join_room(f"2_player_game_{str(game_no)}",
                              queues["2_player"][0])
                    games[2].append({"players": {}, "settings": {
                    }, "state": "creating", "room": f"2_player_game_{str(game_no)}", "frame": 0})
                    # more for the player atributes in the game data?
                    games[2][game_no-1]["players"].update(
                        {queues["2_player"][0]: {"cord": [], "trail": [], "speed": 1, "direction": "right", "username": clients[queues["2_player"][0]]["username"], "dead": False}})
                    games[2][game_no-1]["players"].update(
                        {request.sid: {"cord": [], "trail": [], "speed": 1, "direction": "right", "username": data["username"], "dead": False}})
                    queues["2_player"].pop(0)
                    for id in games[2][game_no-1]["players"]:
                        clients[id].update({"status": "preparing_game"})
                    emit("starting", {
                        "operation": "preparing game"}, to=f"2_player_game_{str(game_no)}")
                    start(2, game_no)
                case 2:  # match with 4 player
                    game_no = len(games[2])+1
                    join_room(f"2_player_game_{str(game_no)}")
                    join_room(f"2_player_game_{str(game_no)}",
                              queues["4_player"][0])
                    games[2].append({"players": {}, "settings": {
                    }, "state": "creating", "room": f"2_player_game_{str(game_no)}", "frame": 0})
                    # more for the player atributes in the game data?
                    games[2][game_no-1]["players"].update(
                        {queues["4_player"][0]: {"cord": [], "trail": [], "speed": 1, "direction": "right", "username": clients[queues["4_player"][0]]["username"], "dead": False}})
                    games[2][game_no-1]["players"].update(
                        {request.sid: {"cord": [], "trail": [], "speed": 1, "direction": "right", "username": data["username"], "dead": False}})
                    queues["4_player"].pop(0)
                    for id in games[2][game_no-1]["players"]:
                        clients[id].update({"status": "preparing_game"})
                    emit("starting", {
                        "operation": "preparing game"}, to=f"2_player_game_{str(game_no)}")
                    start(2, game_no)
        case "4_player":
            clients[request.sid].update({"status": "play_que", "mode": 4})
            # modes["4_player"].append(request.sid)
            emit("starting", {"operation": "matching "})
            action, other = matching(4, request.sid)
            match action:
                case 0:  # waiting
                    emit("starting", {"operation": other})
                case 1:
                    game_no = len(games[4])+1
                    join_room(f"4_player_game_{str(game_no)}")
                    for id in queues["4_player"][:2]:
                        join_room(f"4_player_game_{str(game_no)}",
                                  id)
                    games[4].append({"players": {}, "settings": {
                    }, "state": "creating", "room": f"4_player_game_{str(game_no)}", "frame": 0})
                    for id in queues["4_player"][:2]:
                        # more for the player atributes in the game data?
                        games[4][game_no-1]["players"].update(
                            {id: {"cord": [], "trail": [], "speed": 1, "direction": "right", "username": clients[id]["username"], "dead": False}})
                    games[4][game_no-1]["players"].update(
                        {request.sid: {"cord": [], "trail": [], "speed": 1, "direction": "right", "username": data["username"], "dead": False}})

                    for _ in queues["4_player"][:2]:
                        queues["4_player"].pop(0)
                    for id in games[4][game_no-1]["players"]:
                        clients[id].update({"status": "preparing_game"})
                    emit("starting", {"operation": "preparing game"},
                         to=f"4_player_game_{str(game_no)}")
                    start(4, game_no)
                case 2:  # match with 2 player
                    game_no = len(games[2])+1
                    join_room(f"2_player_game_{str(game_no)}")
                    join_room(f"2_player_game_{str(game_no)}",
                              queues["2_player"][0])
                    games[2].append({"players": {}, "settings": {
                    }, "state": "creating", "room": f"2_player_game_{str(game_no)}", "frame": 0})
                    # more for the player atributes in the game data?
                    games[2][game_no-1]["players"].update(
                        {queues["2_player"][0]: {"cord": [], "trail": [], "speed": 1, "direction": "right", "username": clients[queues["2_player"][0]]["username"], "dead": False}})
                    games[2][game_no-1]["players"].update(
                        {request.sid: {"cord": [], "trail": [], "speed": 1, "direction": "right", "username": data["username"], "dead": False}})
                    queues["2_player"].pop(0)
                    for id in games[2][game_no-1]["players"]:
                        clients[id].update({"status": "preparing_game"})
                    emit("starting", {
                        "operation": "preparing game"}, to=f"2_player_game_{str(game_no)}")
                    start(2, game_no)

        case "create_lobby":
            pass
        case "join_lobby":
            pass
        case _:
            pass

    # emit("play", {"data": data, "id": request.sid}, broadcast=True)#


@socketio.on("admin")
def admin(data):
    match data["operation"]:
        case "login":
            pass
        case "view_game":
            # add admin to room
            pass
        case "end_game":
            # end game with reason admin
            pass
        case "kill_player":
            # kill player with reason admin
            pass


@socketio.on("disconnect")
def disconnected():
    """event listener for when client disconnects to the server"""
    del clients[request.sid]
    for mode in modes:
        if request.sid in modes[mode]:
            modes[mode].remove(request.sid)
    for queue in queues:
        if request.sid in queues[queue]:
            queues[queue].remove(request.sid)
    for players in games:
        for g in games[players]["players"]:
            if request.sid in games[players][g]["players"].keys():
                # send player disconect request
                del games[players][g]["players"][request.sid]
    print("user disconnected")
    emit("disconnect", f"user {request.sid} disconnected", broadcast=True)


def recived():
    pass


if __name__ == '__main__':
    with open("badwords.json", "r") as f:
        badwords = json.load(f)
    # context = ('cert.pem', 'key.pem')
    # ,ssl_context=context)
    socketio.run(app, host="0.0.0.0", port=80, debug=True)
