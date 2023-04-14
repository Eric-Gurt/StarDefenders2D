/*

	Programs that can be installed into bot, bot factories, maybe communication nodes too at some point.

	Entity that uses it should have property ._code and use sdProgram.StartProgram to set value for ._program

	Then do the ._program.Think( GSPEED )

*/

import sdEntity from './sdEntity.js';
import sdTimer from './sdTimer.js';
import sdBeacon from './sdBeacon.js';
import sdBot from './sdBot.js';
import sdWorld from '../sdWorld.js';

class sdProgram
{
	static init_class()
	{
		sdProgram.AsyncFunction = ( async ()=>{} ).__proto__;
		
		sdProgram.last_frame = sdWorld.frame;
		sdProgram.shell_object_by_program = new Map(); // [ program ][ entity ] // cleared on each frame
		
		{
			// JS-Interpreter: Copyright 2013 Google LLC, Apache 2.0
var h;
function k(a,b){"string"===typeof a&&(a=l(a,"code"));var d=a.constructor;this.ya=function(){return new d({options:{}})};var c=this.ya(),e;for(e in a)c[e]="body"===e?a[e].slice():a[e];this.ea=c;this.Va=b;this.ka=!1;this.V=[];this.Fa=0;this.Wa=Object.create(null);a=/^step([A-Z]\w*)$/;var f,g;for(g in this)"function"===typeof this[g]&&(f=g.match(a))&&(this.Wa[f[1]]=this[g].bind(this));this.J=n(this,this.ea,null);this.Ga=this.J.object;this.ea=l(this.V.join("\n"),"polyfills");this.V=void 0;p(this.ea);f=
new r(this.ea,this.J);f.done=!1;this.l=[f];this.bb();this.value=void 0;this.ea=c;f=new r(this.ea,this.J);f.done=!1;this.l.length=0;this.l[0]=f}
var aa={locations:!0,ecmaVersion:5},ba={configurable:!0,enumerable:!0,writable:!1},t={configurable:!0,enumerable:!1,writable:!0},u={configurable:!0,enumerable:!1,writable:!1},v={configurable:!1,enumerable:!1,writable:!1},ca={configurable:!1,enumerable:!0,writable:!0},da={STEP_ERROR:!0},w={SCOPE_REFERENCE:!0},y={VALUE_IN_DESCRIPTOR:!0},z={REGEXP_TIMEOUT:!0},ea=[],A=null,B=null,D="undefined"===typeof globalThis?this:globalThis,fa=["onmessage = function(e) {","var result;","var data = e.data;","switch (data[0]) {",
"case 'split':","result = data[1].split(data[2], data[3]);","break;","case 'match':","result = data[1].match(data[2]);","break;","case 'search':","result = data[1].search(data[2]);","break;","case 'replace':","result = data[1].replace(data[2], data[3]);","break;","case 'exec':","var regexp = data[1];","regexp.lastIndex = data[2];","result = [regexp.exec(data[3]), data[1].lastIndex];","break;","default:","throw Error('Unknown RegExp operation: ' + data[0]);","}","postMessage(result);","close();","};"];
function E(a){var b=a>>>0;return b===Number(a)?b:NaN}function F(a){var b=a>>>0;return String(b)===String(a)&&4294967295!==b?b:NaN}function p(a,b,d){b?a.start=b:delete a.start;d?a.end=d:delete a.end;for(var c in a)if("loc"!==c&&a.hasOwnProperty(c)){var e=a[c];e&&"object"===typeof e&&p(e,b,d)}}k.prototype.REGEXP_MODE=2;k.prototype.REGEXP_THREAD_TIMEOUT=1E3;k.prototype.POLYFILL_TIMEOUT=1E3;h=k.prototype;h.K=!1;h.va=!1;h.hb=0;
function l(a,b){var d={},c;for(c in aa)d[c]=aa[c];d.sourceFile=b;return D.acorn.parse(a,d)}h.gb=function(a){var b=this.l[0];if(!b||"Program"!==b.node.type)throw Error("Expecting original AST to start with a Program node");"string"===typeof a&&(a=l(a,"appendCode"+this.hb++));if(!a||"Program"!==a.type)throw Error("Expecting new AST to start with a Program node");G(this,a,b.scope);Array.prototype.push.apply(b.node.body,a.body);b.node.body.Oa=null;b.done=!1};
h.Qa=function(){var a=this.l;do{var b=a[a.length-1];if(!b)return!1;var d=b.node,c=d.type;if("Program"===c&&b.done)return!1;if(this.ka)break;var e=B;B=this;try{var f=this.Wa[c](a,b,d)}catch(m){if(m!==da)throw this.value!==m&&(this.value=void 0),m;}finally{B=e}f&&a.push(f);if(this.K)throw this.value=void 0,Error("Getter not supported in this context");if(this.va)throw this.value=void 0,Error("Setter not supported in this context");if(!g&&!d.end)var g=Date.now()+this.POLYFILL_TIMEOUT}while(!d.end&&g>
Date.now());return!0};h.bb=function(){for(;!this.ka&&this.Qa(););return this.ka};
function ha(a,b){a.g(b,"NaN",NaN,v);a.g(b,"Infinity",Infinity,v);a.g(b,"undefined",void 0,v);a.g(b,"window",b,ba);a.g(b,"this",b,v);a.g(b,"self",b);a.H=new H(null);a.R=new H(a.H);ia(a,b);ja(a,b);b.ja=a.H;a.g(b,"constructor",a.s,t);ka(a,b);la(a,b);ma(a,b);na(a,b);oa(a,b);pa(a,b);qa(a,b);ra(a,b);sa(a,b);var d=a.i(function(){throw EvalError("Can't happen");},!1);d.eval=!0;a.g(b,"eval",d,t);a.g(b,"parseInt",a.i(parseInt,!1),t);a.g(b,"parseFloat",a.i(parseFloat,!1),t);a.g(b,"isNaN",a.i(isNaN,!1),t);a.g(b,
"isFinite",a.i(isFinite,!1),t);d=[[escape,"escape"],[unescape,"unescape"],[decodeURI,"decodeURI"],[decodeURIComponent,"decodeURIComponent"],[encodeURI,"encodeURI"],[encodeURIComponent,"encodeURIComponent"]];for(var c=0;c<d.length;c++)a.g(b,d[c][1],a.i(function(e){return function(f){try{return e(f)}catch(g){I(a,a.eb,g.message)}}}(d[c][0]),!1),t);a.OBJECT=a.s;a.OBJECT_PROTO=a.H;a.FUNCTION=a.I;a.FUNCTION_PROTO=a.R;a.ARRAY=a.da;a.ARRAY_PROTO=a.wa;a.REGEXP=a.F;a.REGEXP_PROTO=a.xa;a.DATE=a.S;a.DATE_PROTO=
a.Sa;a.Va&&a.Va(a,b)}h.sb=0;
function ia(a,b){var d=/^[A-Za-z_$][\w$]*$/;var c=function(e){var f=arguments.length?String(arguments[arguments.length-1]):"",g=Array.prototype.slice.call(arguments,0,-1).join(",").trim();if(g){g=g.split(/\s*,\s*/);for(var m=0;m<g.length;m++){var q=g[m];d.test(q)||I(a,a.U,"Invalid function argument: "+q)}g=g.join(", ")}try{var C=l("(function("+g+") {"+f+"})","function"+a.sb++)}catch(x){I(a,a.U,"Invalid code: "+x.message)}1!==C.body.length&&I(a,a.U,"Invalid code in function body.");return J(a,C.body[0].expression,
a.J,"anonymous")};a.I=a.i(c,!0);a.g(b,"Function",a.I,t);a.g(a.I,"prototype",a.R,t);a.g(a.R,"constructor",a.I,t);a.R.Da=function(){};a.R.Da.id=a.Fa++;a.R.$a=!0;a.g(a.R,"length",0,u);a.R.D="Function";c=function(e,f){var g=a.l[a.l.length-1];g.X=this;g.v=e;g.C=[];null!==f&&void 0!==f&&(f instanceof H?g.C=ta(a,f):I(a,a.j,"CreateListFromArrayLike called on non-object"));g.Ka=!1};K(a,a.I,"apply",c);c=function(e){var f=a.l[a.l.length-1];f.X=this;f.v=e;f.C=[];for(var g=1;g<arguments.length;g++)f.C.push(arguments[g]);
f.Ka=!1};K(a,a.I,"call",c);a.V.push("Object.defineProperty(Function.prototype, 'bind',","{configurable: true, writable: true, value:","function bind(oThis) {","if (typeof this !== 'function') {","throw TypeError('What is trying to be bound is not callable');","}","var aArgs   = Array.prototype.slice.call(arguments, 1),","fToBind = this,","fNOP    = function() {},","fBound  = function() {","return fToBind.apply(this instanceof fNOP","? this",": oThis,","aArgs.concat(Array.prototype.slice.call(arguments)));",
"};","if (this.prototype) {","fNOP.prototype = this.prototype;","}","fBound.prototype = new fNOP();","return fBound;","}","});","");c=function(){return String(this)};K(a,a.I,"toString",c);a.g(a.I,"toString",a.i(c,!1),t);c=function(){return this.valueOf()};K(a,a.I,"valueOf",c);a.g(a.I,"valueOf",a.i(c,!1),t)}
function ja(a,b){function d(e){void 0!==e&&null!==e||I(a,a.j,"Cannot convert '"+e+"' to object")}var c=function(e){if(void 0===e||null===e)return L(a)?this:a.m(a.H);if(!(e instanceof H)){var f=a.m(M(a,e));f.data=e;return f}return e};a.s=a.i(c,!0);a.g(a.s,"prototype",a.H,t);a.g(a.H,"constructor",a.s,t);a.g(b,"Object",a.s,t);c=function(e){d(e);return N(a,Object.getOwnPropertyNames(e instanceof H?e.h:e))};a.g(a.s,"getOwnPropertyNames",a.i(c,!1),t);c=function(e){d(e);e instanceof H&&(e=e.h);return N(a,
Object.keys(e))};a.g(a.s,"keys",a.i(c,!1),t);c=function(e){if(null===e)return a.m(null);e instanceof H||I(a,a.j,"Object prototype may only be an Object or null");return a.m(e)};a.g(a.s,"create",a.i(c,!1),t);a.V.push("(function() {","var create_ = Object.create;","Object.create = function create(proto, props) {","var obj = create_(proto);","props && Object.defineProperties(obj, props);","return obj;","};","})();","");c=function(e,f,g){f=String(f);e instanceof H||I(a,a.j,"Object.defineProperty called on non-object");
g instanceof H||I(a,a.j,"Property description must be an object");!e.h[f]&&e.preventExtensions&&I(a,a.j,"Can't define property '"+f+"', object is not extensible");a.g(e,f,y,g.h);return e};a.g(a.s,"defineProperty",a.i(c,!1),t);a.V.push("(function() {","var defineProperty_ = Object.defineProperty;","Object.defineProperty = function defineProperty(obj, prop, d1) {","var d2 = {};","if ('configurable' in d1) d2.configurable = d1.configurable;","if ('enumerable' in d1) d2.enumerable = d1.enumerable;","if ('writable' in d1) d2.writable = d1.writable;",
"if ('value' in d1) d2.value = d1.value;","if ('get' in d1) d2.get = d1.get;","if ('set' in d1) d2.set = d1.set;","return defineProperty_(obj, prop, d2);","};","})();","Object.defineProperty(Object, 'defineProperties',","{configurable: true, writable: true, value:","function defineProperties(obj, props) {","var keys = Object.keys(props);","for (var i = 0; i < keys.length; i++) {","Object.defineProperty(obj, keys[i], props[keys[i]]);","}","return obj;","}","});","");c=function(e,f){e instanceof H||
I(a,a.j,"Object.getOwnPropertyDescriptor called on non-object");f=String(f);if(f in e.h){var g=Object.getOwnPropertyDescriptor(e.h,f),m=e.O[f];e=e.P[f];f=a.m(a.H);m||e?(a.g(f,"get",m),a.g(f,"set",e)):(a.g(f,"value",g.value),a.g(f,"writable",g.writable));a.g(f,"configurable",g.configurable);a.g(f,"enumerable",g.enumerable);return f}};a.g(a.s,"getOwnPropertyDescriptor",a.i(c,!1),t);c=function(e){d(e);return M(a,e)};a.g(a.s,"getPrototypeOf",a.i(c,!1),t);c=function(e){return!!e&&!e.preventExtensions};
a.g(a.s,"isExtensible",a.i(c,!1),t);c=function(e){e instanceof H&&(e.preventExtensions=!0);return e};a.g(a.s,"preventExtensions",a.i(c,!1),t);K(a,a.s,"toString",H.prototype.toString);K(a,a.s,"toLocaleString",H.prototype.toString);K(a,a.s,"valueOf",H.prototype.valueOf);c=function(e){d(this);return this instanceof H?String(e)in this.h:this.hasOwnProperty(e)};K(a,a.s,"hasOwnProperty",c);c=function(e){d(this);return this instanceof H?Object.prototype.propertyIsEnumerable.call(this.h,e):this.propertyIsEnumerable(e)};
K(a,a.s,"propertyIsEnumerable",c);c=function(e){for(;;){e=M(a,e);if(!e)return!1;if(e===this)return!0}};K(a,a.s,"isPrototypeOf",c)}
function ka(a,b){var d=function(c){var e=L(a)?this:O(a),f=arguments[0];if(1===arguments.length&&"number"===typeof f)isNaN(E(f))&&I(a,a.Ta,"Invalid array length"),e.h.length=f;else{for(f=0;f<arguments.length;f++)e.h[f]=arguments[f];e.h.length=f}return e};a.da=a.i(d,!0);a.wa=a.da.h.prototype;a.g(b,"Array",a.da,t);d=function(c){return c&&"Array"===c.D};a.g(a.da,"isArray",a.i(d,!1),t);a.g(a.wa,"length",0,{configurable:!1,enumerable:!1,writable:!0});a.wa.D="Array";a.V.push("Object.defineProperty(Array.prototype, 'pop',",
"{configurable: true, writable: true, value:","function pop() {","if (!this) throw TypeError();","var o = Object(this), len = o.length >>> 0;","if (!len || len < 0) {","o.length = 0;","return undefined;","}","len--;","var x = o[len];","delete o[len];","o.length = len;","return x;","}","});","Object.defineProperty(Array.prototype, 'push',","{configurable: true, writable: true, value:","function push(var_args) {","if (!this) throw TypeError();","var o = Object(this), len = o.length >>> 0;","for (var i = 0; i < arguments.length; i++) {",
"o[len] = arguments[i];","len++;","}","o.length = len;","return len;","}","});","Object.defineProperty(Array.prototype, 'shift',","{configurable: true, writable: true, value:","function shift() {","if (!this) throw TypeError();","var o = Object(this), len = o.length >>> 0;","if (!len || len < 0) {","o.length = 0;","return undefined;","}","var value = o[0];","for (var i = 0; i < len - 1; i++) {","if ((i + 1) in o) {","o[i] = o[i + 1];","} else {","delete o[i];","}","}","delete o[i];","o.length = len - 1;",
"return value;","}","});","Object.defineProperty(Array.prototype, 'unshift',","{configurable: true, writable: true, value:","function unshift(var_args) {","if (!this) throw TypeError();","var o = Object(this), len = o.length >>> 0;","if (!len || len < 0) {","len = 0;","}","for (var i = len - 1; i >= 0; i--) {","if (i in o) {","o[i + arguments.length] = o[i];","} else {","delete o[i + arguments.length];","}","}","for (var i = 0; i < arguments.length; i++) {","o[i] = arguments[i];","}","return (o.length = len + arguments.length);",
"}","});","Object.defineProperty(Array.prototype, 'reverse',","{configurable: true, writable: true, value:","function reverse() {","if (!this) throw TypeError();","var o = Object(this), len = o.length >>> 0;","if (!len || len < 2) {","return o;","}","for (var i = 0; i < len / 2 - 0.5; i++) {","var x = o[i];","var hasX = i in o;","if ((len - i - 1) in o) {","o[i] = o[len - i - 1];","} else {","delete o[i];","}","if (hasX) {","o[len - i - 1] = x;","} else {","delete o[len - i - 1];","}","}","return o;",
"}","});","Object.defineProperty(Array.prototype, 'indexOf',","{configurable: true, writable: true, value:","function indexOf(searchElement, fromIndex) {","if (!this) throw TypeError();","var o = Object(this), len = o.length >>> 0;","var n = fromIndex | 0;","if (!len || n >= len) {","return -1;","}","var i = Math.max(n >= 0 ? n : len - Math.abs(n), 0);","while (i < len) {","if (i in o && o[i] === searchElement) {","return i;","}","i++;","}","return -1;","}","});","Object.defineProperty(Array.prototype, 'lastIndexOf',",
"{configurable: true, writable: true, value:","function lastIndexOf(searchElement, fromIndex) {","if (!this) throw TypeError();","var o = Object(this), len = o.length >>> 0;","if (!len) {","return -1;","}","var n = len - 1;","if (arguments.length > 1) {","n = fromIndex | 0;","if (n) {","n = (n > 0 || -1) * Math.floor(Math.abs(n));","}","}","var i = n >= 0 ? Math.min(n, len - 1) : len - Math.abs(n);","while (i >= 0) {","if (i in o && o[i] === searchElement) {","return i;","}","i--;","}","return -1;",
"}","});","Object.defineProperty(Array.prototype, 'slice',","{configurable: true, writable: true, value:","function slice(start, end) {","if (!this) throw TypeError();","var o = Object(this), len = o.length >>> 0;","start |= 0;","start = (start >= 0) ? start : Math.max(0, len + start);","if (typeof end !== 'undefined') {","if (end !== Infinity) {","end |= 0;","}","if (end < 0) {","end = len + end;","} else {","end = Math.min(end, len);","}","} else {","end = len;","}","var size = end - start;","var cloned = new Array(size);",
"for (var i = 0; i < size; i++) {","if ((start + i) in o) {","cloned[i] = o[start + i];","}","}","return cloned;","}","});","Object.defineProperty(Array.prototype, 'splice',","{configurable: true, writable: true, value:","function splice(start, deleteCount, var_args) {","if (!this) throw TypeError();","var o = Object(this), len = o.length >>> 0;","start |= 0;","if (start < 0) {","start = Math.max(len + start, 0);","} else {","start = Math.min(start, len);","}","if (arguments.length < 1) {","deleteCount = len - start;",
"} else {","deleteCount |= 0;","deleteCount = Math.max(0, Math.min(deleteCount, len - start));","}","var removed = [];","for (var i = start; i < start + deleteCount; i++) {","if (i in o) {","removed.push(o[i]);","} else {","removed.length++;","}","if ((i + deleteCount) in o) {","o[i] = o[i + deleteCount];","} else {","delete o[i];","}","}","for (var i = start + deleteCount; i < len - deleteCount; i++) {","if ((i + deleteCount) in o) {","o[i] = o[i + deleteCount];","} else {","delete o[i];","}","}",
"for (var i = len - deleteCount; i < len; i++) {","delete o[i];","}","len -= deleteCount;","var arl = arguments.length - 2;","for (var i = len - 1; i >= start; i--) {","if (i in o) {","o[i + arl] = o[i];","} else {","delete o[i + arl];","}","}","len += arl;","for (var i = 2; i < arguments.length; i++) {","o[start + i - 2] = arguments[i];","}","o.length = len;","return removed;","}","});","Object.defineProperty(Array.prototype, 'concat',","{configurable: true, writable: true, value:","function concat(var_args) {",
"if (!this) throw TypeError();","var o = Object(this);","var cloned = [];","for (var i = -1; i < arguments.length; i++) {","var value = (i === -1) ? o : arguments[i];","if (Array.isArray(value)) {","for (var j = 0, l = value.length; j < l; j++) {","if (j in value) {","cloned.push(value[j]);","} else {","cloned.length++;","}","}","} else {","cloned.push(value);","}","}","return cloned;","}","});","Object.defineProperty(Array.prototype, 'join',","{configurable: true, writable: true, value:","function join(opt_separator) {",
"if (!this) throw TypeError();","var o = Object(this), len = o.length >>> 0;","var sep = typeof opt_separator === 'undefined' ?","',' : ('' + opt_separator);","var str = '';","for (var i = 0; i < len; i++) {","if (i && sep) {","str += sep;","}","str += (o[i] === null || o[i] === undefined) ? '' : o[i];","}","return str;","}","});","Object.defineProperty(Array.prototype, 'every',","{configurable: true, writable: true, value:","function every(callbackfn, thisArg) {","if (!this || typeof callbackfn !== 'function') throw TypeError();",
"var t, k = 0;","var o = Object(this), len = o.length >>> 0;","if (arguments.length > 1) t = thisArg;","while (k < len) {","if (k in o && !callbackfn.call(t, o[k], k, o)) return false;","k++;","}","return true;","}","});","Object.defineProperty(Array.prototype, 'filter',","{configurable: true, writable: true, value:","function filter(fun, var_args) {","if (this === void 0 || this === null || typeof fun !== 'function') throw TypeError();","var o = Object(this), len = o.length >>> 0;","var res = [];",
"var thisArg = arguments.length >= 2 ? arguments[1] : void 0;","for (var i = 0; i < len; i++) {","if (i in o) {","var val = o[i];","if (fun.call(thisArg, val, i, o)) res.push(val);","}","}","return res;","}","});","Object.defineProperty(Array.prototype, 'forEach',","{configurable: true, writable: true, value:","function forEach(callback, thisArg) {","if (!this || typeof callback !== 'function') throw TypeError();","var t, k = 0;","var o = Object(this), len = o.length >>> 0;","if (arguments.length > 1) t = thisArg;",
"while (k < len) {","if (k in o) callback.call(t, o[k], k, o);","k++;","}","}","});","Object.defineProperty(Array.prototype, 'map',","{configurable: true, writable: true, value:","function map(callback, thisArg) {","if (!this || typeof callback !== 'function') throw TypeError();","var t, k = 0;","var o = Object(this), len = o.length >>> 0;","if (arguments.length > 1) t = thisArg;","var a = new Array(len);","while (k < len) {","if (k in o) a[k] = callback.call(t, o[k], k, o);","k++;","}","return a;",
"}","});","Object.defineProperty(Array.prototype, 'reduce',","{configurable: true, writable: true, value:","function reduce(callback /*, initialValue*/) {","if (!this || typeof callback !== 'function') throw TypeError();","var o = Object(this), len = o.length >>> 0;","var k = 0, value;","if (arguments.length === 2) {","value = arguments[1];","} else {","while (k < len && !(k in o)) k++;","if (k >= len) {","throw TypeError('Reduce of empty array with no initial value');","}","value = o[k++];","}",
"for (; k < len; k++) {","if (k in o) value = callback(value, o[k], k, o);","}","return value;","}","});","Object.defineProperty(Array.prototype, 'reduceRight',","{configurable: true, writable: true, value:","function reduceRight(callback /*, initialValue*/) {","if (null === this || 'undefined' === typeof this || 'function' !== typeof callback) throw TypeError();","var o = Object(this), len = o.length >>> 0;","var k = len - 1, value;","if (arguments.length >= 2) {","value = arguments[1];","} else {",
"while (k >= 0 && !(k in o)) k--;","if (k < 0) {","throw TypeError('Reduce of empty array with no initial value');","}","value = o[k--];","}","for (; k >= 0; k--) {","if (k in o) value = callback(value, o[k], k, o);","}","return value;","}","});","Object.defineProperty(Array.prototype, 'some',","{configurable: true, writable: true, value:","function some(fun/*, thisArg*/) {","if (!this || typeof fun !== 'function') throw TypeError();","var o = Object(this), len = o.length >>> 0;","var thisArg = arguments.length >= 2 ? arguments[1] : void 0;",
"for (var i = 0; i < len; i++) {","if (i in o && fun.call(thisArg, o[i], i, o)) {","return true;","}","}","return false;","}","});","Object.defineProperty(Array.prototype, 'sort',","{configurable: true, writable: true, value:","function sort(opt_comp) {","if (!this) throw TypeError();","if (typeof opt_comp !== 'function') {","opt_comp = undefined;","}","for (var i = 0; i < this.length; i++) {","var changes = 0;","for (var j = 0; j < this.length - i - 1; j++) {","if (opt_comp ? (opt_comp(this[j], this[j + 1]) > 0) :",
"(String(this[j]) > String(this[j + 1]))) {","var swap = this[j];","var hasSwap = j in this;","if ((j + 1) in this) {","this[j] = this[j + 1];","} else {","delete this[j];","}","if (hasSwap) {","this[j + 1] = swap;","} else {","delete this[j + 1];","}","changes++;","}","}","if (!changes) break;","}","return this;","}","});","Object.defineProperty(Array.prototype, 'toLocaleString',","{configurable: true, writable: true, value:","function toLocaleString() {","if (!this) throw TypeError();","var o = Object(this), len = o.length >>> 0;",
"var out = [];","for (var i = 0; i < len; i++) {","out[i] = (o[i] === null || o[i] === undefined) ? '' : o[i].toLocaleString();","}","return out.join(',');","}","});","")}
function la(a,b){var d=function(c){c=arguments.length?D.String(c):"";return L(a)?(this.data=c,this):c};a.G=a.i(d,!0);a.g(b,"String",a.G,t);a.g(a.G,"fromCharCode",a.i(String.fromCharCode,!1),t);b="charAt charCodeAt concat indexOf lastIndexOf slice substr substring toLocaleLowerCase toLocaleUpperCase toLowerCase toUpperCase trim".split(" ");for(d=0;d<b.length;d++)K(a,a.G,b[d],String.prototype[b[d]]);d=function(c,e,f){e=a.L(e);f=a.L(f);try{return String(this).localeCompare(c,e,f)}catch(g){I(a,a.B,"localeCompare: "+
g.message)}};K(a,a.G,"localeCompare",d);d=function(c,e,f){var g=String(this);e=e?Number(e):void 0;if(P(a,c,a.F)&&(c=c.data,Q(a,c,f),2===a.REGEXP_MODE)){if(A)c=R(a,"string.split(separator, limit)",{string:g,separator:c,limit:e},c,f),c!==z&&f(N(a,c));else{var m=a.Z(),q=S(a,c,m,f);m.onmessage=function(C){clearTimeout(q);f(N(a,C.data))};m.postMessage(["split",g,c,e])}return}c=g.split(c,e);f(N(a,c))};T(a,a.G,"split",d);d=function(c,e){var f=String(this);P(a,c,a.F)?c=c.data:c=new RegExp(c);Q(a,c,e);if(2===
a.REGEXP_MODE)if(A)c=R(a,"string.match(regexp)",{string:f,regexp:c},c,e),c!==z&&e(c&&N(a,c));else{var g=a.Z(),m=S(a,c,g,e);g.onmessage=function(q){clearTimeout(m);e(q.data&&N(a,q.data))};g.postMessage(["match",f,c])}else c=f.match(c),e(c&&N(a,c))};T(a,a.G,"match",d);d=function(c,e){var f=String(this);P(a,c,a.F)?c=c.data:c=new RegExp(c);Q(a,c,e);if(2===a.REGEXP_MODE)if(A)c=R(a,"string.search(regexp)",{string:f,regexp:c},c,e),c!==z&&e(c);else{var g=a.Z(),m=S(a,c,g,e);g.onmessage=function(q){clearTimeout(m);
e(q.data)};g.postMessage(["search",f,c])}else e(f.search(c))};T(a,a.G,"search",d);d=function(c,e,f){var g=String(this);e=String(e);if(P(a,c,a.F)&&(c=c.data,Q(a,c,f),2===a.REGEXP_MODE)){if(A)c=R(a,"string.replace(substr, newSubstr)",{string:g,substr:c,newSubstr:e},c,f),c!==z&&f(c);else{var m=a.Z(),q=S(a,c,m,f);m.onmessage=function(C){clearTimeout(q);f(C.data)};m.postMessage(["replace",g,c,e])}return}f(g.replace(c,e))};T(a,a.G,"replace",d);a.V.push("(function() {","var replace_ = String.prototype.replace;",
"String.prototype.replace = function replace(substr, newSubstr) {","if (typeof newSubstr !== 'function') {","return replace_.call(this, substr, newSubstr);","}","var str = this;","if (substr instanceof RegExp) {","var subs = [];","var m = substr.exec(str);","while (m) {","m.push(m.index, str);","var inject = newSubstr.apply(null, m);","subs.push([m.index, m[0].length, inject]);","m = substr.global ? substr.exec(str) : null;","}","for (var i = subs.length - 1; i >= 0; i--) {","str = str.substring(0, subs[i][0]) + subs[i][2] + str.substring(subs[i][0] + subs[i][1]);",
"}","} else {","var i = str.indexOf(substr);","if (i !== -1) {","var inject = newSubstr(str.substr(i, substr.length), i, str);","str = str.substring(0, i) + inject + str.substring(i + substr.length);","}","}","return str;","};","})();","")}function ma(a,b){a.Ra=a.i(function(d){d=D.Boolean(d);return L(a)?(this.data=d,this):d},!0);a.g(b,"Boolean",a.Ra,t)}
function na(a,b){var d=function(c){c=arguments.length?D.Number(c):0;return L(a)?(this.data=c,this):c};a.T=a.i(d,!0);a.g(b,"Number",a.T,t);b=["MAX_VALUE","MIN_VALUE","NaN","NEGATIVE_INFINITY","POSITIVE_INFINITY"];for(d=0;d<b.length;d++)a.g(a.T,b[d],Number[b[d]],v);d=function(c){try{return Number(this).toExponential(c)}catch(e){I(a,a.B,e.message)}};K(a,a.T,"toExponential",d);d=function(c){try{return Number(this).toFixed(c)}catch(e){I(a,a.B,e.message)}};K(a,a.T,"toFixed",d);d=function(c){try{return Number(this).toPrecision(c)}catch(e){I(a,
a.B,e.message)}};K(a,a.T,"toPrecision",d);d=function(c){try{return Number(this).toString(c)}catch(e){I(a,a.B,e.message)}};K(a,a.T,"toString",d);d=function(c,e){c=c?a.L(c):void 0;e=e?a.L(e):void 0;return Number(this).toLocaleString(c,e)};K(a,a.T,"toLocaleString",d)}
function oa(a,b){var d=function(e,f){if(!L(a))return D.Date();var g=[null].concat(Array.from(arguments));this.data=new (Function.prototype.bind.apply(D.Date,g));return this};a.S=a.i(d,!0);a.Sa=a.S.h.prototype;a.g(b,"Date",a.S,t);a.g(a.S,"now",a.i(Date.now,!1),t);a.g(a.S,"parse",a.i(Date.parse,!1),t);a.g(a.S,"UTC",a.i(Date.UTC,!1),t);b="getDate getDay getFullYear getHours getMilliseconds getMinutes getMonth getSeconds getTime getTimezoneOffset getUTCDate getUTCDay getUTCFullYear getUTCHours getUTCMilliseconds getUTCMinutes getUTCMonth getUTCSeconds getYear setDate setFullYear setHours setMilliseconds setMinutes setMonth setSeconds setTime setUTCDate setUTCFullYear setUTCHours setUTCMilliseconds setUTCMinutes setUTCMonth setUTCSeconds setYear toDateString toISOString toJSON toGMTString toLocaleDateString toLocaleString toLocaleTimeString toTimeString toUTCString".split(" ");
for(var c=0;c<b.length;c++)d=function(e){return function(f){var g=this.data;g instanceof Date||I(a,a.j,e+" not called on a Date");for(var m=[],q=0;q<arguments.length;q++)m[q]=a.L(arguments[q]);return g[e].apply(g,m)}}(b[c]),K(a,a.S,b[c],d)}
function pa(a,b){var d=function(c,e){if(L(a))var f=this;else{if(void 0===e&&P(a,c,a.F))return c;f=a.m(a.xa)}c=void 0===c?"":String(c);e=e?String(e):"";/^[gmi]*$/.test(e)||I(a,a.U,"Invalid regexp flag");try{var g=new D.RegExp(c,e)}catch(m){I(a,a.U,m.message)}U(a,f,g);return f};a.F=a.i(d,!0);a.xa=a.F.h.prototype;a.g(b,"RegExp",a.F,t);a.g(a.F.h.prototype,"global",void 0,u);a.g(a.F.h.prototype,"ignoreCase",void 0,u);a.g(a.F.h.prototype,"multiline",void 0,u);a.g(a.F.h.prototype,"source","(?:)",u);a.V.push("Object.defineProperty(RegExp.prototype, 'test',",
"{configurable: true, writable: true, value:","function test(str) {","return !!this.exec(str);","}","});");d=function(c,e){function f(x){if(x){var Y=N(a,x);a.g(Y,"index",x.index);a.g(Y,"input",x.input);return Y}return null}var g=this.data;c=String(c);g.lastIndex=Number(a.A(this,"lastIndex"));Q(a,g,e);if(2===a.REGEXP_MODE)if(A)c=R(a,"regexp.exec(string)",{string:c,regexp:g},g,e),c!==z&&(a.g(this,"lastIndex",g.lastIndex),e(f(c)));else{var m=a.Z(),q=S(a,g,m,e),C=this;m.onmessage=function(x){clearTimeout(q);
a.g(C,"lastIndex",x.data[1]);e(f(x.data[0]))};m.postMessage(["exec",g,g.lastIndex,c])}else c=g.exec(c),a.g(this,"lastIndex",g.lastIndex),e(f(c))};T(a,a.F,"exec",d)}
function qa(a,b){function d(c){var e=a.i(function(f){var g=L(a)?this:a.la(e);V(a,g,f);return g},!0);a.g(e,"prototype",a.la(a.B),t);a.g(e.h.prototype,"name",c,t);a.g(b,c,e,t);return e}a.B=a.i(function(c){var e=L(a)?this:a.la(a.B);V(a,e,c);return e},!0);a.g(b,"Error",a.B,t);a.g(a.B.h.prototype,"message","",t);a.g(a.B.h.prototype,"name","Error",t);d("EvalError");a.Ta=d("RangeError");a.Ua=d("ReferenceError");a.U=d("SyntaxError");a.j=d("TypeError");a.eb=d("URIError")}
function ra(a,b){var d=a.m(a.H);a.g(b,"Math",d,t);var c="E LN2 LN10 LOG2E LOG10E PI SQRT1_2 SQRT2".split(" ");for(b=0;b<c.length;b++)a.g(d,c[b],Math[c[b]],u);c="abs acos asin atan atan2 ceil cos exp floor log max min pow random round sin sqrt tan".split(" ");for(b=0;b<c.length;b++)a.g(d,c[b],a.i(Math[c[b]],!1),t)}
function sa(a,b){function d(e){try{var f=JSON.parse(String(e))}catch(g){I(a,a.U,g.message)}return a.ta(f)}var c=a.m(a.H);a.g(b,"JSON",c,t);a.g(c,"parse",a.i(d,!1));d=function(e,f,g){f&&"Function"===f.D?I(a,a.j,"Function replacer on JSON.stringify not supported"):f&&"Array"===f.D?(f=ta(a,f),f=f.filter(function(q){return"string"===typeof q||"number"===typeof q})):f=null;"string"!==typeof g&&"number"!==typeof g&&(g=void 0);e=a.L(e);try{var m=JSON.stringify(e,f,g)}catch(q){I(a,a.j,q.message)}return m};
a.g(c,"stringify",a.i(d,!1))}function P(a,b,d){if(null===b||void 0===b||!d)return!1;d=d.h.prototype;if(b===d)return!0;for(b=M(a,b);b;){if(b===d)return!0;b=b.ja}return!1}function U(a,b,d){b.data=new RegExp(d.source,d.flags);a.g(b,"lastIndex",d.lastIndex,t);a.g(b,"source",d.source,u);a.g(b,"global",d.global,u);a.g(b,"ignoreCase",d.ignoreCase,u);a.g(b,"multiline",d.multiline,u)}
function V(a,b,d){d&&a.g(b,"message",String(d),t);d=[];for(var c=a.l.length-1;0<=c;c--){var e=a.l[c],f=e.node;"CallExpression"===f.type&&(e=e.X)&&d.length&&(d[d.length-1].kb=a.A(e,"name"));!f.loc||d.length&&"CallExpression"!==f.type||d.push({jb:f.loc})}c=String(a.A(b,"name"));f=String(a.A(b,"message"));f=c+": "+f+"\n";for(c=0;c<d.length;c++){var g=d[c].jb;e=d[c].kb;g=g.source+":"+g.start.line+":"+g.start.column;f=e?f+("  at "+e+" ("+g+")\n"):f+("  at "+g+"\n")}a.g(b,"stack",f.trim(),t)}
h.Z=function(){var a=this.Z.ib;a||(a=new Blob([fa.join("\n")],{type:"application/javascript"}),this.Z.ib=a);return new Worker(URL.createObjectURL(a))};function R(a,b,d,c,e){var f={timeout:a.REGEXP_THREAD_TIMEOUT};try{return A.runInNewContext(b,d,f)}catch(g){e(null),I(a,a.B,"RegExp Timeout: "+c)}return z}
function Q(a,b,d){if(0===a.REGEXP_MODE)var c=!1;else if(1===a.REGEXP_MODE)c=!0;else if(A)c=!0;else if("function"===typeof Worker&&"function"===typeof URL)c=!0;else if("function"===typeof require){try{A=require("vm")}catch(e){}c=!!A}else c=!1;c||(d(null),I(a,a.B,"Regular expressions not supported: "+b))}function S(a,b,d,c){return setTimeout(function(){d.terminate();c(null);try{I(a,a.B,"RegExp Timeout: "+b)}catch(e){}},a.REGEXP_THREAD_TIMEOUT)}h.la=function(a){return this.m(a&&a.h.prototype)};
h.m=function(a){if("object"!==typeof a)throw Error("Non object prototype");a=new H(a);P(this,a,this.B)&&(a.D="Error");return a};function O(a){var b=a.m(a.wa);a.g(b,"length",0,{configurable:!1,enumerable:!1,writable:!0});b.D="Array";return b}function ua(a,b,d){var c=a.m(a.R);d?(d=a.m(a.H),a.g(c,"prototype",d,t),a.g(d,"constructor",c,t)):c.$a=!0;a.g(c,"length",b,u);c.D="Function";return c}
function J(a,b,d,c){var e=ua(a,b.params.length,!0);e.Ea=d;e.node=b;a.g(e,"name",b.id?String(b.id.name):c||"",u);return e}h.i=function(a,b){b=ua(this,a.length,b);b.Da=a;a.id=this.Fa++;this.g(b,"name",a.name,u);return b};h.Xa=function(a){var b=ua(this,a.length,!0);b.Ha=a;a.id=this.Fa++;this.g(b,"name",a.name,u);return b};
h.ta=function(a){if(a instanceof H)throw Error("Object is already pseudo");if("object"!==typeof a&&"function"!==typeof a||null===a)return a;if(a instanceof RegExp){var b=this.m(this.xa);U(this,b,a);return b}if(a instanceof Date)return b=this.m(this.Sa),b.data=new Date(a.valueOf()),b;if("function"===typeof a){var d=this;b=Object.getOwnPropertyDescriptor(a,"prototype");return this.i(function(){var e=Array.prototype.slice.call(arguments).map(function(f){return d.L(f)});e=a.apply(d,e);return d.ta(e)},
!!b)}if(Array.isArray(a)){b=O(this);for(var c=0;c<a.length;c++)c in a&&this.g(b,c,this.ta(a[c]));return b}b=this.m(this.H);for(c in a)this.g(b,c,this.ta(a[c]));return b};
h.L=function(a,b){if("object"!==typeof a&&"function"!==typeof a||null===a)return a;if(!(a instanceof H))throw Error("Object is not pseudo");if(P(this,a,this.F))return b=new RegExp(a.data.source,a.data.flags),b.lastIndex=a.data.lastIndex,b;if(P(this,a,this.S))return new Date(a.data.valueOf());b=b||{Ma:[],Ca:[]};var d=b.Ma.indexOf(a);if(-1!==d)return b.Ca[d];b.Ma.push(a);if(P(this,a,this.da)){d=[];b.Ca.push(d);for(var c=this.A(a,"length"),e=0;e<c;e++)W(this,a,e)&&(d[e]=this.L(this.A(a,e),b))}else for(c in d=
{},b.Ca.push(d),a.h)e=this.L(a.h[c],b),Object.defineProperty(d,c,{value:e,writable:!0,enumerable:!0,configurable:!0});b.Ma.pop();b.Ca.pop();return d};function N(a,b){for(var d=O(a),c=Object.getOwnPropertyNames(b),e=0;e<c.length;e++)a.g(d,c[e],b[c[e]]);return d}function ta(a,b){var d=[],c;for(c in b.h)d[c]=a.A(b,c);d.length=E(a.A(b,"length"))||0;return d}
function M(a,b){switch(typeof b){case "number":return a.T.h.prototype;case "boolean":return a.Ra.h.prototype;case "string":return a.G.h.prototype}return b?b.ja:null}
h.A=function(a,b){if(this.K)throw Error("Getter not supported in that context");b=String(b);void 0!==a&&null!==a||I(this,this.j,"Cannot read property '"+b+"' of "+a);if("object"===typeof a&&!(a instanceof H))throw TypeError("Expecting native value or pseudo object");if("length"===b){if(P(this,a,this.G))return String(a).length}else if(64>b.charCodeAt(0)&&P(this,a,this.G)){var d=F(b);if(!isNaN(d)&&d<String(a).length)return String(a)[d]}do if(a.h&&b in a.h)return(d=a.O[b])?(this.K=!0,d):a.h[b];while(a=
M(this,a))};function W(a,b,d){if(!(b instanceof H))throw TypeError("Primitive data type has no properties");d=String(d);if("length"===d&&P(a,b,a.G))return!0;if(P(a,b,a.G)){var c=F(d);if(!isNaN(c)&&c<String(b).length)return!0}do if(b.h&&d in b.h)return!0;while(b=M(a,b));return!1}
h.g=function(a,b,d,c){if(this.va)throw Error("Setter not supported in that context");b=String(b);void 0!==a&&null!==a||I(this,this.j,"Cannot set property '"+b+"' of "+a);if("object"===typeof a&&!(a instanceof H))throw TypeError("Expecting native value or pseudo object");c&&("get"in c||"set"in c)&&("value"in c||"writable"in c)&&I(this,this.j,"Invalid property descriptor. Cannot both specify accessors and a value or writable attribute");var e=!this.l||va(this).M;if(a instanceof H){if(P(this,a,this.G)){var f=
F(b);if("length"===b||!isNaN(f)&&f<String(a).length){e&&I(this,this.j,"Cannot assign to read only property '"+b+"' of String '"+a.data+"'");return}}if("Array"===a.D)if(f=a.h.length,"length"===b){if(c){if(!("value"in c))return;d=c.value}d=E(d);isNaN(d)&&I(this,this.Ta,"Invalid array length");if(d<f)for(g in a.h){var g=F(g);!isNaN(g)&&d<=g&&delete a.h[g]}}else isNaN(g=F(b))||(a.h.length=Math.max(f,g+1));if(!a.preventExtensions||b in a.h)if(c){e={};"get"in c&&c.get&&(a.O[b]=c.get,e.get=this.g.wb);"set"in
c&&c.set&&(a.P[b]=c.set,e.set=this.g.xb);"configurable"in c&&(e.configurable=c.configurable);"enumerable"in c&&(e.enumerable=c.enumerable);"writable"in c&&(e.writable=c.writable,delete a.O[b],delete a.P[b]);"value"in c?(e.value=c.value,delete a.O[b],delete a.P[b]):d!==y&&(e.value=d,delete a.O[b],delete a.P[b]);try{Object.defineProperty(a.h,b,e)}catch(m){I(this,this.j,"Cannot redefine property: "+b)}"get"in c&&!c.get&&delete a.O[b];"set"in c&&!c.set&&delete a.P[b]}else{if(d===y)throw ReferenceError("Value not specified");
for(c=a;!(b in c.h);)if(c=M(this,c),!c){c=a;break}if(c.P&&c.P[b])return this.va=!0,c.P[b];if(c.O&&c.O[b])e&&I(this,this.j,"Cannot set property '"+b+"' of object '"+a+"' which only has a getter");else try{a.h[b]=d}catch(m){e&&I(this,this.j,"Cannot assign to read only property '"+b+"' of object '"+a+"'")}}else e&&I(this,this.j,"Can't add property '"+b+"', object is not extensible")}else e&&I(this,this.j,"Can't create property '"+b+"' on '"+a+"'")};
h.g.wb=function(){throw Error("Placeholder getter");};h.g.xb=function(){throw Error("Placeholder setter");};function K(a,b,d,c){a.g(b.h.prototype,d,a.i(c,!1),t)}function T(a,b,d,c){a.g(b.h.prototype,d,a.Xa(c),t)}function va(a){a=a.l[a.l.length-1].scope;if(!a)throw Error("No scope found");return a}function n(a,b,d){var c=!1;if(d&&d.M)c=!0;else{var e=b.body&&b.body[0];e&&e.Za&&"Literal"===e.Za.type&&"use strict"===e.Za.value&&(c=!0)}e=a.m(null);c=new wa(d,c,e);d||ha(a,c.object);G(a,b,c);return c}
function xa(a,b,d){if(!b)throw Error("parentScope required");a=d||a.m(null);return new wa(b,b.M,a)}function ya(a,b){for(var d=va(a);d&&d!==a.J;){if(b in d.object.h)return d.object.h[b];d=d.Ea}if(d===a.J&&W(a,d.object,b))return a.A(d.object,b);d=a.l[a.l.length-1].node;"UnaryExpression"===d.type&&"typeof"===d.operator||I(a,a.Ua,b+" is not defined")}
function za(a,b,d){for(var c=va(a),e=c.M;c&&c!==a.J;){if(b in c.object.h){c.object.h[b]=d;return}c=c.Ea}if(c===a.J&&(!e||W(a,c.object,b)))return a.g(c.object,b,d);I(a,a.Ua,b+" is not defined")}
function G(a,b,d){if(b.Oa)var c=b.Oa;else{c=Object.create(null);switch(b.type){case "VariableDeclaration":for(var e=0;e<b.declarations.length;e++)c[b.declarations[e].id.name]=!0;break;case "FunctionDeclaration":c[b.id.name]=b;break;case "BlockStatement":case "CatchClause":case "DoWhileStatement":case "ForInStatement":case "ForStatement":case "IfStatement":case "LabeledStatement":case "Program":case "SwitchCase":case "SwitchStatement":case "TryStatement":case "WithStatement":case "WhileStatement":var f=b.constructor,
g;for(g in b)if("loc"!==g){var m=b[g];if(m&&"object"===typeof m)if(Array.isArray(m))for(e=0;e<m.length;e++){if(m[e]&&m[e].constructor===f){var q=G(a,m[e],d);for(g in q)c[g]=q[g]}}else if(m.constructor===f)for(g in q=G(a,m,d),q)c[g]=q[g]}}b.Oa=c}for(g in c)!0===c[g]?a.g(d.object,g,void 0,ca):a.g(d.object,g,J(a,c[g],d),ca);return c}function L(a){return a.l[a.l.length-1].isConstructor}function Aa(a,b){return b[0]===w?ya(a,b[1]):a.A(b[0],b[1])}
function Ba(a,b,d){return b[0]===w?za(a,b[1],d):a.g(b[0],b[1],d)}function I(a,b,d){if(!a.J)throw void 0===d?b:d;void 0!==d&&(b=a.la(b),V(a,b,d));X(a,4,b);throw da;}
function X(a,b,d,c){if(0===b)throw TypeError("Should not unwind for NORMAL completions");var e=a.l;a:for(;0<e.length;e.pop()){var f=e[e.length-1];switch(f.node.type){case "TryStatement":f.W={type:b,value:d,label:c};return;case "CallExpression":case "NewExpression":if(3===b){f.value=d;return}if(4!==b)throw Error("Unsynatctic break/continue not rejected by Acorn");break;case "Program":f.done=!0;break a}if(1===b){if(c?f.labels&&-1!==f.labels.indexOf(c):f.pa||f.vb){e.pop();return}}else if(2===b&&(c?f.labels&&
-1!==f.labels.indexOf(c):f.pa))return}P(a,d,a.B)?(b={EvalError:EvalError,RangeError:RangeError,ReferenceError:ReferenceError,SyntaxError:SyntaxError,TypeError:TypeError,URIError:URIError},c=String(a.A(d,"name")),e=a.A(d,"message").valueOf(),b=(b[c]||Error)(e),b.stack=String(a.A(d,"stack"))):b=String(d);a.value=b;throw b;}
function Z(a,b,d){if(!a.K)throw Error("Unexpected call to createGetter");a.K=!1;d=Array.isArray(d)?d[0]:d;var c=new a.ya;c.type="CallExpression";a=new r(c,a.l[a.l.length-1].scope);a.ga=2;a.v=d;a.X=b;a.Ja=!0;a.C=[];return a}function Ca(a,b,d,c){if(!a.va)throw Error("Unexpected call to createSetter");a.va=!1;d=Array.isArray(d)?d[0]:a.Ga;var e=new a.ya;e.type="CallExpression";a=new r(e,a.l[a.l.length-1].scope);a.ga=2;a.v=d;a.X=b;a.Ja=!0;a.C=[c];return a}
function Da(a,b){return void 0===b||null===b?a.Ga:b instanceof H?b:(a=a.m(M(a,b)),a.data=b,a)}h.tb=function(){return this.J};h.ub=function(){return this.l};h.yb=function(a){this.l=a};function r(a,b){this.node=a;this.scope=b}function wa(a,b,d){this.Ea=a;this.M=b;this.object=d}function H(a){this.O=Object.create(null);this.P=Object.create(null);this.h=Object.create(null);this.ja=a}h=H.prototype;h.ja=null;h.D="Object";h.data=null;
h.toString=function(){if(!B)return"[object Interpreter.Object]";if(!(this instanceof H))return String(this);if("Array"===this.D){var a=ea;a.push(this);try{var b=[],d=this.h.length,c=!1;1024<d&&(d=1E3,c=!0);for(var e=0;e<d;e++){var f=this.h[e];b[e]=f instanceof H&&-1!==a.indexOf(f)?"...":f}c&&b.push("...")}finally{a.pop()}return b.join(",")}if("Error"===this.D){a=ea;if(-1!==a.indexOf(this))return"[object Error]";d=this;do if("name"in d.h){b=d.h.name;break}while(d=d.ja);d=this;do if("message"in d.h){c=
d.h.message;break}while(d=d.ja);a.push(this);try{b=b&&String(b),c=c&&String(c)}finally{a.pop()}return c?b+": "+c:String(b)}return null!==this.data?String(this.data):"[object "+this.D+"]"};h.valueOf=function(){return!B||void 0===this.data||null===this.data||this.data instanceof RegExp?this:this.data instanceof Date?this.data.valueOf():this.data};
k.prototype.stepArrayExpression=function(a,b,d){d=d.elements;var c=b.u||0;b.za?(this.g(b.za,c,b.value),c++):(b.za=O(this),b.za.h.length=d.length);for(;c<d.length;){if(d[c])return b.u=c,new r(d[c],b.scope);c++}a.pop();a[a.length-1].value=b.za};
k.prototype.stepAssignmentExpression=function(a,b,d){if(!b.$)return b.$=!0,b=new r(d.left,b.scope),b.fa=!0,b;if(!b.oa){b.qa||(b.qa=b.value);b.ma&&(b.aa=b.value);if(!b.ma&&"="!==d.operator&&(a=Aa(this,b.qa),b.aa=a,this.K))return b.ma=!0,Z(this,a,b.qa);b.oa=!0;"="===d.operator&&"Identifier"===d.left.type&&(b.Aa=d.left.name);return new r(d.right,b.scope)}if(b.ha)a.pop(),a[a.length-1].value=b.Na;else{var c=b.aa,e=b.value;switch(d.operator){case "=":c=e;break;case "+=":c+=e;break;case "-=":c-=e;break;
case "*=":c*=e;break;case "/=":c/=e;break;case "%=":c%=e;break;case "<<=":c<<=e;break;case ">>=":c>>=e;break;case ">>>=":c>>>=e;break;case "&=":c&=e;break;case "^=":c^=e;break;case "|=":c|=e;break;default:throw SyntaxError("Unknown assignment expression: "+d.operator);}if(d=Ba(this,b.qa,c))return b.ha=!0,b.Na=c,Ca(this,d,b.qa,c);a.pop();a[a.length-1].value=c}};
k.prototype.stepBinaryExpression=function(a,b,d){if(!b.$)return b.$=!0,new r(d.left,b.scope);if(!b.oa)return b.oa=!0,b.aa=b.value,new r(d.right,b.scope);a.pop();var c=b.aa;b=b.value;switch(d.operator){case "==":d=c==b;break;case "!=":d=c!=b;break;case "===":d=c===b;break;case "!==":d=c!==b;break;case ">":d=c>b;break;case ">=":d=c>=b;break;case "<":d=c<b;break;case "<=":d=c<=b;break;case "+":d=c+b;break;case "-":d=c-b;break;case "*":d=c*b;break;case "/":d=c/b;break;case "%":d=c%b;break;case "&":d=
c&b;break;case "|":d=c|b;break;case "^":d=c^b;break;case "<<":d=c<<b;break;case ">>":d=c>>b;break;case ">>>":d=c>>>b;break;case "in":b instanceof H||I(this,this.j,"'in' expects an object, not '"+b+"'");d=W(this,b,c);break;case "instanceof":P(this,b,this.I)||I(this,this.j,"Right-hand side of instanceof is not an object");d=c instanceof H?P(this,c,b):!1;break;default:throw SyntaxError("Unknown binary operator: "+d.operator);}a[a.length-1].value=d};
k.prototype.stepBlockStatement=function(a,b,d){var c=b.u||0;if(d=d.body[c])return b.u=c+1,new r(d,b.scope);a.pop()};k.prototype.stepBreakStatement=function(a,b,d){X(this,1,void 0,d.label&&d.label.name)};k.prototype.fb=0;
k.prototype.stepCallExpression=function(a,b,d){if(!b.ga){b.ga=1;var c=new r(d.callee,b.scope);c.fa=!0;return c}if(1===b.ga){b.ga=2;c=b.value;if(Array.isArray(c)){if(b.X=Aa(this,c),c[0]===w?b.lb="eval"===c[1]:b.v=c[0],c=b.X,this.K)return b.ga=1,Z(this,c,b.value)}else b.X=c;b.C=[];b.u=0}c=b.X;if(!b.Ja){0!==b.u&&b.C.push(b.value);if(d.arguments[b.u])return new r(d.arguments[b.u++],b.scope);if("NewExpression"===d.type){c instanceof H&&!c.$a||I(this,this.j,c+" is not a constructor");if(c===this.da)b.v=
O(this);else{var e=c.h.prototype;if("object"!==typeof e||null===e)e=this.H;b.v=this.m(e)}b.isConstructor=!0}b.Ja=!0}if(b.Ka)a.pop(),a[a.length-1].value=b.isConstructor&&"object"!==typeof b.value?b.v:b.value;else{b.Ka=!0;c instanceof H||I(this,this.j,c+" is not a function");if(a=c.node){d=n(this,a.body,c.Ea);for(var f=0;f<a.params.length;f++)this.g(d.object,a.params[f].name,b.C.length>f?b.C[f]:void 0);e=O(this);for(f=0;f<b.C.length;f++)this.g(e,f,b.C[f]);this.g(d.object,"arguments",e);(f=a.id&&a.id.name)&&
this.g(d.object,f,c);d.M||(b.v=Da(this,b.v));this.g(d.object,"this",b.v,ba);b.value=void 0;return new r(a.body,d)}if(c.eval)if(c=b.C[0],"string"!==typeof c)b.value=c;else{try{f=l(String(c),"eval"+this.fb++)}catch(m){I(this,this.U,"Invalid code: "+m.message)}c=new this.ya;c.type="EvalProgram_";c.body=f.body;p(c,d.start,d.end);d=b.lb?b.scope:this.J;d.M?d=n(this,f,d):G(this,f,d);this.value=void 0;return new r(c,d)}else if(c.Da)b.scope.M||(b.v=Da(this,b.v)),b.value=c.Da.apply(b.v,b.C);else if(c.Ha){var g=
this;f=c.Ha.length-1;f=b.C.concat(Array(f)).slice(0,f);f.push(function(m){b.value=m;g.ka=!1});this.ka=!0;b.scope.M||(b.v=Da(this,b.v));c.Ha.apply(b.v,f)}else I(this,this.j,c.D+" is not callable")}};k.prototype.stepCatchClause=function(a,b,d){if(b.N)a.pop();else return b.N=!0,a=xa(this,b.scope),this.g(a.object,d.param.name,b.Ab),new r(d.body,a)};
k.prototype.stepConditionalExpression=function(a,b,d){var c=b.ba||0;if(0===c)return b.ba=1,new r(d.test,b.scope);if(1===c){b.ba=2;if((c=!!b.value)&&d.consequent)return new r(d.consequent,b.scope);if(!c&&d.alternate)return new r(d.alternate,b.scope);this.value=void 0}a.pop();"ConditionalExpression"===d.type&&(a[a.length-1].value=b.value)};k.prototype.stepContinueStatement=function(a,b,d){X(this,2,void 0,d.label&&d.label.name)};k.prototype.stepDebuggerStatement=function(a){a.pop()};
k.prototype.stepDoWhileStatement=function(a,b,d){"DoWhileStatement"===d.type&&void 0===b.Y&&(b.value=!0,b.Y=!0);if(!b.Y)return b.Y=!0,new r(d.test,b.scope);if(!b.value)a.pop();else if(d.body)return b.Y=!1,b.pa=!0,new r(d.body,b.scope)};k.prototype.stepEmptyStatement=function(a){a.pop()};k.prototype.stepEvalProgram_=function(a,b,d){var c=b.u||0;if(d=d.body[c])return b.u=c+1,new r(d,b.scope);a.pop();a[a.length-1].value=this.value};
k.prototype.stepExpressionStatement=function(a,b,d){if(!b.N)return this.value=void 0,b.N=!0,new r(d.expression,b.scope);a.pop();this.value=b.value};
k.prototype.stepForInStatement=function(a,b,d){if(!b.qb&&(b.qb=!0,d.left.declarations&&d.left.declarations[0].init))return b.scope.M&&I(this,this.U,"for-in loop variable declaration may not have an initializer."),new r(d.left,b.scope);if(!b.na)return b.na=!0,b.ca||(b.ca=b.value),new r(d.right,b.scope);b.pa||(b.pa=!0,b.o=b.value,b.Pa=Object.create(null));if(void 0===b.Ba)a:for(;;){if(b.o instanceof H)for(b.ia||(b.ia=Object.getOwnPropertyNames(b.o.h));;){var c=b.ia.shift();if(void 0===c)break;if(Object.prototype.hasOwnProperty.call(b.o.h,
c)&&!b.Pa[c]&&(b.Pa[c]=!0,Object.prototype.propertyIsEnumerable.call(b.o.h,c))){b.Ba=c;break a}}else if(null!==b.o&&void 0!==b.o)for(b.ia||(b.ia=Object.getOwnPropertyNames(b.o));;){c=b.ia.shift();if(void 0===c)break;b.Pa[c]=!0;if(Object.prototype.propertyIsEnumerable.call(b.o,c)){b.Ba=c;break a}}b.o=M(this,b.o);b.ia=null;if(null===b.o){a.pop();return}}if(!b.Ya)if(b.Ya=!0,a=d.left,"VariableDeclaration"===a.type)b.ca=[w,a.declarations[0].id.name];else return b.ca=null,b=new r(a,b.scope),b.fa=!0,b;b.ca||
(b.ca=b.value);if(!b.ha&&(b.ha=!0,a=b.Ba,c=Ba(this,b.ca,a)))return Ca(this,c,b.ca,a);b.Ba=void 0;b.Ya=!1;b.ha=!1;if(d.body)return new r(d.body,b.scope)};k.prototype.stepForStatement=function(a,b,d){switch(b.ba){default:b.ba=1;if(d.init)return new r(d.init,b.scope);break;case 1:b.ba=2;if(d.test)return new r(d.test,b.scope);break;case 2:b.ba=3;if(d.test&&!b.value)a.pop();else return b.pa=!0,new r(d.body,b.scope);break;case 3:if(b.ba=1,d.update)return new r(d.update,b.scope)}};
k.prototype.stepFunctionDeclaration=function(a){a.pop()};k.prototype.stepFunctionExpression=function(a,b,d){a.pop();b=a[a.length-1];b.value=J(this,d,b.scope,b.Aa)};k.prototype.stepIdentifier=function(a,b,d){a.pop();if(b.fa)a[a.length-1].value=[w,d.name];else{b=ya(this,d.name);if(this.K)return Z(this,b,this.Ga);a[a.length-1].value=b}};k.prototype.stepIfStatement=k.prototype.stepConditionalExpression;
k.prototype.stepLabeledStatement=function(a,b,d){a.pop();a=b.labels||[];a.push(d.label.name);b=new r(d.body,b.scope);b.labels=a;return b};k.prototype.stepLiteral=function(a,b,d){a.pop();b=d.value;b instanceof RegExp&&(d=this.m(this.xa),U(this,d,b),b=d);a[a.length-1].value=b};
k.prototype.stepLogicalExpression=function(a,b,d){if("&&"!==d.operator&&"||"!==d.operator)throw SyntaxError("Unknown logical operator: "+d.operator);if(!b.$)return b.$=!0,new r(d.left,b.scope);if(b.oa)a.pop(),a[a.length-1].value=b.value;else if("&&"===d.operator&&!b.value||"||"===d.operator&&b.value)a.pop(),a[a.length-1].value=b.value;else return b.oa=!0,new r(d.right,b.scope)};
k.prototype.stepMemberExpression=function(a,b,d){if(!b.na)return b.na=!0,new r(d.object,b.scope);if(d.computed)if(b.rb)d=b.value;else return b.o=b.value,b.rb=!0,new r(d.property,b.scope);else b.o=b.value,d=d.property.name;a.pop();if(b.fa)a[a.length-1].value=[b.o,d];else{d=this.A(b.o,d);if(this.K)return Z(this,d,b.o);a[a.length-1].value=d}};k.prototype.stepNewExpression=k.prototype.stepCallExpression;
k.prototype.stepObjectExpression=function(a,b,d){var c=b.u||0,e=d.properties[c];if(b.o){var f=b.Aa;b.ua[f]||(b.ua[f]={});b.ua[f][e.kind]=b.value;b.u=++c;e=d.properties[c]}else b.o=this.m(this.H),b.ua=Object.create(null);if(e){var g=e.key;if("Identifier"===g.type)f=g.name;else if("Literal"===g.type)f=g.value;else throw SyntaxError("Unknown object structure: "+g.type);b.Aa=f;return new r(e.value,b.scope)}for(g in b.ua)d=b.ua[g],"get"in d||"set"in d?this.g(b.o,g,y,{configurable:!0,enumerable:!0,get:d.get,
set:d.set}):this.g(b.o,g,d.init);a.pop();a[a.length-1].value=b.o};k.prototype.stepProgram=function(a,b,d){if(a=d.body.shift())return b.done=!1,new r(a,b.scope);b.done=!0};k.prototype.stepReturnStatement=function(a,b,d){if(d.argument&&!b.N)return b.N=!0,new r(d.argument,b.scope);X(this,3,b.value)};k.prototype.stepSequenceExpression=function(a,b,d){var c=b.u||0;if(d=d.expressions[c])return b.u=c+1,new r(d,b.scope);a.pop();a[a.length-1].value=b.value};
k.prototype.stepSwitchStatement=function(a,b,d){if(!b.Y)return b.Y=1,new r(d.discriminant,b.scope);1===b.Y&&(b.Y=2,b.zb=b.value,b.Ia=-1);for(;;){var c=b.La||0,e=d.cases[c];if(b.sa||!e||e.test)if(e||b.sa||-1===b.Ia)if(e){if(!b.sa&&!b.cb&&e.test)return b.cb=!0,new r(e.test,b.scope);if(b.sa||b.value===b.zb){b.sa=!0;var f=b.u||0;if(e.consequent[f])return b.vb=!0,b.u=f+1,new r(e.consequent[f],b.scope)}b.cb=!1;b.u=0;b.La=c+1}else{a.pop();break}else b.sa=!0,b.La=b.Ia;else b.Ia=c,b.La=c+1}};
k.prototype.stepThisExpression=function(a){a.pop();a[a.length-1].value=ya(this,"this")};k.prototype.stepThrowStatement=function(a,b,d){if(b.N)I(this,b.value);else return b.N=!0,new r(d.argument,b.scope)};
k.prototype.stepTryStatement=function(a,b,d){if(!b.mb)return b.mb=!0,new r(d.block,b.scope);if(b.W&&4===b.W.type&&!b.pb&&d.handler)return b.pb=!0,a=new r(d.handler,b.scope),a.Ab=b.W.value,b.W=void 0,a;if(!b.ob&&d.finalizer)return b.ob=!0,new r(d.finalizer,b.scope);a.pop();b.W&&X(this,b.W.type,b.W.value,b.W.label)};
k.prototype.stepUnaryExpression=function(a,b,d){if(!b.N)return b.N=!0,a=new r(d.argument,b.scope),a.fa="delete"===d.operator,a;a.pop();var c=b.value;switch(d.operator){case "-":c=-c;break;case "+":c=+c;break;case "!":c=!c;break;case "~":c=~c;break;case "delete":d=!0;if(Array.isArray(c)){var e=c[0];e===w&&(e=b.scope);c=String(c[1]);try{delete e.h[c]}catch(f){b.scope.M?I(this,this.j,"Cannot delete property '"+c+"' of '"+e+"'"):d=!1}}c=d;break;case "typeof":c=c&&"Function"===c.D?"function":typeof c;
break;case "void":c=void 0;break;default:throw SyntaxError("Unknown unary operator: "+d.operator);}a[a.length-1].value=c};
k.prototype.stepUpdateExpression=function(a,b,d){if(!b.$)return b.$=!0,a=new r(d.argument,b.scope),a.fa=!0,a;b.ra||(b.ra=b.value);b.ma&&(b.aa=b.value);if(!b.ma){var c=Aa(this,b.ra);b.aa=c;if(this.K)return b.ma=!0,Z(this,c,b.ra)}if(b.ha)a.pop(),a[a.length-1].value=b.Na;else{c=Number(b.aa);if("++"===d.operator)var e=c+1;else if("--"===d.operator)e=c-1;else throw SyntaxError("Unknown update expression: "+d.operator);d=d.prefix?e:c;if(c=Ba(this,b.ra,e))return b.ha=!0,b.Na=d,Ca(this,c,b.ra,e);a.pop();
a[a.length-1].value=d}};k.prototype.stepVariableDeclaration=function(a,b,d){d=d.declarations;var c=b.u||0,e=d[c];b.ab&&e&&(za(this,e.id.name,b.value),b.ab=!1,e=d[++c]);for(;e;){if(e.init)return b.u=c,b.ab=!0,b.Aa=e.id.name,new r(e.init,b.scope);e=d[++c]}a.pop()};k.prototype.stepWithStatement=function(a,b,d){if(b.na)if(b.nb)a.pop();else return b.nb=!0,a=xa(this,b.scope,b.value),new r(d.body,a);else return b.na=!0,new r(d.object,b.scope)};k.prototype.stepWhileStatement=k.prototype.stepDoWhileStatement;
D.Interpreter=k;k.prototype.step=k.prototype.Qa;k.prototype.run=k.prototype.bb;k.prototype.appendCode=k.prototype.gb;k.prototype.createObject=k.prototype.la;k.prototype.createObjectProto=k.prototype.m;k.prototype.createAsyncFunction=k.prototype.Xa;k.prototype.createNativeFunction=k.prototype.i;k.prototype.getProperty=k.prototype.A;k.prototype.setProperty=k.prototype.g;k.prototype.nativeToPseudo=k.prototype.ta;k.prototype.pseudoToNative=k.prototype.L;k.prototype.getGlobalScope=k.prototype.tb;
k.prototype.getStateStack=k.prototype.ub;k.prototype.setStateStack=k.prototype.yb;k.VALUE_IN_DESCRIPTOR=y;

			sdProgram.Interpreter = Interpreter;
		}

		/*function CompileDemo()
		{
			trace( 'Starting CompileDemo for sdProgram class...' );
			
			let program = sdProgram.StartProgram( `

				trace( 'CompileDemo: ' + 1 );
			
				Sleep( 1000 );
			
				trace( 'CompileDemo: ' + 2 );
			
				Sleep( 1000 );
			
				trace( 'CompileDemo: ' + 3 );
			
				Sleep( 1000 );

			`, { Sleep: sdProgram.Sleep, trace: trace, onError: trace, onProgramEnd: ()=>{trace('Program ended');} } );
			
			let inter = setInterval( ()=>
			{
				program.Think( 16 / 1000 * 30 ); // Should be equal to GSPEED, speed of execution
				
				if ( program.crashed || program.ended )
				clearInterval( inter );
			
			}, 16 );
		}

		setTimeout( CompileDemo, 5000 );*/
		
	}
	
