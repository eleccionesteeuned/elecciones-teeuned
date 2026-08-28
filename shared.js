// ═══════════════════════════════════════════════════════════════
//  TEEUNED — FEUNED  |  shared.js  |  v3.0
// ═══════════════════════════════════════════════════════════════
const PALETTE=['#2e5fa3','#7a1f6e','#1a6b3c','#8b1a1a','#8a6e00','#1a5c6b','#5a2e8b','#6b3a1a'];

const DEFAULT_STUDENTS=[
  {carnet:'300123456',name:'María Rodríguez González',email:'mrodriguez@est.uned.cr'},
  {carnet:'301234567',name:'Carlos Méndez Araya',email:'cmendez@est.uned.cr'},
  {carnet:'302345678',name:'Ana Jiménez Vargas',email:'ajimenez@est.uned.cr'},
  {carnet:'303456789',name:'Luis Hernández Mora',email:'lhernandez@est.uned.cr'},
  {carnet:'304567890',name:'Sofía Castro López',email:'scastro@est.uned.cr'},
];
// OFFICIALS (cuentas de personal con contraseña en texto plano) — ELIMINADO.
// El personal (TEEUNED/Fiscalía) ahora se autentica con Firebase Authentication
// (correo real por cuenta, configurado en index.html),
// ver firebase.js (export const auth) y el script módulo en index.html.

function _mkProc(){
  const h=hash8;
  return[
    {id:'p1',title:'Aprobación del Presupuesto FEUNED 2025',
     description:'Votación para aprobar el presupuesto anual de la Federación de Estudiantes de la UNED para el período fiscal 2025.',
     type:'abierta',quorum:50,status:'activa',createdAt:'2024-11-15T10:00:00',candidates:null,
     votes:[
       {id:'v1',voterCarnet:'300123456',voterName:'María Rodríguez González',voterHash:h('300123456'),choice:'a_favor',ts:'2024-11-15T10:15:00'},
       {id:'v2',voterCarnet:'301234567',voterName:'Carlos Méndez Araya',voterHash:h('301234567'),choice:'a_favor',ts:'2024-11-15T10:20:00'},
       {id:'v3',voterCarnet:'302345678',voterName:'Ana Jiménez Vargas',voterHash:h('302345678'),choice:'en_contra',ts:'2024-11-15T10:25:00'},
     ],votedCarnets:['300123456','301234567','302345678']},
    {id:'p2',title:'Reforma al Reglamento de Organización Estudiantil',
     description:'Consulta estudiantil para aprobar las reformas propuestas al reglamento de la organización estudiantil de la UNED.',
     type:'cerrada',quorum:100,status:'activa',createdAt:'2024-11-15T09:00:00',candidates:null,
     votes:[
       {id:'v4',voterCarnet:'300123456',voterName:'María Rodríguez González',voterHash:h('300123456'),choice:'a_favor',ts:'2024-11-15T09:30:00'},
       {id:'v5',voterCarnet:'303456789',voterName:'Luis Hernández Mora',voterHash:h('303456789'),choice:'abstención',ts:'2024-11-15T09:45:00'},
     ],votedCarnets:['300123456','303456789']},
    {id:'p3',title:'Elección de Representante Estudiantil — Sede Central',
     description:'Votación para elegir al representante estudiantil de la Sede Central ante el Consejo Universitario de la UNED para el período 2025.',
     type:'personas',quorum:80,status:'activa',createdAt:'2024-11-14T08:00:00',
     candidates:[{id:'c1',name:'Andrea Solano Vargas'},{id:'c2',name:'Roberto Quesada Mora'},{id:'c3',name:'Patricia Jiménez Ulate'}],
     votes:[
       {id:'v6',voterCarnet:'300123456',voterName:'María R.',voterHash:h('300123456'),choice:'c1',ts:'2024-11-14T08:30:00'},
       {id:'v7',voterCarnet:'301234567',voterName:'Carlos M.',voterHash:h('301234567'),choice:'c2',ts:'2024-11-14T08:45:00'},
       {id:'v8',voterCarnet:'302345678',voterName:'Ana J.',voterHash:h('302345678'),choice:'c1',ts:'2024-11-14T09:00:00'},
       {id:'v9',voterCarnet:'303456789',voterName:'Luis H.',voterHash:h('303456789'),choice:'c3',ts:'2024-11-14T09:10:00'},
     ],votedCarnets:['300123456','301234567','302345678','303456789']},
    {id:'p4',title:'Moción de Censura a Directivo FEUNED',
     description:'Proceso de votación sobre la moción de censura presentada contra un miembro de la directiva de la FEUNED.',
     type:'cerrada',quorum:75,status:'cerrada',createdAt:'2024-11-10T14:00:00',candidates:null,
     votes:[
       {id:'va',voterCarnet:'300123456',voterName:'María R.',voterHash:h('300123456'),choice:'a_favor',ts:'2024-11-10T14:10:00'},
       {id:'vb',voterCarnet:'301234567',voterName:'Carlos M.',voterHash:h('301234567'),choice:'en_contra',ts:'2024-11-10T14:15:00'},
       {id:'vc',voterCarnet:'302345678',voterName:'Ana J.',voterHash:h('302345678'),choice:'a_favor',ts:'2024-11-10T14:20:00'},
       {id:'vd',voterCarnet:'303456789',voterName:'Luis H.',voterHash:h('303456789'),choice:'abstención',ts:'2024-11-10T14:25:00'},
       {id:'ve',voterCarnet:'304567890',voterName:'Sofía C.',voterHash:h('304567890'),choice:'a_favor',ts:'2024-11-10T14:30:00'},
     ],votedCarnets:['300123456','301234567','302345678','303456789','304567890']},
  ];
}

