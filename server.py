from flask import Flask, request, jsonify, render_template
# join_room, leave_room, close_room, rooms, disconnect
from flask_socketio import SocketIO, emit
import json


app = Flask(__name__,
            static_folder="static",
            template_folder="templates",
            static_url_path="")
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app)


@app.route("/")
def main():
    return render_template("index.html")


@socketio.on("connect")
def connected():
    """event listener for when client connects to the server"""
    print(request.sid)
    print("client has connected")
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


@socketio.on("disconnect")
def disconnected():
    """event listener for when client disconnects to the server"""
    print("user disconnected")
    emit("disconnect", f"user {request.sid} disconnected", broadcast=True)


def recived():
    pass


if __name__ == '__main__':
    socketio.run(app, debug=True, port=5001)
