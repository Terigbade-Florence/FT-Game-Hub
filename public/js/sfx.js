import { $, store } from "./core.js";

const sfx={on:store.get("sound",true),ctx:null,
  get(){if(!this.ctx){const A=window.AudioContext||window.webkitAudioContext;if(!A)return null;try{this.ctx=new A()}catch(e){return null}}
    if(this.ctx.state==="suspended")this.ctx.resume();return this.ctx},
  tone(f,d=.1,type="square",v=.05,at=0){if(!this.on)return;try{
    const c=this.get();if(!c)return;
    const o=c.createOscillator(),g=c.createGain(),t=c.currentTime+at;
    o.type=type;o.frequency.setValueAtTime(f,t);
    g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);
    o.connect(g);g.connect(c.destination);o.start(t);o.stop(t+d)}catch(e){}},
  play(n){const s={
    tap:()=>this.tone(520,.07),
    o:()=>this.tone(380,.09),
    flip:()=>this.tone(660,.06,"triangle"),
    match:()=>{this.tone(660,.1,"triangle");this.tone(880,.14,"triangle",.05,.1)},
    miss:()=>this.tone(200,.15,"sawtooth",.04),
    eat:()=>{this.tone(740,.06);this.tone(988,.08,"square",.05,.06)},
    win:()=>[523,659,784,1047].forEach((f,i)=>this.tone(f,.16,"triangle",.06,i*.12)),
    lose:()=>[330,262,196].forEach((f,i)=>this.tone(f,.2,"sawtooth",.05,i*.16)),
    draw:()=>{this.tone(440,.12,"triangle");this.tone(440,.18,"triangle",.05,.14)}};
    if(s[n])s[n]();if(this.on&&navigator.vibrate){const v={eat:12,match:20,win:[30,40,30],lose:60}[n];if(v)navigator.vibrate(v)}},
  sync(){const b=$("#sound");b.textContent=this.on?"Sound: on":"Sound: off";b.setAttribute("aria-pressed",String(this.on));b.classList.toggle("on",this.on)}
};
$("#sound").onclick=()=>{sfx.on=!sfx.on;store.set("sound",sfx.on);sfx.sync();sfx.play("tap")};
["pointerdown","keydown"].forEach(ev=>addEventListener(ev,()=>{if(sfx.on)sfx.get()}));
sfx.sync();


export { sfx };
