import { $, store } from "../core.js";
import { sfx } from "../sfx.js";
import { confetti } from "../fx.js";
import { submitScore } from "../api.js";
const mem={icons:["🚀","🎲","👾","🍕","🎧","🔥","🐙","🌵"],cards:[],open:[],moves:0,pairs:0,lock:false,
  start(){const d=[...this.icons,...this.icons];
    for(let i=d.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[d[i],d[j]]=[d[j],d[i]]}
    this.cards=d.map(v=>({v,s:"down"}));this.open=[];this.moves=0;this.pairs=0;this.lock=false;
    $("#m-status").textContent="Flip two cards to find a pair.";this.render()},
  render(){
    $("#m-board").innerHTML=this.cards.map((c,i)=>`<button class="${c.s==="down"?"":c.s}" data-i="${i}" ${c.s==="ok"?"disabled":""} aria-label="${c.s==="down"?"Hidden card":c.v}">${c.s==="down"?"?":c.v}</button>`).join("");
    $("#m-moves").textContent=this.moves;$("#m-pairs").textContent=this.pairs+"/8";
    const b=store.get("memBest",null);$("#m-best").textContent=b||"–"},
  flip(i){const c=this.cards[i];if(this.lock||c.s!=="down")return;
    c.s="up";this.open.push(i);sfx.play("flip");this.render();
    if(this.open.length<2)return;
    this.moves++;const[a,b]=this.open;
    if(this.cards[a].v===this.cards[b].v){this.cards[a].s=this.cards[b].s="ok";this.pairs++;sfx.play("match");this.open=[];this.render();
      if(this.pairs===8){const best=store.get("memBest",null),rec=!best||this.moves<best;
        sfx.play("win");confetti();submitScore("memory",this.moves);if(rec)store.set("memBest",this.moves);
        $("#m-status").textContent=rec?`Cleared in ${this.moves} moves. New best!`:`Cleared in ${this.moves} moves.`;this.render()}}
    else{this.lock=true;sfx.play("miss");setTimeout(()=>{this.cards[a].s=this.cards[b].s="down";this.open=[];this.lock=false;this.render()},750)}}
};
$("#m-board").onclick=e=>{const b=e.target.closest("button");if(b)mem.flip(+b.dataset.i)};
$("#m-new").onclick=()=>mem.start();


export { mem };
