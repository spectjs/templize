// common expression language
let e,r,t,a,o,l,d,n=(a,o=(r=a,e=0,t=[],!(a=c())||r[e]?h():e=>a(e||{})))=>(o.args=t,o),f=e=>e>=48&&e<=57||e>=65&&e<=90||e>=97&&e<=122||36==e||95==e||e>=192&&215!=e&&247!=e,h=(t="Bad syntax",a=r[e])=>{throw SyntaxError(t+" `"+a+"` at "+e)},s=(t=1,a=e,o)=>{if("number"==typeof t)e+=t;else for(;t(r.charCodeAt(e));)e++;return r.slice(a,e)},c=(r=0,t,a,o,l,d)=>{for(;(a=p())&&(l=(d=i[a])&&d(o,r)||!o&&u());)o=l;return t&&(a==t?e++:h()),o},p=t=>{for(;(t=r.charCodeAt(e))<=32;)e++;return t},u=(e=s(f),r)=>e?(r=r=>r[e],t.push(e),r.id=()=>e,r):0,i=[],g=n.set=(t,a,o=32,l=t.charCodeAt(0),d=t.length,n=i[l],h=o.length||([o,a]=[a,o],0),s=t.toUpperCase()!==t,p=(h>1?(e,r)=>e&&(r=c(a))&&(e.length||r.length?t=>o(e(t),r(t)):(e=o(e(),r()),()=>e)):h?e=>!e&&(e=c(a-1))&&(r=>o(e(r))):o))=>i[l]=(o,l,h=e)=>l<a&&(d<2||r.substr(e,d)==t)&&(!s||!f(r.charCodeAt(e+d)))&&(e+=d,p(o,l))||(e=h,n&&n(o,l)),C=e=>e>=48&&e<=57,A=t=>(t&&h("Unexpected number"),t=s((e=>46==e||C(e))),(69==r.charCodeAt(e)||101==r.charCodeAt(e))&&(t+=s(2)+s(C)),(t=+t)!=t?h("Bad number"):()=>t),x=(e,r,t=e.of)=>a=>r(t?t(a):a,e.id());for(o=48;o<=57;)i[o++]=A;for(a=['"',e=>(e=e?h("Unexpected string"):s((e=>e-34)),s()||h("Bad string"),()=>e),,".",(e,r,t)=>e?(p(),r=s(f)||h(),(t=t=>e(t)[r]).id=()=>r,t.of=e,t):A(s(-1)),18,"[",(e,r,t)=>e&&(r=c(0,93)||h(),(t=t=>e(t)[r(t)]).id=r,t.of=e,t),18,"(",(e,r,t)=>(r=c(0,41),e?t=>e(t).apply(e.of?.(t),r?r.all?r.all(t):[r(t)]:[]):r||h()),18,",",(e,r,t=c(1))=>(t.all=e.all?r=>[...e.all(r),t(r)]:r=>[e(r),t(r)],t),1,"|",6,(e,r)=>e|r,"||",4,(e,r)=>e||r,"&",8,(e,r)=>e&r,"&&",5,(e,r)=>e&&r,"^",7,(e,r)=>e^r,"==",9,(e,r)=>e==r,"!=",9,(e,r)=>e!=r,">",10,(e,r)=>e>r,">=",10,(e,r)=>e>=r,">>",11,(e,r)=>e>>r,">>>",11,(e,r)=>e>>>r,"<",10,(e,r)=>e<r,"<=",10,(e,r)=>e<=r,"<<",11,(e,r)=>e<<r,"+",12,(e,r)=>e+r,"+",15,e=>+e,"++",e=>x(e||c(14),e?(e,r)=>e[r]++:(e,r)=>++e[r]),15,"-",12,(e,r)=>e-r,"-",15,e=>-e,"--",e=>x(e||c(14),e?(e,r)=>e[r]--:(e,r)=>--e[r]),15,"!",15,e=>!e,"*",13,(e,r)=>e*r,"/",13,(e,r)=>e/r,"%",13,(e,r)=>e%r];[o,l,d,...a]=a,o;)g(o,l,d);

if (!Symbol.observable) Symbol.observable=Symbol('observable');

// observable utils
// FIXME: make an external dependency, shareable with spect/tmpl-parts
const sube = (target, next, stop) => (
  next.next = next,
  target && (
    target.subscribe?.( next ) ||
    target[Symbol.observable]?.().subscribe?.( next ) ||
    target.set && target.call?.(stop, next) || // observ
    (
      target.then?.(v => !stop && next(v)) ||
      (async _ => { for await (target of target) { if (stop) return; next(target); } })()
    ) && (_ => stop=1)
  )
),

observable = (arg) => arg && !!(
  arg[Symbol.observable] || arg[Symbol.asyncIterator] ||
  (arg.call && arg.set) ||
  arg.subscribe || arg.then
  // || arg.mutation && arg._state != null
);

// expression processor

const combine = (...processors) => ({
  createCallback: (a,b,c) => processors.map(p => p.createCallback?.(a,b,c)),
  processCallback: (a,b,c) => processors.map(p => p.processCallback?.(a,b,c))
}),

expressions = {
  createCallback(el, parts, state) {
    for (const part of parts) part.evaluate = n(part.expression);
  },
  processCallback(el, parts, state) {
    for (const part of parts) part.value = part.evaluate(state);
  }
},

reactivity = {
  createCallback(el, parts, state, subs=[]) {
    // we have to convert reactive state values into real ones
    for (const k in state) if (observable(state[k])) subs.push(sube(state[k], v => state[k] = v)), state[k] = null;
  }
};

export { combine, expressions, reactivity };