// ── ALMACENAMIENTO ────────────────────────────────────────────────
function getStudents(){return JSON.parse(localStorage.getItem('tee_students')||'null')||DEFAULT_STUDENTS;}
function saveStudents(s){localStorage.setItem('tee_students',JSON.stringify(s));}
function getProcesses(){const r=localStorage.getItem('tee_processes');if(r)return JSON.parse(r);const d=_mkProc();saveProcesses(d);return d;}
function saveProcesses(p){localStorage.setItem('tee_processes',JSON.stringify(p));}
function getSession(){try{return JSON.parse(localStorage.getItem('tee_session')||'null');}catch{return null;}}
function saveSession(u){localStorage.setItem('tee_session',JSON.stringify(u));}
function clearSession(){localStorage.removeItem('tee_session');}
function getEmailCfg(){return JSON.parse(localStorage.getItem('tee_emailcfg')||'{}');}
function saveEmailCfg(c){localStorage.setItem('tee_emailcfg',JSON.stringify(c));}
// ── AUTENTICACIÓN ─────────────────────────────────────────────────
function checkAuth(requiredRole){
  const session=getSession();
  if(!session){window.location.href='index.html';return null;}
  if(requiredRole&&session.role!==requiredRole){
    const map={student:'estudiante.html',teeuned:'teeuned.html',fiscalia:'fiscalia.html'};
    window.location.href=map[session.role]||'index.html';
    return null;
  }
  return session;
}
function doLogout(){clearSession();window.location.href='index.html';}

// ── UTILIDADES ────────────────────────────────────────────────────
function hash8(s){let h=5381;for(let i=0;i<s.length;i++)h=Math.imul((h<<5)+h,1)^s.charCodeAt(i);return(Math.abs(h)>>>0).toString(16).toUpperCase().padStart(8,'0');}
function fmtDate(iso){return new Date(iso).toLocaleDateString('es-CR',{day:'2-digit',month:'long',year:'numeric'});}
function fmtTime(iso){return new Date(iso).toLocaleTimeString('es-CR',{hour:'2-digit',minute:'2-digit',second:'2-digit'});}
function fmtDateShort(iso){return new Date(iso).toLocaleDateString('es-CR',{day:'2-digit',month:'short',year:'numeric'});}
function getResults(p){
  const total=p.votes.length;
  const hasPadron=typeof p.totalPadron==='number'&&p.totalPadron>0;
  const noVotaron=hasPadron?Math.max(0,p.totalPadron-total):0;
  const base=hasPadron?p.totalPadron:total;
  const pct=n=>base>0?Math.round(n/base*100):0;
  if(p.type==='personas'&&p.candidates){
    const counts={};p.candidates.forEach(c=>counts[c.id]=0);
    p.votes.forEach(v=>{if(counts[v.choice]!==undefined)counts[v.choice]++;});
    return{mode:'personas',candidates:p.candidates,counts,total,totalPadron:p.totalPadron||0,hasPadron,noVotaron,pct};
  }
  const favor=p.votes.filter(v=>v.choice==='a_favor').length;
  const contra=p.votes.filter(v=>v.choice==='en_contra').length;
  const abs=p.votes.filter(v=>v.choice==='abstencion').length;
  return{mode:'standard',favor,contra,abs,total,totalPadron:p.totalPadron||0,hasPadron,noVotaron,pct};
}