	static async Sleep( ms, callback )
	{
		sdTimer.ExecuteWithDelay( ( timer )=>{

			callback();

		}, ms );
	}
	
	static GetShellObjectByEntity( ent, program ) // Entity -> Shell object
	{
		if ( ent === null )
		return null;
		
		if ( sdProgram.last_frame !== sdWorld.frame )
		{
			sdProgram.last_frame = sdWorld.frame;
			//sdProgram.shell_object_by_program = new Map();
			sdProgram.shell_object_by_program.clear();
		}
		
		let program_map = sdProgram.shell_object_by_program.get( program );
		
		if ( !program_map )
		{
			program_map = new Map();
			sdProgram.shell_object_by_program.set( program, program_map );
		}
		
		let obj = program_map.get( ent );
		
		if ( !obj )
		{
			obj = { _net_id: ent._net_id, x: ent.x + ( ent._hitbox_x1 + ent._hitbox_x2 ) / 2, y: ent.y + ( ent._hitbox_y1 + ent._hitbox_y2 ) / 2 };
			
			program_map.set( ent, obj );
			
			if ( ent.is( sdBeacon ) )
			obj.id = ent.biometry;

			if ( ent.is( sdBot ) )
			obj.carrying = sdProgram.GetShellObjectByEntity( ent.carrying, program );

			obj.entity_class = ent.GetClass();
			
			obj.class = ent.clss;
			obj.kind = ent.kind;
			obj.material = ent.material;
			obj.type = ent.type;

			obj.is_player = ( ent.IsPlayerClass() && ent._socket ) ? true : false;

			if ( obj.is_player )
			obj.title = ent.title;

			obj.hitpoints = ( ent._hea || ent.hea || 0 );
			obj.hitpoints_max = ( ent._hmax || ent.hmax || 0 );

			obj.matter = ( ent._matter || ent.matter || 0 );
			obj.matter_max = ( ent._matter_max || ent.matter_max || 0 );
		}
		
		//obj = program.interpreter.nativeToPseudo( obj );
		
		return obj;
	}
	static GetEntityByShellObject( obj )
	{
		if ( obj === null || obj === undefined )
		return null;
	
		return sdEntity.GetObjectByClassAndNetId( obj.entity_class, obj._net_id );
	}
	
