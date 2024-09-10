from flask import Flask, request, jsonify, render_template
# join_room, leave_room, close_room, rooms, disconnect
from flask_socketio import SocketIO, emit
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


def matching(players):
    if len(games[f"{players}_player"]) < 2:
        # print("Matched")
        # print(modes[f"{players}_player"])
        # for player in modes[f"{players}_player"]:
        #     clients[player].update({"status": "play"})
        #     emit("matched", {"players": modes[f"{players}_player"]}, room=player)
        # modes[f"{players}_player"] = []
        if players == 4 and len(modes["2_player"]) % 2 == 1:
            pass  # match with 2 player because no 4 player users
        else:
            pass  # emmit waiting for players


# server end points

@app.route("/")
def main():
    return render_template("index.html")


@socketio.on("connect")
def connected():
    """event listener for when client connects to the server"""
    print(request.sid)
    print("client has connected")
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
            print("2 player")
            clients[request.sid].update({"status": "play_que", "mode": 2})
            modes["2_player"].append(request.sid)
            emit("starting", {"opration": "matching "})
            matching(2)

            # elif data["mode"] == "4_player":

            # elif data["mode"] == "create_lobby":
            #     pass
            # elif data["mode"] == "join_lobby":
            #     pass
        case "4_player":
            clients[request.sid].update({"status": "play_que", "mode": 4})
            modes["4_player"].append(request.sid)
            emit("starting", {"opration": "matching "})
            matching(4)

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
