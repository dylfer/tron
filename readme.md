# Tron
this is the game tron light cycles with multyplayer 


## Run
install requirements
```pip install -r requirements.txt```
run server.py using python
```python3 server.py```

## deployment - build
update the version
docker build -t game_tron:v1.1 .
to upload to portainer 
docker save -o game_tron_v1.tar game_tron:v1.1
or to run
docker run -d -p 80:80 game_tron:v1.1

## env
### required
- ADMIN_USERNAME - admin user name
- ADMIN_PASSWORD - admin passowrd hash
- SECRET_KEY - for the server
### optional
- PORT - 80


## TODO
 - [x] add licence 
 - [ ] images - leagal ??
 - [ ] ## setup production server ##

python
- [ ] check if a game is being prepared and can alow for more to join (4 player)
- [ ] make sure sid is not the same as other player (refrech page)
- [x] fix player line collision
- [ ] fix bike icon collision
- [x] fix disconnect sid errors
- [ ] fix game que sid errors 
- [ ] fix game matching errors
- [x] add the game loop
- [x] add death
- [ ] add stats
- [x] add game end
- [ ] add lobbies 
- [ ] add outer wall checks 
- [ ] leaderboard
- [ ] fix speed action
- [ ] save games?
- [ ] replay games?
- [ ] accounts?
- [x] add admin dashboard 
- [x] add usernames
- [ ] add 10 second wait after 2+payers join 4 player que so 4 can join  
- [ ] fix game number removal index list to dict change itration 
- [ ] fix any player disconect other players freeze game and conect in console but never disconect?? just local testing or system problem 
- [ ] remove uneasy data from admin view update like trails
- [ ] clean up

javascript
- [ ] alert overlay (use sweetalert2)
- [ ] finish server coms routing for game loop 
- [x] add death
- [x] explosion on death
- [ ] add stats
- [x] add game end 
- [ ] add  flipped view 
- [x] add bike rotation
- [ ] fix trails. are trails broken???
- [ ] fix bike image direction
- [ ] leaderboard
- [ ] single player
- [ ] local 2 player
- [ ] replay games?
- [ ] accounts?
- [ ] fix incorrect first direction action (conditional)
- [x] admin page and logic 
- [x] add usernames
- [ ] add countdown to start in matching for 4 player 
- [ ] add tips on loading
- [ ] fix any player disconect other players freeze game and conect in console but never disconect?? just local testing or system problem 
- [ ] local multi player 
- [ ] ai 1 player
- [ ] lobby
- [ ] clean up 

Admin
 - [x] login
 - [x] view games and data 
 - [x] view conected clients
 - [x] live view game and leave button
 - [ ] kill players and end games
 - [ ] complete view games features
 - [ ] send messages to games or players
 - [ ] fix admin details display update (frame)
 - [ ] clean up
 - [ ] on build no admin setup 

NOTE: this has only been used for personal use. i dont own the images used in this project, use them at your own risk, thy are not part of this license suplied with this project