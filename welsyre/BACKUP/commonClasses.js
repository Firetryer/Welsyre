// var Entity = function(){
//     var self = {
//         x:250,
//         y:250,
//         spdX:0,
//         spdY:0,
//         id:"",
//     }
//     self.update = function(){
//         self.updatePosition();
//     }
//     self.updatePosition = function(){
//         self.x += self.spdX;
//         self.y += self.spdY;
//     }
//     return self;
// }

// var Player = function(id){
//     var self = Entity();
//     self.id = id;
//     self.pressingRight = false;
//     self.pressingLeft = false;
//     self.pressingUp = false;
//     self.pressingDown = false;
//     self.maxSpd = 10;
   
//     var super_update = self.update;
//     self.update = function(){
//         self.updateSpd();
//         super_update();
//     }
   
//     self.updateSpd = function(){
//         if(self.pressingRight)
//             self.spdX = self.maxSpd;
//         else if(self.pressingLeft)
//             self.spdX = -self.maxSpd;
//         else
//             self.spdX = 0;
       
//         if(self.pressingUp)
//             self.spdY = -self.maxSpd;
//         else if(self.pressingDown)
//             self.spdY = self.maxSpd;
//         else
//             self.spdY = 0;     
//     }
//     Player.list[id] = self;
//     return self;
// }

module.exports = Player;