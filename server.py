from flask import Flask, request, jsonify, render_template
# join_room, leave_room, close_room, rooms, disconnect
from flask_socketio import SocketIO, emit
import json
import os


app = Flask(__name__,
            static_folder="static",
            template_folder="templates",
            static_url_path="")
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app)

clients = {}
games = {2: [], 4: []}  # example of game element


def matching(data):


@app.route("/")
def main():
    return render_template("index.html")


@socketio.on("connect")
def connected():
    """event listener for when client connects to the server"""
    print(request.sid)
    print("client has connected")
    clients.update({request.sid: {"status": "menu"}})
    emit("connect", {"data": f"id: {request.sid} is connected"})


@socketio.on('data')
def handle_message(data):
    """event listener for when client sends data"""
    match(json.loads(data)["opration"]):
        case "direction":
            emit("data", {'data': data, 'id': request.sid}, broadcast=True)
        case "inactive":
            emit("data", {'data': data, 'id': request.sid}, broadcast=True)
        case _:
            emit("data", {'data': data, 'id': request.sid}, broadcast=True)


@socketio.on("play")
def play(data):
    match data["mode"]:
        case "play":
            if data["mode"] == "2_player":
                clients[request.sid].update({"status": "play_que", "mode": 2})
                matching(2)
            elif data["mode"] == "4_player":
                clients[request.sid].update({"status": "play_que", "mode": 4})
                matching(4)
            elif data["mode"] == "create_lobby":
                pass
            elif data["mode"] == "join_lobby":
                pass
        case "":
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
    socketio.run(app, debug=True, port=5001)
