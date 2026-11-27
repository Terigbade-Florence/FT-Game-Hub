import { $, store } from "../core.js";
import { sfx } from "../sfx.js";
import { confetti } from "../fx.js";

export const ttt0 = { w: 0, d: 0, l: 0 };

const LINES=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
const ttt={b:Array(9).fill(null),over:false,hard:store.get("hard",true),
  winner(b=this.b){for(const l of LINES){const[a,c,d]=l;if(b[a]&&b[a]===b[c]&&b[a]===b[d])return{p:b[a],l}}return null},
  score(b,turn){const w=this.winner(b);if(w)return w.p==="O"?1:-1;if(b.every(Boolean))return 0;
    let best=turn==="O"?-2:2;
    for(let i=0;i<9;i++)if(!b[i]){b[i]=turn;const s=this.score(b,turn==="O"?"X":"O");b[i]=null;best=turn==="O"?Math.max(best,s):Math.min(best,s)}
    return best},
  cpu(){const free=this.b.map((v,i)=>v?null:i).filter(i=>i!==null);
    if(!this.hard)return free[Math.floor(Math.random()*free.length)];
    let bestI=free[0],bestS=-2;
    for(const i of free){this.b[i]="O";const s=this.score(this.b,"X");this.b[i]=null;if(s>bestS){bestS=s;bestI=i}}
    return bestI},
  start(){this.b=Array(9).fill(null);this.over=false;this.render();this.say("Your move. You are X.")},
  say(t){$("#t-status").textContent=t},
  render(){
    const w=this.winner();
    $("#t-board").innerHTML=this.b.map((v,i)=>`<button class="${v||""} ${w&&w.l.includes(i)?"win":""}" data-i="${i}" aria-label="Square ${i+1} ${v||"empty"}">${v||""}</button>`).join("");
    const t=store.get("ttt",ttt0);$("#t-w").textContent=t.w;$("#t-d").textContent=t.d;$("#t-l").textContent=t.l;
    $("#d-easy").classList.toggle("on",!this.hard);$("#d-hard").classList.toggle("on",this.hard)},
  end(){const w=this.winner(),t=store.get("ttt",ttt0);
    if(w||this.b.every(Boolean)){this.over=true;
      if(!w){t.d++;sfx.play("draw");this.say("It’s a draw.")}else if(w.p==="X"){t.w++;sfx.play("win");confetti();this.say("You win!")}else{t.l++;sfx.play("lose");this.say("Computer wins. Try again.")}
      store.set("ttt",t);return true}return false},
  play(i){if(this.over||this.b[i])return;
    this.b[i]="X";sfx.play("tap");if(!this.end()){this.b[this.cpu()]="O";sfx.play("o");if(!this.end())this.say("Your move.")}
    this.render()}
};
$("#t-board").onclick=e=>{const b=e.target.closest("button");if(b)ttt.play(+b.dataset.i)};
$("#t-new").onclick=()=>ttt.start();
$("#d-easy").onclick=()=>{ttt.hard=false;store.set("hard",false);ttt.start()};
$("#d-hard").onclick=()=>{ttt.hard=true;store.set("hard",true);ttt.start()};


export { ttt };
