import{j as e}from"./pdf-renderer-BF-l1x_V.js";import{f as y,r as h,L as g,i as d}from"./react-vendor-CDUN56-9.js";import{c as s,u as f,z as u}from"./index-DpJBf6sJ.js";import{C as b}from"./dateUtils-C_MyiZEp.js";/**
 * @license lucide-react v0.460.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const j=s("LayoutDashboard",[["rect",{width:"7",height:"9",x:"3",y:"3",rx:"1",key:"10lvy0"}],["rect",{width:"7",height:"5",x:"14",y:"3",rx:"1",key:"16une8"}],["rect",{width:"7",height:"9",x:"14",y:"12",rx:"1",key:"1hutg5"}],["rect",{width:"7",height:"5",x:"3",y:"16",rx:"1",key:"ldoo1y"}]]);/**
 * @license lucide-react v0.460.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const k=s("LogOut",[["path",{d:"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4",key:"1uf3rs"}],["polyline",{points:"16 17 21 12 16 7",key:"1gabdz"}],["line",{x1:"21",x2:"9",y1:"12",y2:"12",key:"1uyos4"}]]);/**
 * @license lucide-react v0.460.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const D=s("Menu",[["line",{x1:"4",x2:"20",y1:"12",y2:"12",key:"1e0a9i"}],["line",{x1:"4",x2:"20",y1:"6",y2:"6",key:"1owob3"}],["line",{x1:"4",x2:"20",y1:"18",y2:"18",key:"yk5zj1"}]]);/**
 * @license lucide-react v0.460.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const z=s("X",[["path",{d:"M18 6 6 18",key:"1bl5f8"}],["path",{d:"m6 6 12 12",key:"d8bk6v"}]]),c=[{to:"/dashboard",label:"Dashboard",icon:j},{to:"/admin/events",label:"Événements",icon:b}];function B(){const{user:i,logout:m}=f(),x=y(),[r,l]=h.useState(!1),p=()=>{m(),u.success("Déconnexion réussie"),x("/login")};return e.jsxs("header",{style:{background:"#0D0D0D",borderBottom:"1px solid #2E2E2E",position:"sticky",top:0,zIndex:50},children:[e.jsxs("div",{style:{maxWidth:"1280px",margin:"0 auto",padding:"0 1.5rem",display:"flex",alignItems:"center",justifyContent:"space-between",height:"64px"},children:[e.jsxs(g,{to:"/dashboard",style:{textDecoration:"none",display:"flex",alignItems:"center",gap:"0.5rem"},children:[e.jsx("span",{style:{fontFamily:"Playfair Display, serif",fontSize:"1.25rem",fontWeight:700,color:"#F5F5F5"},children:"KHAYIL"}),e.jsx("span",{style:{fontFamily:"Inter, sans-serif",fontSize:"1rem",fontWeight:300,color:"#D4AF37",letterSpacing:"0.1em"},children:"2026"})]}),e.jsx("nav",{style:{display:"flex",gap:"0.25rem"},className:"hidden-mobile",children:c.map(({to:n,label:o,icon:a})=>e.jsxs(d,{to:n,style:({isActive:t})=>({display:"flex",alignItems:"center",gap:"0.4rem",padding:"0.4rem 0.9rem",borderRadius:"8px",textDecoration:"none",fontSize:"0.875rem",fontWeight:500,color:t?"#D4AF37":"#B0B0B0",background:t?"rgba(212,175,55,0.1)":"transparent",transition:"all 200ms"}),children:[e.jsx(a,{size:15}),o]},n))}),e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"1rem"},children:[i&&e.jsx("span",{style:{fontSize:"0.8125rem",color:"#6B6B6B",display:"none"},className:"show-tablet",children:i.email}),e.jsxs("button",{onClick:p,className:"btn btn-ghost btn-sm",title:"Déconnexion",children:[e.jsx(k,{size:15}),e.jsx("span",{className:"hidden-mobile",children:"Déconnexion"})]}),e.jsx("button",{onClick:()=>l(n=>!n),style:{background:"none",border:"none",color:"#B0B0B0",cursor:"pointer",display:"none"},className:"show-mobile",children:r?e.jsx(z,{size:20}):e.jsx(D,{size:20})})]})]}),r&&e.jsx("div",{style:{borderTop:"1px solid #2E2E2E",padding:"0.75rem 1.5rem",display:"flex",flexDirection:"column",gap:"0.25rem"},children:c.map(({to:n,label:o,icon:a})=>e.jsxs(d,{to:n,onClick:()=>l(!1),style:({isActive:t})=>({display:"flex",alignItems:"center",gap:"0.5rem",padding:"0.625rem 0.75rem",borderRadius:"8px",textDecoration:"none",fontSize:"0.9rem",fontWeight:500,color:t?"#D4AF37":"#B0B0B0",background:t?"rgba(212,175,55,0.1)":"transparent"}),children:[e.jsx(a,{size:16}),o]},n))}),e.jsx("style",{children:`
        @media (max-width: 640px) {
          .hidden-mobile { display: none !important; }
          .show-mobile   { display: flex !important; }
        }
        @media (min-width: 641px) {
          .show-mobile   { display: none !important; }
          .show-tablet   { display: inline !important; }
        }
      `})]})}function E({children:i}){return e.jsxs("div",{style:{minHeight:"100vh",background:"#0D0D0D",display:"flex",flexDirection:"column"},children:[e.jsx(B,{}),e.jsx("main",{style:{flex:1,maxWidth:"1280px",width:"100%",margin:"0 auto",padding:"2rem 1.5rem"},className:"animate-fadeIn",children:i}),e.jsxs("footer",{style:{borderTop:"1px solid #2E2E2E",padding:"1rem 1.5rem",textAlign:"center",fontSize:"0.8rem",color:"#6B6B6B"},children:[e.jsx("span",{style:{fontFamily:"Playfair Display, serif",color:"#D4AF37"},children:"KHAYIL 2026"})," "," · Plateforme d'invitations · ICC Gabon"]})]})}export{E as A,z as X};
