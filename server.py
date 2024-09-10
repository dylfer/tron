from flask import Flask, request, jsonify, render_template
# join_room, leave_room, close_room, rooms, disconnect
from flask_socketio import SocketIO, emit, join_room, leave_room, close_room, rooms
from flask_cors import CORS
import json
import os
# use time to ajust the game clock for error in time

app = Flask(__name__,
            static_folder="web/static",
            template_folder="web/templates",
            static_url_path="")
app.config['SECRET_KEY'] = 'secret!'
CORS(app, resources={r"/*": {"origins": "*"}})
socketio = SocketIO(app, cors_allowed_origins="*")

clients = {}
games = {2: [], 4: []}  # active games and players
# game modes just to keep pleayer count
modes = {"2_player": [], "4_player": []}
queues = {"2_player": [], "4_player": []}
lobbies = {}  # lobbies, rooms, players and settings


# game logic
def chek_kill(coords, line):
    """
    Check if the specified line crosses any of the lines formed by the list of coordinates.

    :param coords: List of tuples representing coordinates [(x1, y1), (x2, y2), ...]
    :param line: Tuple representing the line to check against ((x1, y1), (x2, y2))
    :return: True if the line crosses any of the lines formed by the coordinates, False otherwise
    """
    def is_between(a, b, c):
        """Check if point c is between point a and b"""
        return min(a, b) <= c <= max(a, b)

    def lines_intersect(line1, line2):
        """Check if two lines intersect"""
        (x1, y1), (x2, y2) = line1
        (x3, y3), (x4, y4) = line2

        if x1 == x2:  # line1 is vertical
            if x3 == x4:  # line2 is also vertical
                return x1 == x3 and (is_between(y1, y2, y3) or is_between(y1, y2, y4))
            else:  # line2 is horizontal
                return is_between(y3, y4, y1) and is_between(x1, x2, x3)
        else:  # line1 is horizontal
            if x3 == x4:  # line2 is vertical
                return is_between(x1, x2, x3) and is_between(y1, y2, y3)
            else:  # line2 is also horizontal
                return y1 == y3 and (is_between(x1, x2, x3) or is_between(x1, x2, x4))

    for i in range(len(coords) - 1):
        if lines_intersect(line, (coords[i], coords[i + 1])):
            return True
    return False


# server logic


def matching(players, sid):
    # TODO check if a game is being prepared and can alow for more to join
    if len(modes[f"{players}_player"]) % players == 0:
        # print("Matched")
        # print(modes[f"{players}_player"])
        # for player in modes[f"{players}_player"]:
        #     clients[player].update({"status": "play"})
        #     emit("matched", {"players": modes[f"{players}_player"]}, room=player)
        # modes[f"{players}_player"] = []
        if players == 4 and len(modes["2_player"]) % 2 == 1:
            pass  # match with 2 player because no 4 player users
        elif players == 2 and len(modes["4_player"]) % 4 == 1 and len(queues["4_player"]) == 1:
            pass  # match with user in 4 player queue
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


def start(peope, game_no):
    pass  # count down then start game


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
    match(json.loads(data)["opration"]):  # change to rooms brodcast
        case "direction":
            emit("game_update", {'data': data,
                 'id': request.sid}, broadcast=True)
        case "inactive":
            emit("game_update", {'data': data,
                 'id': request.sid}, broadcast=True)
        case _:
            # emit("data", {'data': data, 'id': request.sid}, broadcast=True)
            pass


@socketio.on("play")
def play(data):
    print(data)
    match data["mode"]:
        case "2_player":
            clients[request.sid].update({"status": "play_que", "mode": 2})
            # modes["2_player"].append(request.sid)
            emit("starting", {"opration": "matching "})
            action, other = matching(2, request.sid)
            match action:
                case 0:
                    emit("starting", {"opration": other})
                case 1:
                    game_no = len(games[2])+1
                    join_room(f"2_player_game_{str(game_no)}")
                    join_room(f"2_player_game_{str(game_no)}",
                              queues["2_player"][0])
                    games[2].append({"players": {}, "settings": {
                    }, "state": "creating", "roon": f"2_player_game_{str(game_no)}"})
                    # more for the player atributes in the game data?
                    games[2][game_no-1]["players"].update(
                        {queues["2_player"][0]: {"cords": [], "trail": [], "score": 0}})
                    games[2][game_no-1]["players"].update(
                        {request.sid: {"cords": [], "trail": [], "score": 0}})
                    queues["2_player"].pop(0)
                    for id in games[2][game_no-1]["players"]:
                        clients[id].update({"status": "preparing_game"})
                    emit("starting", {
                        "opration": "preparing game"}, to=f"2_player_game_{str(game_no)}")
                    print(rooms())
                    start(2, game_no)
        case "4_player":
            clients[request.sid].update({"status": "play_que", "mode": 4})
            # modes["4_player"].append(request.sid)
            emit("starting", {"opration": "matching "})
            action, other = matching(4, request.sid)
            match action:
                case 0:
                    emit("starting", {"opration": other})
                case 1:
                    game_no = len(games[4])+1
                    join_room(f"4_player_game_{str(game_no)}")
                    for id in queues["4_player"][:2]:
                        join_room(f"4_player_game_{str(game_no)}",
                                  id)

                    games[4].append({"players": {}, "settings": {
                    }, "state": "creating", "roon": f"4_player_game_{str(game_no)}"})
                    for id in queues["4_player"][:2]:
                        # more for the player atributes in the game data?
                        games[4][game_no-1]["players"].update(
                            {id: {"cords": [], "trail": [], "score": 0}})
                    games[4][game_no-1]["players"].update(
                        {request.sid: {"cords": [], "trail": [], "score": 0}})

                    for _ in queues["4_player"][:2]:
                        queues["4_player"].pop(0)
                    for id in games[4][game_no-1]["players"]:
                        clients[id].update({"status": "preparing_game"})
                    emit("starting", {"opration": "preparing game"},
                         to=f"4_player_game_{str(game_no)}")
                    start(4, game_no)

        case "create_lobby":
            pass
        case "join_lobby":
            pass
        case _:
            pass

    # emit("play", {"data": data, "id": request.sid}, broadcast=True)


@socketio.on("disconnect")
def disconnected():
    """event listener for when client disconnects to the server"""
    print("user disconnected")
    emit("disconnect", f"user {request.sid} disconnected", broadcast=True)


def recived():
    pass


if __name__ == '__main__':
    socketio.run(app, debug=True, port=80)
