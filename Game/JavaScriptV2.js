//Constants//
const LINELENGTH = 100 
const FONTSIZE = 20
const BACKGROUNDCOLOR = "#e3e6ed"
const BOULDERSIZE = 25

//Canvas//
var playArea
var ctx

//Game variables//
var boulderSpeed = 240
var score = 0
var mousePosX 
var mousePosY
var health = 5
var spawnSpeed = 5

//Sound//
var music = new Audio("music.mp3")
var explosionSound = new Audio("explosion.mp3")
var milestone = new Audio("milestone.mp3")
var death = new Audio("death.mp3")

//Objects (polygons & circles)
var line 
var boulders = []
var topBorder
var bottomBorder
var leftBorder
var rightBorder

//Game state booleans
var rightArrow = false
var leftArrow = false
var isPause = false
var started = false
var mute

//Timers
var titleAnimationTimer 
var timer

//Animation variables
var titleOpacity = 1


window.onload = function(){
  //Initialise the canvas
  playArea = document.createElement('canvas')
  playArea.width = window.innerWidth
  playArea.height  = window.innerHeight

  //Make the music loop
  music.addEventListener("ended", function(){
    music.currentTime = 0
    music.play()    
  })

  //Initialise borders as polygons to check for collision
  topBorder = new SAT.Polygon(new SAT.Vector(0,0), [
  new SAT.Vector(-LINELENGTH * 1.1, -LINELENGTH * 1.1),
  new SAT.Vector(window.innerWidth + LINELENGTH * 1.1 , -LINELENGTH * 1.1),
  new SAT.Vector(window.innerWidth + LINELENGTH * 1.1, 0),
  new SAT.Vector(-LINELENGTH * 1.1, 0)
 ]);
  bottomBorder = new SAT.Polygon(new SAT.Vector(0,0), [
  new SAT.Vector(-LINELENGTH * 1.1, window.innerHeight),
  new SAT.Vector(window.innerWidth + LINELENGTH * 1.1, window.innerHeight),
  new SAT.Vector(window.innerWidth + LINELENGTH * 1.1, window.innerHeight + LINELENGTH * 1.1),
  new SAT.Vector(-LINELENGTH * 1.1, window.innerHeight + LINELENGTH * 1.1)
 ]);
  leftBorder = new SAT.Polygon(new SAT.Vector(0,0), [
  new SAT.Vector(-LINELENGTH * 1.1, -LINELENGTH * 1.1),
  new SAT.Vector(0, -LINELENGTH * 1.1),
  new SAT.Vector(0, window.innerHeight + LINELENGTH * 1.1),
  new SAT.Vector(-LINELENGTH * 1.1, window.innerHeight + LINELENGTH * 1.1)
 ]);
  rightBorder = new SAT.Polygon(new SAT.Vector(0,0), [
  new SAT.Vector(window.innerWidth , -LINELENGTH * 1.1),
  new SAT.Vector(window.innerWidth + LINELENGTH * 1.1, -LINELENGTH * 1.1),
  new SAT.Vector(window.innerWidth + LINELENGTH * 1.1, window.innerHeight + LINELENGTH * 1.1),
  new SAT.Vector(window.innerWidth, window.innerHeight + LINELENGTH * 1.1)
 ]);

  //Initialise context
  ctx = playArea.getContext("2d")
  ctx.font = `${FONTSIZE}pt Orbitron`
  ctx.fillStyle = BACKGROUNDCOLOR

  //Start the timer to animate the title
  titleAnimationTimer = setInterval(titleAnimate, 50)
}

function titleAnimate(){
  //Gets the text that has to "breathe"
  var title = document.getElementById("flash")

  //Using a sin function to make opacity go up and down to make the text "breathe"
  title.style.opacity = Math.abs(Math.sin(titleOpacity))
  titleOpacity += 0.05
}

function startGame(){
  //Remove Blurr effect if there was one
  ctx.filter = "none"

  //Stops the animation timer if it was running
  clearTimeout(titleAnimationTimer)

  //Reset game variables
  started = true;
  health = 5
  score = 0
  boulders = []

  //Removes any text that was displayed
  document.body.innerHTML = ""

  music.play()
  timer = setInterval(mainLoop, 16)

  //Initialise line
  line = new SAT.Polygon(new SAT.Vector(100,100), [
  new SAT.Vector(0,0),
  new SAT.Vector(LINELENGTH,0),
  ]);
}

