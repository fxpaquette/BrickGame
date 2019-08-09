let canva = document.getElementById("myCanvas");
let ctx = canva.getContext("2d");
document.onkeydown = keyDowned;
document.onkeyup = keyReleased;


//Initialise global values
ctx.strokeWidth=5;
let inertie = 1; //Between 0 and 1, over time ball will stop moving with a value 0<inertie<1, if inertie = 1, there is no effect over time

let effectiveW = window.innerWidth;
let effectiveH = window.innerHeight;
canva.width = effectiveW;
canva.height = effectiveH;

let spacing = 0.01 //Spacing between bricks
let brickWidth = effectiveW*0.07
let brickHeight = effectiveH*0.07
let nBricksW = 8;
let nBricksH = 4;
let xOffset = (effectiveW - (nBricksW*brickWidth + (spacing*effectiveW)*(nBricksW-1)))/2;
let yOffset = (effectiveH - (nBricksH*brickHeight + (spacing*effectiveH)*(nBricksH-1)))/5;

let ballStartX= effectiveW*0.5
let ballStartY= effectiveH*0.90
let ballRadius = brickWidth/4;

let barSpeed = 10;

/*Function to generate random color*/
function randomColor(){
    let r = Math.round(Math.random()*255);
    let g = Math.round(Math.random()*255);
    let b = Math.round(Math.random()*255);
    let a = 1;
    let color = "rgba("+r+","+g+","+b+","+a+")";
    return color;
}

/*Class representing balls*/
class Ball{
    constructor(){
        this.color = randomColor();
        this.radius = ballRadius;
        this.x= ballStartX;
        this.y= ballStartY*0.90;
        this.dx=0;
        this.dy=6;
    }
    update(){
        ctx.beginPath();
        ctx.arc(this.x,this.y,this.radius,0,2*Math.PI);
        ctx.fillStyle = this.color;
        ctx.fill();
    }
}

/*Class representing bricks*/
class Brick{
    constructor(x,y){
        this.color = randomColor();
        this.width = brickWidth;
        this.height = brickHeight;
        this.x = x;
        this.y = y;
    }
    update(){
        ctx.beginPath();
        ctx.rect(this.x,this.y,this.width,this.height);
        ctx.fillStyle = this.color;
        ctx.fill();
    }
}

/*Class representing the bar*/
class Bar{
    constructor(){
        this.color = randomColor();
        this.width = brickWidth*2;
        this.height = brickHeight*0.5;
        this.x = ballStartX-this.width/2;
        this.y = ballStartY+ballRadius;
        this.dx=0;
        this.dy=0;
    }
    update(){
        ctx.beginPath();
        ctx.rect(this.x,this.y,this.width,this.height);
        ctx.fillStyle = this.color;
        ctx.fill();
    }
}


//Initialize game elements
function initialize(){
    myBall = new Ball();
    myBar = new Bar();
    vecBricks = [];
    for(let i=0;i<nBricksW;i++){
        let pos_x = xOffset + i*(brickWidth+(spacing*effectiveW));
        for(let j = 0;j<nBricksH;j++){
            let pos_y = yOffset + j*(brickHeight+(spacing*effectiveH))
            vecBricks.push(new Brick(pos_x,pos_y));
        }
    }    
}

gameOver = true;

