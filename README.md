# Welsyre

  My first attempt at making a multiplayer, browser-based game. I don't code with HTML + CSS often, because im more of a backend development kind of guy, so the aesthetics, I will admit, are complete shite. Also the fact that the only times I touch HTML or CSS is during a school project, should explain why the coding practices isn't up to standard :)
  
  
  This was supposed to just be a small project for me to learn about multiplayer programming using nodejs; Because of that, and the fact that a lot of its early code is made of spaghetti, its currently abandoned. It was a good learning process though, and now just something to show off.



  The way the game itself was coded with a data-driven approach in mind. So it uses an entity-component system(This game was also part of my early forays into programming a proper entity-component system), which once in place, I could easily create components to the space ship with various properties without editing the source does itself, but instead, adding a json object to the database.
  
It Uses:


-NodeJS as the server backend.

-SocketIO to connect the players to the server/ game session + matchmaking.

-Mongodb as the database.

-Passport for authentication

-Canvas for displaying the game.

-... and several others I might have forgotten.


===========================================


Features in place:

-Basic matchmaking

-Account creation + login system

-Database for logins, and sessions

-Database for basic components of the space ship.

(Going to add more information later.)