function moveLine(){
  line.pos = new SAT.Vector(mousePosX, mousePosY)
  borderCollision()
  redraw()
}

function changeMousePos(e){
  mousePosX = e.clientX //Current X coordinate of the mouse
  mousePosY = e.clientY //Current Y coordinate of the mouse
  if(!isPause && started){
    moveLine()
  } 
}

function borderCollision(){
  //Prepare response to store a response object after checking for collision
  var response = new SAT.Response()

  //Test collision between line and every border
  if(SAT.testPolygonPolygon(line, topBorder, response)){
    correctOverlap(response) //Moves line back onto the canvas
  }
  if(SAT.testPolygonPolygon(line, bottomBorder, response)){
    correctOverlap(response)
  }
  if(SAT.testPolygonPolygon(line, leftBorder, response)){
    correctOverlap(response)
  }
  if(SAT.testPolygonPolygon(line, rightBorder, response)){
    correctOverlap(response)
  }
}

function outOfBounds(circle){
  //Test collision between boulder and every border
  return (circleIsInsidePolygon(circle, bottomBorder)
    || circleIsInsidePolygon(circle, leftBorder)
    || circleIsInsidePolygon(circle, rightBorder))
}

function circleIsInsidePolygon(circle, polygon){
  //Prepare response to store a response object after checking for collision
  var response = new SAT.Response()
  //Check for collision, stores details of the collision in response
  if(SAT.testCirclePolygon(circle, polygon, response)){
    //Checks if the circle is completelly inside the polygon
    //In the case, if the boulder is completely in the border polygon
    //meaning it is completely out of the screen
    if(response.aInB){
      return true;
    }
    return false;
  }
}

function correctOverlap(response){
  //The overlap vector. If this vector is subtracted from the position of a, a and b will no longer be colliding. (Shortest distance)
  //Substracting the overlap vector from the line position vector
  line.pos.sub(response.overlapV)
  //Clear the response so that it is ready to be reused for another collision test.
  response.clear()
}

function moveBoulders(){
  boulders.forEach(function(boulder){
    newPosX = boulder.circle.pos.x + boulder.xMove
    newPosY = boulder.circle.pos.y + boulder.yMove
    boulder.circle.pos = new SAT.Vector(newPosX, newPosY)
    if(outOfBounds(boulder.circle)){
      score ++
      removeBoulder(boulder)
      if(score % 100 == 0){
        health ++
        if(!mute){
          milestone.play()
        }
      }
    }
  })
}

function removeBoulder(boulder){
  boulders.splice(boulders.indexOf(boulder),1)
}

function spawnNewBoulder(){
  //Boulders can spawn from the top or the first quarter of each side
  var rnd_max = window.innerWidth + window.innerHeight / 2
  var rnd = Math.floor(Math.random() * rnd_max) + 1
  var thisBoulderSize = BOULDERSIZE + Math.floor((Math.random() * BOULDERSIZE)) + 1

  //Stores the actual boulder
  var circle

  //X coordinate on the bottom of the screen where the boulder will be moving towards
  var destination

  //Spawn top
  if(rnd <= window.innerWidth){
    circle = new SAT.Circle(new SAT.Vector(rnd, -thisBoulderSize + 1), thisBoulderSize)
    destination = Math.floor(Math.random() * window.innerWidth) + 1
  }
  //Spawn right side
  else if(rnd % 2 == 0){
    circle = new SAT.Circle(new SAT.Vector(window.innerWidth + thisBoulderSize - 1, (rnd - window.innderWidth) / 2), thisBoulderSize)
    destination = Math.floor(Math.random() * window.innerWidth / 6 * 5) + 1
  }
  //Spawn left side
  else{
    circle = new SAT.Circle(new SAT.Vector(-thisBoulderSize + 1, (rnd - window.width) / 2), thisBoulderSize)
    destination = Math.floor(Math.random() * ((window.innerWidth / 6) * 5)) + (window.innerWidth / 6)
  }

  var movement = getMovement({initialX:circle.pos.x,
    initialY:circle.pos.y, 
    finalX:destination, 
    finalY:window.innerHeight, 
    speed:boulderSpeed + Math.floor(Math.random() * boulderSpeed)})

  boulders.push({circle: circle, xMove: movement.x, yMove: movement.y})
}

