import { $, store, state } from "../core.js";
import { sfx } from "../sfx.js";
import { confetti } from "../fx.js";
import { submitScore } from "../api.js";
const N=18,cv=$("#s-canvas"),ctx=cv.getContext("2d"),CS=cv.width/N;
const snake={body:[],dir:"R",next:"R",food:null,score:0,timer:null,state:"idle",
  start(){this.body=[{x:5,y:9},{x:4,y:9},{x:3,y:9}];this.dir=this.next="R";this.score=0;this.placeFood();
    this.state="ready";clearInterval(this.timer);this.timer=null;this.hud();this.draw();
    $("#s-status").textContent="Press an arrow key, swipe, or tap a button to start."},
  hud(){$("#s-score").textContent=this.score;$("#s-best").textContent=store.get("snakeBest",0)},
  placeFood(){let p;do{p={x:Math.floor(Math.random()*N),y:Math.floor(Math.random()*N)}}while(this.body.some(s=>s.x===p.x&&s.y===p.y));this.food=p},
  turn(d){const opp={U:"D",D:"U",L:"R",R:"L"};
    if(d===opp[this.dir]&&this.body.length>1)return;
    this.next=d;
    if(this.state==="ready"||this.state==="paused")this.run()},
  run(){this.state="run";$("#s-status").textContent="Go!";clearInterval(this.timer);
    this.timer=setInterval(()=>this.tick(),Math.max(60,140-this.score*3))},
  stop(){clearInterval(this.timer);this.timer=null;if(this.state==="run")this.state="paused"},
  tick(){this.dir=this.next;const h={...this.body[0]};
    if(this.dir==="U")h.y--;if(this.dir==="D")h.y++;if(this.dir==="L")h.x--;if(this.dir==="R")h.x++;
    const hit=h.x<0||h.y<0||h.x>=N||h.y>=N||this.body.some(s=>s.x===h.x&&s.y===h.y);
    if(hit)return this.over();
    this.body.unshift(h);
    if(h.x===this.food.x&&h.y===this.food.y){this.score++;sfx.play("eat");this.placeFood();this.hud();this.run()}else this.body.pop();
    this.draw()},
  over(){clearInterval(this.timer);this.timer=null;this.state="over";sfx.play("lose");
    const best=store.get("snakeBest",0);let msg=`Game over. You scored ${this.score}.`;
    if(this.score>best){store.set("snakeBest",this.score);msg+=" New best!";confetti()}if(this.score>0)submitScore("snake",this.score);
    $("#s-status").textContent=msg+" Press Restart to play again.";this.hud();this.draw()},
  draw(){const cs=getComputedStyle(document.documentElement);
    ctx.fillStyle=cs.getPropertyValue("--cell");ctx.fillRect(0,0,cv.width,cv.height);
    ctx.fillStyle=cs.getPropertyValue("--pink");
    ctx.beginPath();ctx.roundRect(this.food.x*CS+3,this.food.y*CS+3,CS-6,CS-6,6);ctx.fill();
    this.body.forEach((s,i)=>{ctx.fillStyle=i?cs.getPropertyValue("--blue"):cs.getPropertyValue("--orange");
      ctx.beginPath();ctx.roundRect(s.x*CS+1,s.y*CS+1,CS-2,CS-2,5);ctx.fill()})}
};
$("#s-new").onclick=()=>snake.start();
document.querySelector(".pad").onclick=e=>{const b=e.target.closest("button");if(b&&snake.state!=="over")snake.turn(b.dataset.d)};
const KEYS={ArrowUp:"U",w:"U",ArrowDown:"D",s:"D",ArrowLeft:"L",a:"L",ArrowRight:"R",d:"R"};
addEventListener("keydown",e=>{
  if(state.current!=="snake")return;
  if(e.key===" "){e.preventDefault();if(snake.state==="run")snake.stop(),$("#s-status").textContent="Paused. Press an arrow key to resume.";return}
  const d=KEYS[e.key];if(d){e.preventDefault();if(snake.state!=="over")snake.turn(d)}});
let sx,sy;
cv.addEventListener("touchstart",e=>{sx=e.touches[0].clientX;sy=e.touches[0].clientY},{passive:true});
cv.addEventListener("touchend",e=>{const dx=e.changedTouches[0].clientX-sx,dy=e.changedTouches[0].clientY-sy;
  if(Math.max(Math.abs(dx),Math.abs(dy))<24||snake.state==="over")return;
  snake.turn(Math.abs(dx)>Math.abs(dy)?(dx>0?"R":"L"):(dy>0?"D":"U"))});


export { snake };