/*Main animation function */
function draw(){
    if (effectiveW != window.innerWidth || effectiveH != innerHeight){ //Update size of canvas if window was resized
        effectiveW = window.innerWidth;
        effectiveH = window.innerHeight;
        canva.width = effectiveW;
        canva.height = effectiveH;
    }
    if(gameOver){
        initialize();
        gameOver = false;
    }

    window.requestAnimationFrame(draw); //Execute draw before refresh
    
    //---Update frame start---
    ctx.clearRect(0,0,effectiveW,effectiveH);
    for (let brick of vecBricks){
        brick.update();
    }
    myBar.update();
    myBall.update();
    
    ctx.beginPath();
    ctx.rect(5,5,effectiveW-10,effectiveH-10);
    ctx.strokeStyle = "black";
    ctx.stroke();
    //---Update frame end---
    

    //Update positions ball
    myBall.x+=myBall.dx;
    myBall.y+=myBall.dy

    //Update positions bar
    myBar.x = Math.max(0,Math.min(myBar.x+myBar.dx,effectiveW-myBar.width));
    myBar.y+=myBar.dy
    
    //---Compute collisions with 4 sides start---
    //If myBall touches side reverse direction
    if ((myBall.x - myBall.radius <= 0)){
        myBall.dx = -myBall.dx;
        myBall.x = myBall.radius;
    }else if ((myBall.x+myBall.radius>= effectiveW)){
        myBall.dx = -myBall.dx;
        myBall.x  = effectiveW - myBall.radius;
    }
    //If myBall touches top or bottom reverse direction
    if ((myBall.y - myBall.radius <= 0)){
        myBall.dy = -myBall.dy*inertie;
        myBall.y = myBall.radius;
    }else if ((myBall.y+myBall.radius>= effectiveH)){ //Touches bottom, game over!
        myBall.dy = 0
        myBall.y = effectiveH - myBall.radius;
        gameOver = true;
        //alert("Game over");
    }
    //---Compute collisions with 4 sides end---

    //---Compute collsion with bar start---
    if ((myBall.y+myBall.radius>=myBar.y) && (myBall.x>=myBar.x) && (myBall.x<=myBar.x+myBar.width)){
        myBall.dy = -myBall.dy*inertie;
        let orientation = myBall.x - (myBar.x+(myBar.width)/2)
        myBall.dx = 0.5*(myBall.dx + 0.1*orientation); 
        //console.log(myBall.dx);
        myBall.y = myBar.y - myBall.radius;
    }  

    //---Compute collsion with bar end---


    //---Compute collisions with bricks start---
    let to_remove = [];
    let ball_right = myBall.x+myBall.radius;
    let ball_left = myBall.x-myBall.radius;
    let ball_up = myBall.y-myBall.radius;
    let ball_down = myBall.y+myBall.radius; 
    for(let i = 0;i<vecBricks.length;i++){
        let brick = vecBricks[i];
        let x1 = brick.x; //Left upper corner of brick
        let y1 = brick.y; //     ""
        let x2 = x1+brick.width; //Right lower corner of brick
        let y2 = y1+brick.height; //       ""
        //Hit bottom of brick
        if (ball_up>=y1 && ball_up<=y2 && myBall.x>=x1 && myBall.x<=x2){
            let audio = new Audio('../bin/sounds/97792__cgeffex__metal-impact.wav');
            audio.playbackRate = 3;
            audio.play();
            myBall.dy = -myBall.dy;
            myBall.y = y2+myBall.radius;
            to_remove.push(i);
            break;
        }
        //Hit top of brick
        else if(ball_down>=y1 && ball_down<=y2 && myBall.x>=x1 && myBall.x<=x2){
            let audio = new Audio('../bin/sounds/97792__cgeffex__metal-impact.wav');
            audio.playbackRate = 3;
            audio.play();
            myBall.dy = -myBall.dy;
            myBall.y = y1-myBall.radius;
            to_remove.push(i);
            break;
        }
        //Hit left of brick
        else if(myBall.y>=y1 && myBall.y<=y2 && ball_right>=x1 && ball_right<=x2){
            let audio = new Audio('../bin/sounds/97792__cgeffex__metal-impact.wav');
            audio.playbackRate = 3;
            audio.play();
            myBall.dx = -myBall.dx;
            myBall.x = x1-myBall.radius;
            to_remove.push(i);
            break;
        }
        //Hit right of brick
        else if(myBall.y>=y1 && myBall.y<=y2 && ball_left>=x1 && ball_left<=x2){
            let audio = new Audio('../bin/sounds/97792__cgeffex__metal-impact.wav');
            audio.playbackRate = 3;
            audio.play();
            myBall.dx = -myBall.dx;
            myBall.x = x2+myBall.radius;
            to_remove.push(i);
            break;
        }
    }
    for(let indice of to_remove){
        vecBricks.splice(indice,1);
    }
    //---Compute collisions with bricks end---



    /*//Collision tests
    console.log("tests")
    for (let i = 0;i<vecBalls.length;i++){
            if (i != j){
                let xDist = A.x - B.x;
                let yDist = A.y - B.y;
                let distSquare = xDist**2 + yDist**2;
                //Use distance square to avoid calculating sqrt
                if(distSquare <= (B.radius + A.radius)**2){

                    let xVelocity = B.dx - A.dx;
                    let yVelocity = B.dy - A.dy;
                    let dotProduct = xDist*xVelocity + yDist*yVelocity;

                    //If they are moving towards one another
                    if(dotProduct > 0){
                        let collisionScale = dotProduct / distSquare;
                        let xCollision = xDist * collisionScale;
                        let yCollision = yDist * collisionScale;

                        //The Collision vector is the speed difference projected on the Dist vector,
                        //thus it is the component of the speed difference needed for the collision.

                        let combinedMass = A.radius + B.radius;
                        let collisionWeightA = 2 * B.radius / combinedMass;
                        let collisionWeightB = 2 * A.radius / combinedMass;

                        A.dx += collisionWeightA * xCollision;
                        A.dy += collisionWeightA * yCollision;
                        B.dx -= collisionWeightB * xCollision;
                        B.dy -= collisionWeightB * yCollision;
                        let audio = new Audio('../bin/sounds/97792__cgeffex__metal-impact.wav');
                        audio.playbackRate = 3;
                        audio.play();
                    }
                }
            }
        }
    }*/
}

//---Game controls start---

function keyDowned(event) {
    const key = event.key;
    if (key == 'ArrowLeft'){
        myBar.dx = -barSpeed;
    }
    else if (key == 'ArrowRight'){
        myBar.dx = barSpeed;
    }
}

function keyReleased(event) {
    const key = event.key;
    if (key == 'ArrowLeft' || key=='ArrowRight'){
        myBar.dx = 0;
        console.log("gfgfjdjj")
    }
}

//---Game controls end---

draw();