	static StartProgram( code, method_interface={} )
	{
		function initInterface( interpreter, globalObject )
		{
			for ( let p in method_interface )
			{
				let value = method_interface[ p ];

				if ( value instanceof Function )
				{
					if ( value.__proto__ === sdProgram.AsyncFunction )
					value = interpreter.createAsyncFunction( value );
					else
					value = interpreter.createNativeFunction( value );
				}

				interpreter.setProperty( globalObject, p, value );
			}
		}
		
		let interpreter = new sdProgram.Interpreter( code, initInterface );
		
		let next_memory_check = 0;
		
		let obj = {
			interpreter: interpreter,
			step_timer: 0,
			crashed: false,
			ended: false,
			report_exec_position_to: null,
			calculations_speed: 20, // 1 is quite slow when it comes to 30 item loops and simple actions
			Think: ( GSPEED )=>
			{
				obj.step_timer -= GSPEED * obj.calculations_speed;
				
				while ( obj.step_timer <= 0 )
				{
					obj.step_timer += 1;
					
					if ( interpreter.ended || interpreter.crashed )
					{
						obj.step_timer = 30 * 3;
					}
					else
					{
						try
						{
							//if ( interpreter.run() ) 
							if ( interpreter.step() ) 
							{
								next_memory_check++;
								
								if ( obj.report_exec_position_to )
								{
									let stack = interpreter.getStateStack();
									obj.report_exec_position_to( 'line ' + stack[ stack.length - 1 ].node.loc.start.line + ', column ' + stack[ stack.length - 1 ].node.loc.start.column );
								}
								
								if ( next_memory_check > 1000 )
								{
									next_memory_check = 0;
									
									if ( interpreter.getStateStack().length > 1000 )
									{
										// Likely a memory bomb
										
										obj.crashed = true;
							
										if ( method_interface.onError )
										method_interface.onError( 'Out of memory' );
									}
								}
							}
							else
							{
								interpreter.ended = true;
								
								if ( method_interface.onProgramEnd )
								method_interface.onProgramEnd();
							}
						}
						catch ( e )
						{
							obj.crashed = true;
								
							if ( method_interface.onError )
							method_interface.onError( e.message );
						}
					}
				}
			}
		};
		
		return obj;
	}
	
