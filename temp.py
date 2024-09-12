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
    games[people][game_no-1]["players"][player]["cord"])

for player in games[people][game_no-1]["players"]:
    for player2 in games[people][game_no-1]["players"]:
        if player != player2:
            trail1_last_two = games[people][game_no -
                1]["players"][player]["trail"][-2:]
            trail2_last_two = games[people][game_no -
                1]["players"][player2]["trail"][-2:]
            if chek_kill(trail1_last_two, trail2_last_two):
                del games[people][game_no-1]["players"][player]
                emit("game_update", {"opration": "kill", "user": player},
                     to=f"{people}_player_game_{str(game_no)}")
                if people == 2:
                    end(people, game_no)
                elif people == 4 and len(games[people][game_no-1]["players"]) == 1:
                    end(people, game_no)

emit("game_update", {"opration": "update", "data": games[people][game_no-1]["players"]},
     to=f"{people}_player_game_{str(game_no)}")
# TODO add kill and end check an score
end = time.time()
time.sleep(0.01-(end-start))  # ajust for time error
game_loop(people, game_no)


The issue seems to be related to the logic in the chek_kill function call. Specifically, you are passing the entire trail of one player and only the last two elements of the trail of the other player. This might cause unintended behavior if the trails are not being compared correctly.

To ensure that the chek_kill function is comparing the correct segments of the trails, you should pass the last two elements of both players' trails. Here's how you can update the code:

Extract the last two elements of both players' trails.
Pass these segments to the chek_kill function.
Here's the updated code snippet:

In this updated code:

trail1_last_two and trail2_last_two are used to store the last two elements of each player's trail.
These segments are then passed to the chek_kill function to ensure the correct comparison.