// ── EMAIL ─────────────────────────────────────────────────────────
function initEmailJS(){const cfg=getEmailCfg();if(cfg.publicKey&&typeof emailjs!=='undefined')emailjs.init({publicKey:cfg.publicKey});}
function sendVoteConfirmation(vote,process,statusElId){
  const students=getStudents();
  const student=students.find(s=>s.carnet===vote.voterCarnet);
  const email=student&&student.email?student.email:null;
  const el=statusElId?document.getElementById(statusElId):null;
  const cfg=getEmailCfg();
  if(!cfg.enabled||!cfg.publicKey||!cfg.serviceId||!cfg.templateIdVote){if(el)el.innerHTML='<span style="color:var(--warn-col,#6b4c00);font-size:12px">⚠ Correo no configurado — configure EmailJS en el Padrón (TEEUNED).</span>';return;}
  if(!email){if(el)el.innerHTML='<span style="color:var(--warn-col,#6b4c00);font-size:12px">⚠ Este estudiante no tiene correo registrado.</span>';return;}
  if(el)el.innerHTML='<span style="color:var(--info-col,#0d3d70);font-size:12px">📧 Enviando correo de confirmación...</span>';
  emailjs.send(cfg.serviceId,cfg.templateIdVote,{
    to_email:email,to_name:vote.voterName,carnet:vote.voterCarnet,
    process_title:process.title,process_desc:process.description,
    vote_code:'#'+vote.voterHash,vote_date:fmtDate(vote.ts),vote_time:fmtTime(vote.ts),
    from_name:'Fiscalía FEUNED — TEEUNED',reply_to:'fiscaliafeuned@uned.ac.cr',
    system_name:'Sistema de Votación Electrónica FEUNED',
  }).then(()=>{if(el)el.innerHTML='<span style="color:var(--success-col,#155c34);font-size:12px">✓ Correo de confirmación enviado a '+email+'</span>';})
  .catch(err=>{if(el)el.innerHTML='<span style="color:var(--danger-col,#7a1515);font-size:12px">✗ Error al enviar: '+((err&&err.text)||'verifique EmailJS')+'</span>';});
}
// sendPasswordReset (envío de contraseña en texto plano por correo) — ELIMINADO.
// El restablecimiento de contraseña ahora usa sendPasswordResetEmail() nativo
// de Firebase Auth (ver doForgotPassword() en index.html) — nunca se muestra
// ni se envía una contraseña en texto plano.

// ── NOTIFICACIONES ────────────────────────────────────────────────
let _nt=null;
function showNotif(msg,type='success'){
  let el=document.getElementById('tee-notif');
  if(!el){el=document.createElement('div');el.id='tee-notif';el.style.cssText='position:fixed;top:70px;right:22px;z-index:9999;padding:12px 20px;border-radius:6px;font-size:14px;font-weight:600;box-shadow:0 6px 24px rgba(0,0,0,.2);display:none;max-width:340px';document.body.appendChild(el);}
  el.textContent=(type==='success'?'✓ ':'✗ ')+msg;
  el.style.background=type==='success'?'#155c34':'#7a1515';
  el.style.color='#fff';el.style.display='block';
  if(_nt)clearTimeout(_nt);
  _nt=setTimeout(()=>{el.style.display='none';},3600);
}

document.addEventListener('DOMContentLoaded',()=>{initEmailJS();});