	static PrepareFunctionDescriptions( obj )
	{
		if ( sdWorld.is_server && !sdWorld.is_singleplayer )
		return 'Not applicable';
		
		let parts = [];
		for ( let prop in obj )
		{
			let s = obj[ prop ].toString();
			
			parts.push( prop + s.substring( s.indexOf( '(' ), s.indexOf( ')' ) + 1 ) );
		}
		return parts.join( '\n' );
	}
	
	/*
	static CreateNewProgram( test=false )
	{
		if ( !test )
		return []; // Will be JSON compatible
		else
		{
			// Sample. Kind of like LISP?
			return [
				'actions_list', // Aka scope
				[
					'function',
					[ // action arguments
						'main',
						[], // function arguments, perhaps array of consts or array of arrays of [ const, default_value ]
						[
							'actions_list', // Aka scope
							// nested actions

							[
								'let',
								[
									'x',
									10
								]
							],
							[ 
								'set',
								[ // action arguments
									'x',
									[ // nested actions or maybe even just single const
										'add'
										[
											'x',
											1
										]
									]
								]
							]
						]
					]
				],
				[
					'exec',
					[
						'main',
						[
							0,
							1,
							2
						]
					]
				]
			];
		}
		
	}
	
	static CreateNewMemory()
	{
		return {}; // Will be JSON compatible
	}
	
	static DeepCopy( obj )
	{
		return JSON.parse( JSON.stringify( obj ) ); // Lazy deep copy, can be optimized
	}
	
	static StartProgramExecution( program, memory, global_methods_object )
	{
		 // Will be JSON compatible
		let executor = {
			position_stack: [], // Points towards item ID that is being executed
			scope_variables: [ memory, global_methods_object, {} ], // { Speak, NotifyOthers, SetMessageHandler }
			program: sdProgram.DeepCopy( program ), // Changes overtime
			complete: false
		};
		
		return executor;
	}
	static ProgressExecution( executor, steps=1 )
	{
		stepper:
		for ( let s = 0; s < steps; s++ )
		{
			if ( executor.complete )
			break;
			
			let parent_operation_ptr = null;
			let operation_id = -1;
			let operation_ptr = executor.program;
			
			for ( let p = 0; p < executor.position_stack.length; p++ )
			{
				let id = executor.position_stack[ p ];
				
				if ( id < operation_ptr.length )
				{
					parent_operation_ptr = operation_ptr;
					operation_id = id;
					
					operation_ptr = operation_ptr[ id ];
				}
				else
				throw new Error( 'Non-existing offset' );
			}
			
			let current_scope_variables = executor.scope_variables[ executor.scope_variables.length - 1 ];
			
			let operation_name = operation_ptr[ 0 ];
			
			let return_value = undefined;
			
			switch ( operation_name )
			{
				case 'function':
				{
					if ( operation_ptr.length === 3 ) // 3 means it has name
					{
						let function_name = operation_ptr[ 0 ];
						let function_arguments = operation_ptr[ 1 ];
						let function_body = operation_ptr[ 2 ];
						
						return_value = [ function_arguments, function_body ];
						
						if ( function_name !== '' )
						current_scope_variables[ function_name ] = return_value;
					}
					else
					throw new Error();
				}
				break;
				case 'actions_list':
				//case 'actions_list_started':
				{
					for ( let i = 1; i < operation_ptr.length; i++ )
					if ( operation_ptr[ i ] instanceof Array )
					{
						executor.position_stack.push( i );
						continue stepper;
					}
					
					if ( executor.scope_variables.length <= 2 )
					throw new Error( 'Scope counter is off' );
					
					executor.scope_variables.pop();
				}
				break;
				default:
					throw new Error( 'Unknown operation: ' + operation_ptr[ 0 ] );
				break;
			}
			
			if ( operation_id !== -1 )
			parent_operation_ptr[ operation_id ] = return_value;
			else
			executor.complete = true;
		}
	}*/
}
export default sdProgram;