//Returns by how much something that is at initialX and initialY coords has to 
//move in X and Y to get to finalX and finalY in [speed] ticks
function getMovement(d){
  var xMove = (d.finalX - d.initialX) / d.speed
  var yMove = (d.finalY - d.initialY) / d.speed
  return {x: xMove, y:yMove}
}

function redraw (){
  //Clear the canvas
  ctx.fillRect(0, 0, playArea.width, playArea.height)
  //Draw boulders
  boulders.forEach(function(boulder){
    ctx.beginPath();
    ctx.arc(boulder.circle.pos.x, boulder.circle.pos.y, boulder.circle.r, 0, 2 * Math.PI, false);
    ctx.stroke();
  })
  //Position of the first point in the line
  var p1X = line.pos.x
  var p1Y = line.pos.y
  //Calculated coordinate of the second point in the line
  //after rotation is applied added to the position of the line
  var p2X = line.calcPoints[1].x + line.pos.x
  var p2Y = line.calcPoints[1].y + line.pos.y
  //Draw line
  ctx.beginPath()
  ctx.moveTo(p1X, p1Y)
  ctx.lineTo(p2X, p2Y)
  ctx.stroke()
  drawOverlay()
  document.body.appendChild(playArea)
}

function drawOverlay(){
  //Make text black
  ctx.fillStyle = "black"
  ctx.fillText(`SCORE: ${score}`,10,30)
  for (var i = 0; i < health; i++) {
    //Draw a circle for each life point
    ctx.beginPath();
    ctx.arc(15 + 25 * i, window.innerHeight - 15, 10, 0, 2 * Math.PI, false);
    ctx.fill()
    ctx.stroke();
  }
  //Change the background color back to original
  ctx.fillStyle = BACKGROUNDCOLOR
}

//Test collision between line and boulders
function collisionTest(){
  boulders.forEach(function(boulder){
    if(SAT.testPolygonCircle(line, boulder.circle)){
      removeBoulder(boulder)
      health--
      if(health == 0){
        gameOver()
      }
      else if(!mute){
      explosionSound.currentTime = 0
      explosionSound.play()
      }
    }
  })
}

function gameOver(){
  music.pause()
  //Reset music to begining
  music.currentTime = 0
  if(!mute){
    death.play()
  }
  //Show Game over screen
  blurGame(`GAME OVER </br> SCORE: <span id="instructions" style="font-size:100px;">${score}<div style = "font-size: 55px;" id="flash">Press enter to play again</span></div>`)
  titleAnimationTimer = setInterval(titleAnimate, 50)
  started = false
}

function mainLoop(){
  //random number between 1 and spawnSpeed - 1 for every 300 points
  //max spawn speed at spawnSpeed * 300 points
  var randomTick = Math.floor(Math.random() * (spawnSpeed - Math.floor(score / 300))) + 1
  if(randomTick <= 1){
    spawnNewBoulder()
  }
  rotate()
  moveBoulders()
  collisionTest()
  redraw()
}

//Rotate line as long as arrow is pressed
function rotate(){
  const rotationSpeed = 60
  if(rightArrow && !leftArrow){
    line.setAngle(line.angle + Math.PI / rotationSpeed)
  }
  else if(leftArrow && !rightArrow){
    line.setAngle(line.angle - Math.PI / rotationSpeed)
  }
  moveLine()
}

function pause(){
  isPause = !isPause
  if(isPause){
    music.pause()
    blurGame("PAUSE")
  }
  else{
    music.play()
    document.body.innerHTML = ""
    timer = setInterval(mainLoop, 16)
    ctx.filter = "none"
  }
}

function blurGame(text){
  clearTimeout(timer)
  ctx.filter = 'blur(2px)'
  document.body.innerHTML = `<div id ='pause'>${text}</div>`
  // Redraw the canvas in the current state (show game behind PAUSE)
  moveLine()
}

function keyEvent(e, keyDown){
  var key = e.code
  if(key == "ArrowRight"){
    rightArrow = keyDown //Set to false on key up
  }
  else if(key == "ArrowLeft"){
    leftArrow = keyDown //Set to false on key up
  }
  else if(key == "Enter"){
    if(!started){
      startGame()
    }
  }
  else if(key == "KeyM"){
    if(!keyDown){ //on key up
      mute = !mute
      if(mute){
      music.pause()
      }
      else{
      music.play()
      }
    }
  }
  else if(key == "Escape"){
    if(!keyDown && started){
      pause()
    }
  }
}
