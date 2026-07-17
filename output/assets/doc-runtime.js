//#region node_modules/vanilla-signal/dist/index.js
var e = typeof window < "u" && window.__SIGNAL_DEVTOOLS__ || null, t = Symbol("iterate"), n = Symbol("store-version"), r = Symbol("signal.raw"), i = Symbol("signal.store"), a = null, o = null, s = 0, c = 0, l = !1, u = !1, d = !1, ee = 0, f = /* @__PURE__ */ new Set(), p = /* @__PURE__ */ new Set(), te = Promise.resolve();
function m(t, n) {
	e?.emit?.(t, n);
}
function ne(e) {
	typeof queueMicrotask == "function" ? queueMicrotask(e) : te.then(e);
}
function re(e) {
	return typeof e == "object" && !!e;
}
function ie(e) {
	if (!re(e)) return !1;
	if (Array.isArray(e)) return !0;
	let t = Object.getPrototypeOf(e);
	return t === Object.prototype || t === null;
}
function h(e) {
	return typeof e == "function";
}
function g(e) {
	return h(e) ? e() : e;
}
function ae(e, t = "owner") {
	let n = {
		type: t,
		parent: e,
		owned: [],
		cleanups: [],
		disposed: !1,
		errorHandler: null
	};
	return e && !e.disposed && e.owned.push(n), n;
}
function oe(e, t) {
	if (e?.disposed) return;
	let n = o;
	o = e;
	try {
		return t();
	} catch (t) {
		if (!ue(t, e)) throw t;
		return;
	} finally {
		o = n;
	}
}
function se(e) {
	let t = e.cleanups.splice(0);
	for (let n = t.length - 1; n >= 0; n--) try {
		t[n]();
	} catch (t) {
		m("cleanup:error", {
			owner: e,
			error: t
		}), console.error("signal cleanup error:", t);
	}
}
function ce(e) {
	if (!e || e.disposed) return;
	e.disposed = !0;
	let t = e.owned.splice(0);
	for (let e = t.length - 1; e >= 0; e--) _(t[e]);
	se(e), le(e), m("owner:dispose", { owner: e });
}
function le(e) {
	let t = e?.parent || e?.owner;
	if (!t?.owned) return;
	let n = t.owned.indexOf(e);
	n >= 0 && t.owned.splice(n, 1);
}
function ue(e, t = o) {
	let n = t;
	for (; n;) {
		if (typeof n.errorHandler == "function") return n.errorHandler(e), !0;
		n = n.parent;
	}
	return m("error:unhandled", { error: e }), !1;
}
function de(e) {
	return e.equals === !1 ? () => !1 : e.equals || Object.is;
}
function fe(e) {
	!a || a.disposed || (e.observers || (e.observers = /* @__PURE__ */ new Set()), e.observers.has(a) || (e.observers.add(a), a.sources.add(e)));
}
function pe(e) {
	if (!e.observers || e.observers.size === 0) return;
	let t = Array.from(e.observers);
	for (let e = 0; e < t.length; e++) me(t[e]);
}
function me(e) {
	if (!(!e || e.disposed)) {
		if (e.type === "memo") {
			if (e.state === 1) return;
			e.state = 1, e.observers?.size > 0 && Te(e);
			return;
		}
		he(e);
	}
}
function he(e) {
	!e || e.disposed || e.queued || (e.queued = !0, c > 0 ? (p.add(e), _e()) : (f.add(e), ge()));
}
function ge() {
	s > 0 || u || l || (u = !0, ne(ye));
}
function _e() {
	s > 0 || d || (d = !0, (typeof requestIdleCallback == "function" ? requestIdleCallback : (e) => setTimeout(e, 0))(be));
}
function ve(e) {
	let t = Array.from(e);
	return e.clear(), t.sort((e, t) => t.priority - e.priority || e.id - t.id), t;
}
function ye() {
	if (!l) {
		u = !1, l = !0;
		try {
			let e = 0;
			for (; f.size > 0;) {
				if (++e > 1e5) throw Error("Possible infinite reactive update loop");
				let t = ve(f);
				for (let e = 0; e < t.length; e++) {
					let n = t[e];
					n.queued = !1, n.disposed || v(n);
				}
			}
		} finally {
			l = !1, f.size > 0 && ge();
		}
	}
}
function be() {
	if (d = !1, p.size === 0) return;
	let e = ve(p);
	x(() => {
		for (let t = 0; t < e.length; t++) {
			let n = e[t];
			n.queued = !1, n.disposed || v(n);
		}
	});
}
function xe(e) {
	e.sources.forEach((t) => {
		t.observers?.delete(e);
	}), e.sources.clear();
}
function Se(e, t = {}) {
	let n = o, r = {
		id: ++ee,
		type: t.type || "effect",
		fn: e,
		owner: n,
		owned: [],
		cleanups: [],
		sources: /* @__PURE__ */ new Set(),
		observers: t.type === "memo" ? /* @__PURE__ */ new Set() : null,
		disposed: !1,
		queued: !1,
		running: !1,
		state: 1,
		initialized: !1,
		value: t.value,
		priority: t.priority || 0,
		equals: t.equals || Object.is,
		dispose() {
			_(r);
		}
	};
	return n && !n.disposed && n.owned.push(r), r;
}
function _(e) {
	if (!e || e.disposed) return;
	e.disposed = !0, e.queued = !1, f.delete(e), p.delete(e), e.sources && xe(e);
	let t = e.owned?.splice(0) || [];
	for (let e = t.length - 1; e >= 0; e--) _(t[e]);
	se(e), e.observers?.clear(), le(e), m("computation:dispose", { computation: e });
}
function Ce(e) {
	if (e.disposed) return e.value;
	if (e.running) throw Error("Circular dependency detected in reactive computation");
	xe(e), we(e);
	let t = a, n = o;
	a = e, o = e, e.running = !0;
	try {
		let t = e.fn(e.value);
		return e.value = t, e.initialized = !0, e.state = 0, m(`${e.type}:run`, { computation: e }), t;
	} catch (t) {
		if (e.state = 0, m(`${e.type}:error`, {
			computation: e,
			error: t
		}), !ue(t, e)) throw t;
		return e.value;
	} finally {
		e.running = !1, a = t, o = n;
	}
}
function we(e) {
	let t = e.owned.splice(0);
	for (let e = t.length - 1; e >= 0; e--) _(t[e]);
	se(e);
}
function v(e) {
	Ce(e);
}
function Te(e) {
	if (e.state === 0) return e.value;
	let t = e.value, n = e.initialized, r = Ce(e), i = !n || !e.equals(t, r);
	return n && i && pe(e), e.value;
}
function y(e, t = {}) {
	let n = e, r = {
		observers: /* @__PURE__ */ new Set(),
		equals: de(t)
	};
	function i() {
		return fe(r), n;
	}
	function a(e) {
		let t = typeof e == "function" ? e(n) : e;
		if (r.equals(n, t)) return n;
		let i = n;
		return n = t, m("signal:update", {
			previous: i,
			next: t
		}), pe(r), n;
	}
	return i.peek = () => n, i.toJSON = () => n, [i, a];
}
function b(e, t = {}) {
	let n = Se(e, {
		type: "effect",
		priority: t.priority || 0
	});
	return t.defer ? he(n) : v(n), n;
}
function x(e) {
	s++;
	try {
		return e();
	} finally {
		s--, s === 0 && (ge(), _e());
	}
}
function S(e) {
	let t = e ? x(e) : void 0;
	return ye(), t;
}
function Ee(e) {
	return o && o.cleanups.push(e), e;
}
function De(e) {
	let t = ae(o, "root"), n = () => ce(t), r = oe(t, () => e?.(n));
	return r === void 0 ? {
		dispose: n,
		run: (e) => oe(t, e)
	} : r;
}
var Oe = /* @__PURE__ */ new WeakMap(), ke = /* @__PURE__ */ new WeakMap(), Ae = /* @__PURE__ */ new WeakMap(), je = /* @__PURE__ */ new WeakMap(), Me = /* @__PURE__ */ new WeakMap();
function Ne(e) {
	let t = Oe.get(e);
	return t || (t = { deps: /* @__PURE__ */ new Map() }, Oe.set(e, t)), t;
}
function Pe(e, t) {
	let n = Ne(e), r = n.deps.get(t);
	return r || (r = y(0, { equals: !1 }), n.deps.set(t, r)), r;
}
function C(e, t) {
	Pe(e, t)[0]();
}
function w(e, t) {
	let n = Ne(e).deps.get(t);
	n && n[1]((e) => e + 1);
}
function T(e) {
	return Me.get(e) || e;
}
function Fe(e) {
	if (typeof e == "symbol") return !1;
	let t = String(e);
	if (t === "") return !1;
	let n = Number(t);
	return Number.isInteger(n) && n >= 0 && n < 4294967295 && String(n) === t;
}
var Ie = /* @__PURE__ */ new Set([
	"copyWithin",
	"fill",
	"pop",
	"push",
	"reverse",
	"shift",
	"sort",
	"splice",
	"unshift"
]);
function E(e, t, n) {
	for (let r = t; r < n; r++) w(e, String(r));
}
function Le(e, r, i, a, o) {
	let s = Math.max(a, o);
	r === "push" ? E(e, a, o) : r === "pop" ? w(e, String(o)) : r === "splice" ? E(e, Math.max(0, Number(i[0]) || 0), s) : E(e, 0, s), a !== o && w(e, "length"), w(e, t), w(e, n);
}
function Re(e, t, n, r) {
	let i = Array.prototype[n];
	return Ie.has(n) ? (...a) => {
		if (r) return console.warn(`[signal] Cannot call mutating array method "${n}" on readonly store`), n === "sort" || n === "reverse" ? t : void 0;
		let o = e.length, s;
		return x(() => {
			s = i.apply(e, a.map(T)), Le(e, n, a, o, e.length);
		}), s === e ? t : s;
	} : (...e) => i.apply(t, e);
}
function ze(e, a, o) {
	if (e = T(e), !ie(e)) return e;
	let s = o ? je : a ? Ae : ke;
	if (s.has(e)) return s.get(e);
	let c = new Proxy(e, {
		get(e, s, c) {
			if (s === r) return e;
			if (s === i) return !0;
			if (s === "__raw") return e;
			if (s === "__isStore") return !0;
			if (s === "__version__") return C(e, n), Pe(e, n)[0]();
			if (Array.isArray(e) && typeof s == "string" && s in Array.prototype && typeof Reflect.get(e, s, c) == "function") return Re(e, c, s, o);
			s === Symbol.iterator && C(e, t), typeof s != "symbol" && C(e, s);
			let l = Reflect.get(e, s, c);
			return a && ie(l) ? ze(l, !0, o) : l;
		},
		set(e, r, i, a) {
			if (o) return console.warn(`[signal] Cannot set "${String(r)}" on readonly store`), !0;
			let s = Array.isArray(e) ? e.length : 0, c = Object.prototype.hasOwnProperty.call(e, r), l = e[r], u = T(i), d = Reflect.set(e, r, u, a);
			return !d || Object.is(l, u) || x(() => {
				if (w(e, r), w(e, n), c || w(e, t), Array.isArray(e)) if (r === "length") {
					let n = e.length;
					E(e, n, s), w(e, "length"), w(e, t);
				} else Fe(r) && e.length !== s && (w(e, "length"), w(e, t));
			}), d;
		},
		deleteProperty(e, r) {
			if (o) return console.warn(`[signal] Cannot delete "${String(r)}" on readonly store`), !0;
			if (!Object.prototype.hasOwnProperty.call(e, r)) return !0;
			let i = Array.isArray(e) ? e.length : 0, a = Reflect.deleteProperty(e, r);
			return a && x(() => {
				w(e, r), w(e, t), w(e, n), Array.isArray(e) && e.length !== i && w(e, "length");
			}), a;
		},
		has(e, t) {
			return C(e, t), Reflect.has(e, t);
		},
		ownKeys(e) {
			return C(e, t), Reflect.ownKeys(e);
		}
	});
	return s.set(e, c), Me.set(c, e), c;
}
function D(e = {}) {
	return ze(e, !0, !1);
}
function Be() {
	return typeof document < "u";
}
function O(e) {
	return Be() && e instanceof Node;
}
function k(e) {
	if (e = g(e), e == null || e === !1 || e === !0) return [];
	if (Array.isArray(e)) {
		let t = [];
		return e.forEach((e) => {
			t.push(...k(e));
		}), t;
	}
	return O(e) && e.nodeType === 11 ? Array.from(e.childNodes) : O(e) ? [e] : [document.createTextNode(String(e))];
}
function A(e) {
	e.forEach((e) => e.parentNode?.removeChild(e));
}
function j(e, t, n = null) {
	let r = [], i = (t) => {
		let i = k(t);
		if (r.length === 1 && i.length === 1 && r[0].nodeType === 3 && i[0].nodeType === 3) {
			r[0].data = i[0].data;
			return;
		}
		A(r), i.forEach((t) => e.insertBefore(t, n)), r = i;
	};
	if (h(t)) {
		let e = b(() => i(t()));
		return () => {
			e.dispose(), A(r);
		};
	}
	return i(t), () => A(r);
}
function M(e, t, n) {
	return b(() => {
		let r = g(n);
		r == null || r === !1 ? e.removeAttribute(t) : r === !0 ? e.setAttribute(t, "") : e.setAttribute(t, String(r));
	});
}
function N(e, t, n) {
	return b(() => {
		e.classList.toggle(t, !!g(n));
	});
}
var Ve = /* @__PURE__ */ new Set([
	"svg",
	"g",
	"path",
	"circle",
	"ellipse",
	"line",
	"polyline",
	"polygon",
	"rect",
	"defs",
	"clipPath",
	"linearGradient",
	"radialGradient",
	"stop",
	"text",
	"tspan",
	"use",
	"symbol",
	"view"
]);
function He(e) {
	return !/^on[A-Z]/.test(e) && !/^on[a-z]/.test(e) ? null : e.slice(2).toLowerCase();
}
function Ue(e, t) {
	if (t == null) {
		e.removeAttribute("style");
		return;
	}
	if (typeof t == "string") {
		e.style.cssText = t;
		return;
	}
	Object.keys(t).forEach((n) => {
		let r = g(t[n]);
		e.style[n] = r == null ? "" : String(r);
	});
}
function We(e, t) {
	Object.keys(t || {}).forEach((n) => {
		e.classList.toggle(n, !!g(t[n]));
	});
}
function Ge(e, t) {
	e && (typeof e == "function" ? e(t) : typeof e == "object" && (e.current = t));
}
function Ke(e, t, n) {
	if (t === "children" || t === "key") return;
	if (t === "ref") {
		Ge(n, e);
		return;
	}
	if (t === "class" || t === "className") {
		let t = n == null ? "" : String(n);
		e.namespaceURI === "http://www.w3.org/2000/svg" ? e.setAttribute("class", t) : e.className = t;
		return;
	}
	if (t === "classList") {
		We(e, n);
		return;
	}
	if (t === "style") {
		Ue(e, n);
		return;
	}
	let r = t === "htmlFor" ? "for" : t;
	if (n == null || n === !1) {
		if (e.removeAttribute(r), t in e && typeof e[t] != "function") try {
			e[t] = n == null ? "" : !1;
		} catch {}
		return;
	}
	if (n === !0) {
		if (e.setAttribute(r, ""), t in e) try {
			e[t] = !0;
		} catch {}
		return;
	}
	if (t in e && r !== "list" && r !== "type") try {
		e[t] = n;
		return;
	} catch {}
	e.setAttribute(r, String(n));
}
function qe(e, t, n) {
	let r = He(t);
	if (r && typeof n == "function") {
		e.addEventListener(r, n), Ee(() => e.removeEventListener(r, n));
		return;
	}
	h(n) && t !== "ref" && t !== "children" && t !== "key" ? b(() => Ke(e, t, n())) : Ke(e, t, n);
}
function Je(e, t) {
	return t.length > 0 ? t.length === 1 ? t[0] : t : e?.children;
}
function Ye(e, t, ...n) {
	t = t || {};
	let r = Je(t, n);
	if (typeof e == "function") return e(Object.assign({}, t, { children: r }));
	let i = Ve.has(e) ? document.createElementNS("http://www.w3.org/2000/svg", e) : document.createElement(e);
	return Object.keys(t).forEach((e) => {
		e !== "children" && qe(i, e, t[e]);
	}), r !== void 0 && j(i, r), i;
}
function Xe(e) {
	return Array.isArray(e) && Array.isArray(e.raw);
}
function Ze(e) {
	if (h(e)) {
		let t = document.createDocumentFragment(), n = document.createComment("jui-dynamic");
		t.append(n);
		let r = null;
		return b(() => {
			r?.(), r = j(n.parentNode, e(), n);
		}), Ee(() => r?.()), t;
	}
	if (O(e)) return e;
	if (Array.isArray(e)) {
		let t = document.createDocumentFragment();
		return k(e).forEach((e) => t.append(e)), t;
	}
	return document.createTextNode(e == null ? "" : String(e));
}
function Qe(e, t) {
	let n = "", r = /* @__PURE__ */ new Map(), i = /* @__PURE__ */ new Map();
	for (let a = 0; a < e.length; a++) if (n += e[a], a < t.length) {
		let t = e[a].match(/([:@A-Za-z_][-:@A-Za-z0-9_.]*)\s*=\s*(['"]?)$/);
		if (t) {
			let e = `__JUI_ATTR_${a}__`;
			r.set(e, a), i.set(a, t[1]), n += t[2] ? e : `"${e}"`;
		} else n += `<jui-slot data-jui-slot="${a}"></jui-slot>`;
	}
	let a = document.createElement("template");
	a.innerHTML = n.trim();
	let o = a.content;
	return o.querySelectorAll("jui-slot").forEach((e) => {
		let n = Number(e.getAttribute("data-jui-slot"));
		e.replaceWith(Ze(t[n]));
	}), o.querySelectorAll("*").forEach((e) => {
		Array.from(e.attributes).forEach((n) => {
			if (!r.has(n.value)) return;
			let a = r.get(n.value);
			e.removeAttribute(n.name), qe(e, i.get(a) || n.name, t[a]);
		});
	}), o.childNodes.length === 1 ? o.firstChild : Array.from(o.childNodes);
}
function P(e, t, n) {
	return Xe(e) ? Qe(e, Array.prototype.slice.call(arguments, 1)) : Ye(e, n === void 0 ? t : Object.assign({}, t, { key: n }));
}
//#endregion
//#region node_modules/vanilla-signal-i18n/dist/index.js
var $e = /\{([A-Za-z0-9_.-]+)\}/g;
function F(e) {
	if (!e || typeof e != "object" || Array.isArray(e)) return !1;
	let t = Object.getPrototypeOf(e);
	return t === Object.prototype || t === null;
}
function I(e = {}) {
	if (!F(e)) return {};
	let t = {};
	for (let [n, r] of Object.entries(e)) F(r) ? t[n] = I(r) : Array.isArray(r) ? t[n] = r.slice() : t[n] = r;
	return t;
}
function L(e, t) {
	let n = I(e);
	for (let [e, r] of Object.entries(t || {})) F(r) && F(n[e]) ? n[e] = L(n[e], r) : n[e] = F(r) ? I(r) : r;
	return n;
}
function et(e = {}) {
	let t = {};
	if (!F(e)) return t;
	for (let [n, r] of Object.entries(e)) t[R(n)] = I(r);
	return t;
}
function R(e, t = "en") {
	return typeof e == "string" && e.trim().replace(/_/g, "-").toLowerCase() || t;
}
function tt(e) {
	return String(e || "").split("-")[0];
}
function nt(e) {
	return Array.from(new Set(e.filter(Boolean)));
}
function rt(e, t) {
	let n = R(e, t), r = R(t, "en");
	return nt([
		n,
		tt(n),
		r,
		tt(r)
	]);
}
function it(e, t) {
	if (!(!e || typeof t != "string")) return Object.prototype.hasOwnProperty.call(e, t) ? e[t] : t.split(".").reduce((e, t) => {
		if (e != null) return e[t];
	}, e);
}
function at(e, t = {}, n = {}) {
	let r = typeof e == "function" ? e(t || {}, n) : e;
	return r == null ? "" : typeof r == "string" ? !t || typeof t != "object" ? r : r.replace($e, (e, n) => {
		let r = it(t, n);
		return r == null ? e : String(r);
	}) : String(r);
}
function ot(e = "en") {
	return typeof navigator > "u" ? e : R((Array.isArray(navigator.languages) ? navigator.languages : [])[0] || navigator.language || e, e);
}
function st() {
	if (typeof document > "u") return null;
	let e = document.documentElement?.getAttribute("lang");
	return e ? R(e) : null;
}
function ct(e = {}) {
	let t = R(e.fallbackLocale, "en");
	return e.locale ? R(e.locale, t) : R(st() || ot(t), t);
}
function lt() {
	return typeof navigator > "u" || navigator.language.toLowerCase().startsWith("en") ? "en" : "zh";
}
function ut() {
	if (typeof document > "u") return lt();
	let e = document.documentElement.getAttribute("lang");
	if (e) switch (e.substring(0, 2).toLowerCase()) {
		case "en": return "en";
		case "zh": return "zh";
		default: return "en";
	}
	return lt();
}
var dt = class {
	constructor(e = {}) {
		let t = R(e.fallbackLocale, "en"), n = et(e.messages || e.languages || {}), [r, i] = y(ct({
			locale: e.locale,
			fallbackLocale: t
		})), [a, o] = y(t), [s, c] = y(0, { equals: !1 });
		this._locale = r, this._setLocaleSignal = i, this._fallbackLocale = a, this._setFallbackSignal = o, this._version = s, this._setVersion = c, this._messages = n, this._listeners = /* @__PURE__ */ new Set(), this._missing = typeof e.missing == "function" ? e.missing : null, this._warnMissing = e.warnMissing === !0;
	}
	getLocaleSignal() {
		return this._locale;
	}
	getLocale() {
		return this._locale();
	}
	setLocale(e) {
		let t = this._locale.peek ? this._locale.peek() : this._locale(), n = R(e, this.getFallbackLocale());
		return t === n ? this : (this._setLocaleSignal(n), this._notify({
			type: "locale",
			locale: n,
			previousLocale: t
		}), this);
	}
	getFallbackLocale() {
		return this._fallbackLocale();
	}
	setFallbackLocale(e) {
		let t = this._fallbackLocale.peek ? this._fallbackLocale.peek() : this._fallbackLocale(), n = R(e, "en");
		return t === n ? this : (this._setFallbackSignal(n), this._notify({
			type: "fallback-locale",
			locale: n,
			previousLocale: t
		}), this);
	}
	setMessages(e, t = {}) {
		let n = et(e);
		return this._messages = t.merge ? L(this._messages, n) : n, this._touch(), this._notify({
			type: "messages",
			messages: this._messages
		}), this;
	}
	setLanguages(e) {
		return this.setMessages(e);
	}
	addMessages(e, t, n = {}) {
		let r = R(e, this.getFallbackLocale()), i = n.merge !== !1, a = this._messages[r] || {};
		return this._messages = {
			...this._messages,
			[r]: i ? L(a, t) : I(t)
		}, this._touch(), this._notify({
			type: "messages",
			locale: r,
			messages: this._messages[r]
		}), this;
	}
	getMessages(e) {
		if (this._version(), !e) return this._messages;
		let t = R(e, this.getFallbackLocale());
		return this._messages[t] || {};
	}
	getLanguages() {
		return this.getMessages();
	}
	has(e, t = {}) {
		return this.resolve(e, t).found;
	}
	resolve(e, t = {}) {
		this._version();
		let n = R(t.locale || this.getLocale(), this.getFallbackLocale()), r = rt(n, R(t.fallbackLocale || this.getFallbackLocale(), "en"));
		for (let t of r) {
			let n = it(this._messages[t], e);
			if (n !== void 0) return {
				found: !0,
				key: e,
				locale: t,
				value: n
			};
		}
		return {
			found: !1,
			key: e,
			locale: n,
			value: e
		};
	}
	t(e, t = {}, n = {}) {
		let r = typeof n == "string" ? { locale: n } : n || {}, i = this.resolve(e, r);
		return i.found ? at(i.value, t, {
			key: e,
			locale: i.locale,
			i18n: this
		}) : this._handleMissing(e, t, r, i);
	}
	createTranslator(e, t = {}) {
		let n = e ? `${e}.` : "";
		return (e, r = {}, i = {}) => {
			let a = typeof i == "string" ? { locale: i } : i || {};
			return this.t(`${n}${e}`, r, {
				...t,
				...a
			});
		};
	}
	subscribe(e) {
		if (typeof e != "function") throw Error("I18n.subscribe(): listener expects a function.");
		return this._listeners.add(e), () => {
			this._listeners.delete(e);
		};
	}
	destroy() {
		this._listeners.clear(), this._messages = {}, this._touch();
	}
	_touch() {
		this._setVersion((e) => e + 1);
	}
	_notify(e) {
		for (let t of Array.from(this._listeners)) t(e);
	}
	_handleMissing(e, t, n, r) {
		return this._missing ? this._missing({
			key: e,
			params: t,
			options: n,
			locale: r.locale,
			i18n: this
		}) : (this._warnMissing && console.warn(`I18n: missing translation for "${e}".`), e);
	}
};
function ft(e = {}) {
	return new dt(e);
}
ft({
	locale: ut(),
	fallbackLocale: "en"
});
//#endregion
//#region node_modules/vanilla-jui/dist/index.js
var z = (e, t) => Object.prototype.hasOwnProperty.call(e, t), B = {
	timers: {},
	start(e, t, n) {
		this.timers[e] && clearTimeout(this.timers[e]), this.timers[e] = setTimeout(() => {
			n(), delete this.timers[e];
		}, t);
	},
	cancel(e) {
		this.timers[e] && (clearTimeout(this.timers[e]), delete this.timers[e]);
	}
}, pt = (e) => e === null ? "null" : Array.isArray(e) ? "array" : typeof HTMLElement < "u" && e instanceof HTMLElement ? "HTMLElement" : typeof Node < "u" && e instanceof Node ? "Node" : typeof e;
function mt(e) {
	if (!e || typeof e != "object" || Array.isArray(e)) return !1;
	let t = Object.getPrototypeOf(e);
	return t === Object.prototype || t === null;
}
function ht(e) {
	return Array.isArray(e) ? e.slice() : mt(e) ? { ...e } : e;
}
function gt(e = {}) {
	return typeof e == "string" || Array.isArray(e) ? { type: e } : !e || typeof e != "object" ? {} : e;
}
function _t(e, t, n = []) {
	let r = Array.isArray(n) ? n : n ? [n] : [];
	for (let n of r) {
		let r, i;
		if (typeof n == "function") r = n, i = "does not satisfy the required condition.";
		else if (n && typeof n.test == "function") r = n.test, i = n.message || "condition failed.";
		else throw Error("Validator: Condition must be a function or { test, message }.");
		if (!r(t)) throw Error(`Validator: ${e} ${i}`);
	}
}
function vt(e, t) {
	return e ? `${e}.${t}` : t;
}
function yt(e) {
	if (z(e, "default")) return ht(e.factory && typeof e.default == "function" ? e.default() : e.default);
}
function V(e, t, n = {}, r = "") {
	let i = gt(n), a = vt(r, e), o = z(i, "types") ? i.types : i.type;
	if (i.required && t == null) throw Error(`Validator: ${a} is required.`);
	if (o !== void 0) {
		let e = Array.isArray(o) ? o : [o], n = pt(t);
		if (!e.some((e) => e === n)) {
			let t = e.join(", ");
			throw Error(`Validator: ${a} expects ${t}, but got ${n}.`);
		}
		_t(a, t, i.conditions);
	} else _t(a, t, i.conditions);
	if (Array.isArray(i.enum) && !i.enum.includes(t)) throw Error(`Validator: ${a} expects one of ${i.enum.join(", ")}.`);
	if (typeof i.validate == "function" && !i.validate(t)) throw Error(`Validator: ${a} ${i.message || "does not satisfy the required condition."}`);
	return t;
}
function H(e = {}, t = {}, n = "Options") {
	let r = e ?? {};
	if (typeof r != "object" || Array.isArray(r)) throw Error(`${n} expects object.`);
	let i = { ...r }, a = Object.entries(t || {});
	for (let [e, t] of a) {
		let n = gt(t);
		i[e] = z(r, e) ? r[e] : yt(n);
	}
	for (let [e, n] of a) {
		let a = gt(n);
		typeof a.normalize == "function" && (i[e] = a.normalize(i[e], {
			key: e,
			input: r,
			options: i,
			schema: t
		}));
	}
	for (let [e, r] of Object.entries(t || {})) V(e, i[e], r, n);
	return i;
}
function U(e = 8) {
	if (!Number.isInteger(e) || e < 1 || e > 32) throw Error("Length must be an integer between 1 and 32");
	let t = new Uint8Array(e);
	crypto.getRandomValues(t);
	let n = "";
	for (let r = 0; r < e; r++) n += "abcdefghijkmnpqrstuvwxyz23456789"[t[r] & 31];
	return n;
}
function W() {
	return typeof document < "u";
}
function bt() {
	return !W() || typeof document.createElement != "function" ? !1 : typeof document.createElement("div").insertBefore == "function";
}
function G(e = "Component") {
	if (!bt()) throw Error(`${e}: DOM render environment is required.`);
	return !0;
}
function K(e) {
	return W() && typeof Node < "u" && e instanceof Node;
}
function q(e) {
	return W() && typeof Element < "u" && e instanceof Element;
}
function xt(e) {
	return typeof e == "string" || q(e) || K(e) || Array.isArray(e);
}
function St(e) {
	return e.find(q) || null;
}
function Ct(e, t = []) {
	for (let n of e) {
		if (Array.isArray(n)) {
			if (!Ct(n, t)) return null;
			continue;
		}
		if (K(n)) {
			t.push(n);
			continue;
		}
		return null;
	}
	return t;
}
function J(e, t) {
	let n = typeof e == "function" ? e(t) : e;
	if (n == null || n === !1 || n === !0) return [];
	if (Array.isArray(n)) return n.flatMap((e) => J(e, t));
	if (K(n)) return [n];
	if (typeof n == "string") {
		let e = document.createElement("template");
		return e.innerHTML = n, Array.from(e.content.childNodes);
	}
	return [document.createTextNode(String(n))];
}
function wt(e, t = "Component") {
	if (e === !1 || e == null) return null;
	if (typeof e == "string") {
		if (!W()) return null;
		let t = Array.from(document.querySelectorAll(e));
		return t.length > 0 ? t : null;
	}
	if (Array.isArray(e)) {
		let t = Ct(e, []);
		return t && t.length > 0 ? t : null;
	}
	return K(e) ? [e] : null;
}
function Tt(e, t = "Component") {
	return q(e) || K(e) ? e : typeof e == "string" ? W() ? document.querySelector(e) : null : Array.isArray(e) && (wt(e, t) || [])[0] || null;
}
function Et(e, t = "Component") {
	if (!xt(e) || e === !1 || e == null) return null;
	if (typeof e == "string") {
		if (!W()) return null;
		let t = document.querySelector(e);
		return q(t) ? t : null;
	}
	if (Array.isArray(e)) {
		let n = wt(e, t);
		return Array.isArray(n) ? St(n) : null;
	}
	return q(e) ? e : null;
}
function Dt(e, t = "Component", n = "element") {
	if (![
		"node",
		"element",
		"array"
	].includes(n)) throw Error(`${t}: expect must be one of 'node', 'element', 'array'.`);
	return xt(e) ? n === "array" ? wt(e, t) : n === "node" ? Tt(e, t) : Et(e, t) : null;
}
function Ot(e, t = "Component", n = "element") {
	let r = Dt(e, t, n);
	if (r == null) throw Error(`${t}: container not found.`);
	return r;
}
function Y(e) {
	return e == null || typeof e == "string" || typeof e == "number" || typeof e == "boolean" || typeof e == "function" || Array.isArray(e) || K(e);
}
function kt(e = "j-loading is-active") {
	return P("div", {
		className: e,
		"aria-live": "polite",
		children: P("div", { className: "loading-spinner" })
	});
}
function X(e, t = document) {
	return t.querySelector(e);
}
var At = () => {};
function jt(e, t, n, r) {
	let i = !0;
	return e.addEventListener(t, n, r), () => {
		i && (i = !1, e.removeEventListener(t, n, r));
	};
}
function Mt() {
	let e = /* @__PURE__ */ new Map(), t = (t) => {
		let n = e.get(t);
		return n ? (n(), e.delete(t), !0) : !1;
	};
	return {
		on(n, r, i, a, o) {
			if (typeof n != "string" || n.trim() === "") throw TypeError("EventManager.on: key expects a non-empty string.");
			if (t(n), r == null) return At;
			let s = jt(r, i, a, o);
			return e.set(n, s), s;
		},
		off: t,
		clear() {
			for (let t of e.values()) t();
			e.clear();
		},
		size() {
			return e.size;
		}
	};
}
typeof window < "u" && `${window.location.origin}`;
var Nt = {
	info: "<path d=\"M12 22C6.47715 22 2 17.5228 2 12 2 6.47715 6.47715 2 12 2 17.5228 2 22 6.47715 22 12 22 17.5228 17.5228 22 12 22ZM12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20ZM13 10.5V15H14V17H10V15H11V12.5H10V10.5H13ZM13.5 8C13.5 8.82843 12.8284 9.5 12 9.5 11.1716 9.5 10.5 8.82843 10.5 8 10.5 7.17157 11.1716 6.5 12 6.5 12.8284 6.5 13.5 7.17157 13.5 8Z\"></path>",
	success: "<path d=\"M4 12C4 7.58172 7.58172 4 12 4C16.4183 4 20 7.58172 20 12C20 16.4183 16.4183 20 12 20C7.58172 20 4 16.4183 4 12ZM12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2ZM17.4571 9.45711L16.0429 8.04289L11 13.0858L8.20711 10.2929L6.79289 11.7071L11 15.9142L17.4571 9.45711Z\"></path>",
	warning: "<path d=\"M12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22ZM12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20ZM11 15H13V17H11V15ZM11 7H13V13H11V7Z\"></path>",
	error: "<path d=\"M12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22ZM12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20ZM12 10.5858L14.8284 7.75736L16.2426 9.17157L13.4142 12L16.2426 14.8284L14.8284 16.2426L12 13.4142L9.17157 16.2426L7.75736 14.8284L10.5858 12L7.75736 9.17157L9.17157 7.75736L12 10.5858Z\"></path>",
	"arrow-left": "<path d=\"M10.8284 12.0007L15.7782 16.9504L14.364 18.3646L8 12.0007L14.364 5.63672L15.7782 7.05093L10.8284 12.0007Z\"></path>",
	"arrow-right": "<path d=\"M13.1717 12.0007L8.22192 7.05093L9.63614 5.63672L16.0001 12.0007L9.63614 18.3646L8.22192 16.9504L13.1717 12.0007Z\"></path>",
	"arrow-up": "<path d=\"M11.9999 10.8284L7.0502 15.7782L5.63599 14.364L11.9999 8L18.3639 14.364L16.9497 15.7782L11.9999 10.8284Z\"></path>",
	"arrow-down": "<path d=\"M11.9999 13.1714L16.9497 8.22168L18.3639 9.63589L11.9999 15.9999L5.63599 9.63589L7.0502 8.22168L11.9999 13.1714Z\"></path>",
	more: "<path d=\"M5 10C3.9 10 3 10.9 3 12C3 13.1 3.9 14 5 14C6.1 14 7 13.1 7 12C7 10.9 6.1 10 5 10ZM19 10C17.9 10 17 10.9 17 12C17 13.1 17.9 14 19 14C20.1 14 21 13.1 21 12C21 10.9 20.1 10 19 10ZM12 10C10.9 10 10 10.9 10 12C10 13.1 10.9 14 12 14C13.1 14 14 13.1 14 12C14 10.9 13.1 10 12 10Z\"></path>",
	close: "<path d=\"M11.9997 10.5865L16.9495 5.63672L18.3637 7.05093L13.4139 12.0007L18.3637 16.9504L16.9495 18.3646L11.9997 13.4149L7.04996 18.3646L5.63574 16.9504L10.5855 12.0007L5.63574 7.05093L7.04996 5.63672L11.9997 10.5865Z\"></path>",
	loader: "<path d=\"M12 3C16.9706 3 21 7.02944 21 12H19C19 8.13401 15.866 5 12 5V3Z\"></path>",
	menu: "<path d=\"M3 4H21V6H3V4ZM3 11H21V13H3V11ZM3 18H21V20H3V18Z\"></path>",
	palette: "<path fill=\"none\" d=\"M0 0h24v24H0z\"></path><path d=\"M12 2C17.5222 2 22 5.97778 22 10.8889C22 13.9556 19.5111 16.4444 16.4444 16.4444H14.4778C13.5556 16.4444 12.8111 17.1889 12.8111 18.1111C12.8111 18.5333 12.9778 18.9222 13.2333 19.2111C13.5 19.5111 13.6667 19.9 13.6667 20.3333C13.6667 21.2556 12.9 22 12 22C6.47778 22 2 17.5222 2 12C2 6.47778 6.47778 2 12 2ZM10.8111 18.1111C10.8111 16.0843 12.451 14.4444 14.4778 14.4444H16.4444C18.4065 14.4444 20 12.851 20 10.8889C20 7.1392 16.4677 4 12 4C7.58235 4 4 7.58235 4 12C4 16.19 7.2226 19.6285 11.324 19.9718C10.9948 19.4168 10.8111 18.7761 10.8111 18.1111ZM7.5 12C6.67157 12 6 11.3284 6 10.5C6 9.67157 6.67157 9 7.5 9C8.32843 9 9 9.67157 9 10.5C9 11.3284 8.32843 12 7.5 12ZM16.5 12C15.6716 12 15 11.3284 15 10.5C15 9.67157 15.6716 9 16.5 9C17.3284 9 18 9.67157 18 10.5C18 11.3284 17.3284 12 16.5 12ZM12 9C11.1716 9 10.5 8.32843 10.5 7.5C10.5 6.67157 11.1716 6 12 6C12.8284 6 13.5 6.67157 13.5 7.5C13.5 8.32843 12.8284 9 12 9Z\"></path>",
	message: "<path d=\"M2 8.99374C2 5.68349 4.67654 3 8.00066 3H15.9993C19.3134 3 22 5.69478 22 8.99374V21H8.00066C4.68659 21 2 18.3052 2 15.0063V8.99374ZM20 19V8.99374C20 6.79539 18.2049 5 15.9993 5H8.00066C5.78458 5 4 6.78458 4 8.99374V15.0063C4 17.2046 5.79512 19 8.00066 19H20ZM14 11H16V13H14V11ZM8 11H10V13H8V11Z\"></path>",
	chat: "<path d=\"M10 3H14C18.4183 3 22 6.58172 22 11C22 15.4183 18.4183 19 14 19V22.5C9 20.5 2 17.5 2 11C2 6.58172 5.58172 3 10 3ZM12 17H14C17.3137 17 20 14.3137 20 11C20 7.68629 17.3137 5 14 5H10C6.68629 5 4 7.68629 4 11C4 14.61 6.46208 16.9656 12 19.4798V17Z\"></path>",
	discuss: "<path d=\"M14 22.5L11.2 19H6C5.44772 19 5 18.5523 5 18V7.10256C5 6.55028 5.44772 6.10256 6 6.10256H22C22.5523 6.10256 23 6.55028 23 7.10256V18C23 18.5523 22.5523 19 22 19H16.8L14 22.5ZM15.8387 17H21V8.10256H7V17H11.2H12.1613L14 19.2984L15.8387 17ZM2 2H19V4H3V15H1V3C1 2.44772 1.44772 2 2 2Z\"></path>"
};
function Pt(e) {
	if (!(e in Nt)) throw Error(`Icon "${e}" not found.`);
}
function Ft(e) {
	return Pt(e), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">${Nt[e]}</svg>`;
}
function It(e, t = {}) {
	G("icon()");
	let n = document.createElement("template");
	n.innerHTML = Ft(e);
	let r = n.content.firstElementChild;
	for (let [e, n] of Object.entries(t || {})) {
		if (n == null || n === !1) continue;
		let t = e === "className" ? "class" : e;
		r.setAttribute(t, n === !0 ? "" : String(n));
	}
	return r;
}
function Z(e) {
	"@babel/helpers - typeof";
	return Z = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e) {
		return typeof e;
	} : function(e) {
		return e && typeof Symbol == "function" && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e;
	}, Z(e);
}
function Lt(e, t) {
	if (Z(e) != "object" || !e) return e;
	var n = e[Symbol.toPrimitive];
	if (n !== void 0) {
		var r = n.call(e, t || "default");
		if (Z(r) != "object") return r;
		throw TypeError("@@toPrimitive must return a primitive value.");
	}
	return (t === "string" ? String : Number)(e);
}
function Rt(e) {
	var t = Lt(e, "string");
	return Z(t) == "symbol" ? t : t + "";
}
function zt(e, t, n) {
	return (t = Rt(t)) in e ? Object.defineProperty(e, t, {
		value: n,
		enumerable: !0,
		configurable: !0,
		writable: !0
	}) : e[t] = n, e;
}
var Q = class e {
	constructor(e = {}) {
		this.props = e || {}, this.dom = { root: null }, this.plugins = /* @__PURE__ */ new Map(), this.cleanup = {
			events: Mt(),
			plugins: /* @__PURE__ */ new Map()
		}, this._listeners = {
			init: [],
			beforeUpdate: [],
			afterUpdate: [],
			destroy: []
		}, this.state = D({}), this.runtime = { destroyed: !1 }, this.installGlobalPlugins();
	}
	get root() {
		return this.dom?.root || null;
	}
	set root(e) {
		this.dom || (this.dom = {}), this.dom.root = e;
	}
	use(e, t) {
		if (!e) return this;
		let n = typeof e == "function" ? e(this, t) : e.install?.(this, t);
		return this.cleanup.plugins.set(e, n), this;
	}
	on(e, t) {
		return !this._listeners[e] || typeof t != "function" || this._listeners[e].push(t), this;
	}
	off(e, t) {
		return this._listeners[e] && (this._listeners[e] = this._listeners[e].filter((e) => e !== t)), this;
	}
	installGlobalPlugins() {
		for (let t of e.globalPlugins.values()) this.use(t);
	}
	static useGlobal(t, n) {
		!t || !n || e.globalPlugins.set(t, n);
	}
	emit(e, ...t) {
		let n = this._listeners[e];
		if (!n) return this;
		for (let e of n) try {
			e(...t);
		} catch {}
		return this;
	}
	init(e = {}) {
		if (this.runtime.destroyed) throw Error("Component.init: instance destroyed");
		return e && typeof e == "object" && !Array.isArray(e) && (this.props = Object.assign({}, this.props, e)), typeof this.onInit == "function" && this.onInit(this.props), this.emit("init", this.props), this;
	}
	setState(e = {}, t) {
		if (this.runtime.destroyed) throw Error("Component.setState: instance destroyed");
		let n = typeof e == "string" && arguments.length > 1 ? { [e]: t } : e;
		if (!n || typeof n != "object" || Array.isArray(n)) throw Error("Component.setState: expects a plain object patch.");
		return S(() => {
			for (let [e, t] of Object.entries(n)) this.state[e] = t;
		}), this;
	}
	update(e = {}, { force: t = !1 } = {}) {
		if (this.runtime.destroyed) throw Error("Component.update: instance destroyed");
		return e && typeof e == "object" && (this.props = Object.assign({}, this.props, e)), this.emit("beforeUpdate", e, { force: t }), typeof this.onUpdate == "function" && this.onUpdate(e, { force: t }), this.emit("afterUpdate", e, { force: t }), this;
	}
	destroy() {
		if (!this.runtime.destroyed) {
			this.runtime = { destroyed: !0 }, typeof this.onDestroy == "function" && this.onDestroy(), this.emit("destroy");
			for (let e of this.cleanup.plugins.values()) try {
				typeof e == "function" ? e() : e && typeof e.destroy == "function" && e.destroy();
			} catch {}
			this.cleanup.plugins.clear(), this.cleanup.events.clear(), this.dom = { root: null }, this.state = null;
		}
	}
};
zt(Q, "globalPlugins", /* @__PURE__ */ new Map());
var Bt = {
	id: {
		default: null,
		types: ["string", "null"],
		normalize: (e) => typeof e == "string" ? e.trim() ? e.trim() : U() : e ?? U()
	},
	active: {
		default: 0,
		types: [
			"number",
			"string",
			"array",
			"null"
		]
	},
	collapsible: {
		default: !1,
		type: "boolean"
	},
	multiple: {
		default: !1,
		type: "boolean"
	},
	onChange: {
		default: null,
		types: ["function", "null"]
	},
	items: {
		default: [],
		type: "array"
	}
}, Vt = {
	type: "array",
	validate: (e) => e.length > 0,
	message: "expects a non-empty array."
}, Ht = {
	types: [
		"number",
		"string",
		"array",
		"null"
	],
	validate: (e) => e == null ? !0 : Array.isArray(e) ? e.every((e) => typeof e == "number" || typeof e == "string") : typeof e == "number" ? Number.isInteger(e) && e >= 0 : e.trim().length > 0,
	message: "expects a positive number, string, array or null."
};
function Ut(e) {
	return Array.isArray(e) ? e.map((e) => ({ ...e })) : [];
}
function Wt(e) {
	return V("items", e, Vt, "Accordion"), e.map((e) => {
		if (!e || typeof e != "object" || Array.isArray(e)) throw Error("Accordion: item expects an object.");
		if (e.name != null && typeof e.name != "string") throw Error("Accordion: item name expects a string.");
		if (!Y(e.title)) throw Error("Accordion: item title expects string, Node, array, function or null.");
		if (!Y(e.content)) throw Error("Accordion: item content expects string, Node, array, function or null.");
		return {
			...e,
			name: e.name || U()
		};
	});
}
var Gt = class extends Q {
	constructor(e, t = {}) {
		G("Accordion");
		let n = Ot(e, "Accordion"), r = H(t, Bt, "Accordion");
		super(r), this.dom.container = n, this.dom.headers = [], this.dom.panels = [], this.state = D({
			activeNames: [],
			current: {
				index: null,
				name: null
			}
		});
		try {
			this.onInit(r);
		} catch (e) {
			throw this.destroy(), e;
		}
	}
	onInit(e) {
		this.root = this.buildRoot(e), this.buildItems(e), this.syncActiveNames(this.resolveActiveNames(e.active)), this.bindEvents();
	}
	buildRoot(e) {
		return P("div", {
			className: "j-accordion",
			id: e.id
		});
	}
	buildItems(e) {
		let t = Wt(e.items), n = document.createDocumentFragment();
		this.dom.headers = [], this.dom.panels = [], t.forEach((t, r) => {
			let i = t.name || U(), a = `${e.id}_header_${r}`, o = `${e.id}_panel_${r}`, s = P("div", {
				className: "accordion-header",
				"data-item": i,
				id: a,
				role: "button",
				tabindex: "0",
				"aria-controls": o,
				children: [P("span", {
					className: "header-title",
					children: this.contentView(t.title, t, r, "title")
				}), P("span", {
					className: "header-arrow",
					"aria-hidden": "true",
					children: It("arrow-down")
				})]
			}), c = P("div", {
				className: "accordion-panel",
				id: o,
				role: "region",
				"aria-labelledby": a,
				children: P("div", {
					className: "panel-content",
					children: this.contentView(t.content, t, r, "content")
				})
			});
			this.dom.headers.push(s), this.dom.panels.push(c), n.append(s, c);
		}), this.root.append(n), this.cleanup.bindings?.(), this.cleanup.bindings = De((e) => (this.dom.headers.forEach((e) => {
			let t = e.dataset.item;
			N(e, "is-active", () => this.state.activeNames.includes(t)), M(e, "aria-expanded", () => this.state.activeNames.includes(t));
		}), this.dom.panels.forEach((e, t) => {
			let n = this.dom.headers[t]?.dataset.item;
			N(e, "is-active", () => this.state.activeNames.includes(n)), M(e, "aria-hidden", () => this.state.activeNames.includes(n) ? "false" : "true"), M(e, "hidden", () => !this.state.activeNames.includes(n));
		}), e));
	}
	contentView(e, t, n, r) {
		return J(e, {
			accordion: this,
			item: t,
			index: n,
			type: r,
			active: !1
		});
	}
	resolveActiveNames(e) {
		if (e == null) return [];
		let t = Array.isArray(e) ? e : [e], n = [];
		for (let e of t) {
			let t = this.getIndex(e);
			if (!(t < 0 || t >= this.dom.headers.length) && (n.push(this.dom.headers[t].dataset.item || String(t)), !this.props.multiple)) break;
		}
		return Array.from(new Set(n));
	}
	syncActiveNames(e) {
		let t = e[0] || null, n = t ? this.getIndex(t) : null;
		S(() => {
			this.state.activeNames = e, this.state.current = {
				index: n,
				name: t
			};
		});
	}
	bindEvents() {
		this.unbindEvents(), this.cleanup.events.on("click", this.root, "click", (e) => {
			let t = e.target.closest(".accordion-header");
			t && this.active(t.dataset.item);
		}), this.cleanup.events.on("keydown", this.root, "keydown", (e) => {
			if (e.key !== "Enter" && e.key !== " ") return;
			let t = e.target.closest(".accordion-header");
			t && (e.preventDefault(), this.active(t.dataset.item));
		});
	}
	unbindEvents() {
		this.cleanup.events.clear();
	}
	isActive(e) {
		return this.state.activeNames.includes(e);
	}
	assertActive(e) {
		if (this.runtime.destroyed) throw Error(`Accordion.${e}: instance has been destroyed.`);
	}
	async activateItem(e, t = !0) {
		let n = this.getIndex(e);
		if (n < 0 || n >= this.dom.headers.length) return;
		let r = this.dom.headers[n], i = this.dom.panels[n], a = r.dataset.item || String(n), o = this.isActive(a);
		if (o && !this.props.multiple && !this.props.collapsible) return;
		let s;
		s = this.props.multiple ? o ? this.state.activeNames.filter((e) => e !== a) : [...this.state.activeNames, a] : o ? this.props.collapsible ? [] : this.state.activeNames : [a], this.syncActiveNames(s), t && this.props.onChange && await Promise.resolve(this.props.onChange(n, a, r, i, this));
	}
	getIndex(e) {
		return typeof e == "number" ? e : typeof e == "string" ? this.dom.headers.findIndex((t) => t.dataset.item === e) : -1;
	}
	async active(e) {
		this.assertActive("active"), await this.activateItem(e, !0);
	}
	build() {
		this.assertActive("build"), j(this.dom.container, () => this.root);
	}
	setItems(e, t = 0) {
		this.assertActive("setItems"), V("items", e, Vt, "Accordion.setItems"), V("active", t, Ht, "Accordion.setItems"), this.props.items = Ut(Wt(e)), this.props.active = t, this.root.textContent = "", this.buildItems(this.props), this.syncActiveNames(this.resolveActiveNames(t)), this.bindEvents();
	}
	onDestroy() {
		this.unbindEvents(), this.cleanup.bindings?.(), this.cleanup.bindings = null, this.root?.parentNode && this.root.parentNode.removeChild(this.root);
	}
};
function Kt(e, t = {}) {
	return new Gt(e, t);
}
var qt = {
	content: {
		default: "",
		validate: Y,
		message: "expects string, Node, array, function or null."
	},
	overlay: {
		default: !0,
		type: "boolean"
	},
	filter: {
		default: !0,
		type: "boolean"
	},
	cache: {
		default: !1,
		type: "boolean"
	},
	ttl: {
		default: 0,
		type: "number"
	},
	direction: {
		default: "left",
		type: "string",
		enum: [
			"top",
			"right",
			"bottom",
			"left"
		]
	},
	animation: {
		default: "slide",
		type: "string",
		enum: [
			"slide",
			"push",
			"none"
		]
	},
	bgClose: {
		default: !0,
		type: "boolean"
	},
	escClose: {
		default: !0,
		type: "boolean"
	},
	id: {
		default: null,
		types: ["string", "null"],
		normalize: (e) => typeof e == "string" ? e.trim() ? e.trim() : U() : e ?? U()
	},
	onShow: {
		default: null,
		types: ["function", "null"]
	},
	onShown: {
		default: null,
		types: ["function", "null"]
	},
	onHide: {
		default: null,
		types: ["function", "null"]
	},
	onHidden: {
		default: null,
		types: ["function", "null"]
	}
};
function Jt(e) {
	return typeof e == "number" && e > 0 ? e : 0;
}
var Yt = class extends Q {
	constructor(e = {}) {
		G("Offcanvas");
		let t = H(e, qt, "Offcanvas");
		super(t), this._overlay = null, this.runtime.cache = {
			content: null,
			hasContent: !1,
			updatedAt: 0
		}, this.runtime.contentLoadId = 0, this.state = D({
			visible: !1,
			loading: !1
		}), this.onInit(t);
	}
	onInit(e) {
		e.overlay && (this._overlay = this._buildOverlay(e)), this.root = this._buildRoot(e);
	}
	_buildOverlay(e) {
		return P("div", {
			className: "j-offcanvas-overlay",
			style: e.filter ? { backdropFilter: "blur(2px)" } : {}
		});
	}
	_buildRoot(e) {
		let t = P("div", { className: "offcanvas-content" });
		return this.dom.content = t, typeof e.content != "function" && t.append(...J(e.content, this)), P("div", {
			className: `j-offcanvas is-${e.direction} is-${e.animation}`,
			id: e.id,
			children: t
		});
	}
	_isCacheValid() {
		if (!this.props.cache || !this.runtime.cache.hasContent) return !1;
		let e = Jt(this.props.ttl);
		return !e || Date.now() - this.runtime.cache.updatedAt <= e;
	}
	_renderContent(e) {
		this.dom.content && (this.dom.content.textContent = "", this.dom.content.append(...J(e, this)));
	}
	async _loadContent() {
		let { content: e, cache: t } = this.props;
		if (typeof e != "function") {
			this.runtime.contentLoadId += 1, S(() => {
				this.state.loading = !1;
			});
			return;
		}
		if (this._isCacheValid()) {
			this.runtime.contentLoadId += 1, this._renderContent(this.runtime.cache.content), S(() => {
				this.state.loading = !1;
			});
			return;
		}
		let n = ++this.runtime.contentLoadId;
		S(() => {
			this.state.loading = !0;
		}), this.dom.content.textContent = "", this.dom.content.appendChild(kt());
		try {
			let r = await Promise.resolve(e(this));
			if (this.runtime.destroyed || n !== this.runtime.contentLoadId) return;
			t && (this.runtime.cache.content = r, this.runtime.cache.hasContent = !0, this.runtime.cache.updatedAt = Date.now()), this._renderContent(r);
		} finally {
			!this.runtime.destroyed && n === this.runtime.contentLoadId && S(() => {
				this.state.loading = !1;
			});
		}
	}
	_bindEvents() {
		this.unbindEvents();
		let { bgClose: e, escClose: t } = this.props;
		this._overlay && e && this.cleanup.events.on("overlay", this._overlay, "click", () => {
			this.hide();
		}), t && this.cleanup.events.on("esc", document, "keydown", (e) => {
			e.key === "Escape" && this.state.visible && this.hide();
		}), this.cleanup.events.on("close", this.root, "click", (e) => {
			let t = e.target.dataset.action;
			(t === "close" || t === "cancel") && this.hide();
		});
	}
	unbindEvents() {
		this.cleanup?.events.clear();
	}
	_render() {
		let { overlay: e, animation: t, direction: n, id: r } = this.props, i = document.body;
		e && i.appendChild(this._overlay), i.appendChild(this.root), i.style.overflow = "hidden", t === "push" && i.classList.add("offcanvas-push-body"), B.start(`oc-show-${r}`, 10, () => {
			this.root && (this._overlay && this._overlay.classList.add("is-active"), t === "push" && i.classList.add(`offcanvas-push-${n}`), this.root.classList.add("is-active"));
		});
	}
	_remove() {
		let { animation: e, direction: t, id: n } = this.props, r = document.body;
		this._overlay && this._overlay.classList.remove("is-active"), this.root.classList.remove("is-active"), e === "push" && r.classList.remove(`offcanvas-push-${t}`), B.start(`oc-remove-${n}`, 100, () => {
			this._overlay?.parentNode?.removeChild(this._overlay), this.root?.parentNode?.removeChild(this.root), e === "push" && r.classList.remove("offcanvas-push-body"), r.style.overflow = "";
		});
	}
	async show() {
		if (this.runtime.destroyed || this.state.visible) return;
		let { onShow: e, onShown: t, id: n } = this.props;
		e && await Promise.resolve(e()), this._render(), this._bindEvents(), S(() => {
			this.state.visible = !0;
		}), await this._loadContent(), B.start(`oc-shown-${n}`, 300, () => {
			this.runtime.destroyed || t && t();
		});
	}
	async hide() {
		if (this.runtime.destroyed || !this.state.visible) return;
		let { onHide: e, onHidden: t } = this.props;
		e && await Promise.resolve(e()), this.runtime.contentLoadId += 1, S(() => {
			this.state.loading = !1;
		}), this.unbindEvents(), this._remove(), S(() => {
			this.state.visible = !1;
		}), t && t();
	}
	onDestroy() {
		let { id: e } = this.props;
		B.cancel(`oc-show-${e}`), B.cancel(`oc-remove-${e}`), B.cancel(`oc-shown-${e}`), this.state.visible && this.unbindEvents(), this.root?.classList.remove("is-active"), this.root?.parentNode?.removeChild(this.root), this._overlay?.parentNode?.removeChild(this._overlay);
		let t = document.body;
		t.style.overflow = "", t.classList.remove("offcanvas-push-body", `offcanvas-push-${this.props.direction}`), this._overlay = null;
	}
};
function Xt(e = {}) {
	return new Yt(e);
}
var Zt = {
	type: "object",
	required: !0,
	validate: (e) => Number.isInteger(e.size) && e.size > 0 && Number.isInteger(e.current) && e.current > 0,
	message: "expects { size, current } with positive integers."
}, Qt = {
	type: "object",
	required: !0,
	validate: (e) => Number.isInteger(e.sibling) && e.sibling >= 0 && Number.isInteger(e.boundary) && e.boundary >= 0,
	message: "expects { sibling, boundary } with integers greater than or equal 0."
};
({ ...Zt }), { ...Qt };
function $t(e) {
	return e == null || e === !1 || typeof e == "function";
}
var en = {
	validate: (e) => Array.isArray(e) && e.length > 0,
	message: "expects a non-empty steps array."
}, $ = {
	validate: $t,
	message: "expects function, false or null."
};
({ ...en }), { ...$ }, { ...$ }, { ...$ }, { ...$ };
function tn(e) {
	return e == null || typeof e == "string" || typeof e == "function" || Array.isArray(e) || K(e);
}
var nn = {
	validate: tn,
	message: "expects string, Node, array, function or null."
}, rn = { types: ["array", "null"] };
({ ...nn }), { ...rn };
var an = {
	validate: (e) => e == null || typeof e == "string" || Array.isArray(e) || K(e),
	message: "expects Element, Node, selector or JSX node."
};
({ ...an }), { ...an };
var on = {
	id: {
		default: null,
		types: ["string", "null"],
		normalize: (e) => typeof e == "string" ? e.trim() ? e.trim() : U() : e ?? U()
	},
	direction: {
		default: "top",
		type: "string",
		enum: [
			"top",
			"bottom",
			"left",
			"right"
		]
	},
	active: {
		default: 0,
		types: ["number", "string"]
	},
	disabled: {
		default: [],
		types: [
			"number",
			"string",
			"array"
		]
	},
	onChange: {
		default: null,
		types: ["function", "null"]
	},
	tabs: {
		default: [],
		type: "array"
	},
	onAdd: {
		default: null,
		types: ["function", "null"]
	},
	onRemove: {
		default: null,
		types: ["function", "null"]
	}
}, sn = {
	type: "object",
	validate: (e) => !!e && Y(e.title) && Y(e.panel),
	message: "expects an object with renderable title and panel: string, Node, array, function or null."
};
function cn(e) {
	return Array.isArray(e) ? e.map((e) => ({ ...e })) : [];
}
function ln(e) {
	return typeof e == "number" && e > 0 ? e : 0;
}
var un = class extends Q {
	constructor(e, t = {}) {
		G("Tabs");
		let n = Ot(e, "Tabs"), r = H(t, on, "Tabs");
		super(r), this.dom.container = n, this.state = D({
			current: {
				index: -1,
				name: null
			},
			disabled: this._parseDisabled(r.disabled),
			isVertical: r.direction === "left" || r.direction === "right",
			draggable: !1,
			loading: !1
		}), this.runtime.cache = { panels: /* @__PURE__ */ new Map() }, this.runtime.panelLoadId = 0;
		try {
			this.onInit(r);
		} catch (e) {
			throw this.destroy(), e;
		}
	}
	onInit(e) {
		this.root = this.buildRoot(e), this.rebuildItems(), this._activate(e.active, !1), this.bindEvents(), this._initDrag();
	}
	buildRoot(e) {
		let { id: t, direction: n } = e, r = P("div", {
			className: "tab-wrap",
			children: P("nav", { className: "tab-list" })
		}), i = P("div", { className: "tab-panel" });
		return P("div", {
			className: `j-tabs is-${n}`,
			id: t,
			children: [r, i]
		});
	}
	rebuildItems() {
		let e = X(".tab-list", this.root), t = X(".tab-panel", this.root);
		if (!e || !t) return;
		e.textContent = "", t.textContent = "", this.dom.tabs = [], this.dom.panels = [], this.dom.panelBodies = [];
		let n = document.createDocumentFragment(), r = document.createDocumentFragment();
		this.props.tabs.forEach((e, t) => {
			let i = e.name || U(), a = P("div", {
				className: "tab-item",
				"data-tab": i,
				children: P("span", { children: J(e.title, {
					tabs: this,
					item: e
				}) })
			});
			this.dom.tabs.push(a);
			let o = P("div");
			this.dom.panels.push(P("div", {
				className: "panel-item",
				role: "tabpanel",
				children: o
			})), this.dom.panelBodies.push(o), typeof e.panel != "function" && o.append(...J(e.panel, {
				tabs: this,
				item: e,
				index: t,
				name: i
			})), n.append(a), r.append(this.dom.panels[this.dom.panels.length - 1]);
		}), e.append(n), t.append(r), this.cleanup.bindings?.(), this.cleanup.bindings = De((e) => (this.dom.tabs.forEach((e, t) => {
			let n = e.dataset.tab;
			N(e, "is-active", () => this.state.current.index === t), N(e, "is-disabled", () => this.state.disabled.names.includes(n)), M(e, "aria-selected", () => this.state.current.index === t), M(e, "aria-disabled", () => this.state.disabled.names.includes(n));
		}), this.dom.panels.forEach((e, t) => {
			N(e, "is-active", () => this.state.current.index === t), M(e, "aria-hidden", () => this.state.current.index !== t);
		}), e));
	}
	_parseDisabled(e) {
		if (e == null) return {
			names: [],
			indexes: []
		};
		let t = (e) => typeof e == "number" ? this.props.tabs[e]?.name || null : typeof e == "string" ? e : null, n = Array.isArray(e) ? e.map(t).filter(Boolean) : (() => {
			let n = t(e);
			return n ? [n] : [];
		})();
		return this._createDisabledState(n);
	}
	_createDisabledState(e) {
		let t = Array.from(new Set(e));
		return {
			names: t,
			indexes: t.map((e) => this.props.tabs.findIndex((t) => t.name === e)).filter((e) => e >= 0)
		};
	}
	_syncCurrent(e) {
		this.state.current = {
			index: e,
			name: e >= 0 && e < this.dom.tabs.length && this.dom.tabs[e]?.dataset.tab || null
		};
	}
	_getPanelKey(e, t) {
		return e.name || this.dom.tabs[t]?.dataset.tab || String(t);
	}
	_getCachedPanel(e, t) {
		if (!e?.cache) return null;
		let n = this.runtime.cache.panels.get(this._getPanelKey(e, t));
		if (!n) return null;
		let r = ln(e.ttl);
		return r && Date.now() - n.updatedAt > r ? (this.runtime.cache.panels.delete(this._getPanelKey(e, t)), null) : n;
	}
	_setCachedPanel(e, t, n) {
		e?.cache && this.runtime.cache.panels.set(this._getPanelKey(e, t), {
			content: n,
			updatedAt: Date.now()
		});
	}
	_renderPanelContent(e, t) {
		let n = this.dom.panelBodies[e], r = this.props.tabs[e];
		!n || !r || (n.textContent = "", n.append(...J(t, {
			tabs: this,
			item: r,
			index: e,
			name: this.dom.tabs[e]?.dataset.tab || r.name || e
		})));
	}
	async _loadPanel(e) {
		let t = this.props.tabs[e], n = this.dom.panelBodies[e];
		if (!t || !n || typeof t.panel != "function") {
			this.runtime.panelLoadId += 1, S(() => {
				this.state.loading = !1;
			});
			return;
		}
		let r = this._getCachedPanel(t, e);
		if (r) {
			this.runtime.panelLoadId += 1, S(() => {
				this.state.loading = !1;
			}), this._renderPanelContent(e, r.content);
			return;
		}
		let i = ++this.runtime.panelLoadId;
		S(() => {
			this.state.loading = !0;
		}), n.textContent = "", n.style.minHeight = "80px", n.appendChild(kt());
		try {
			let n = await Promise.resolve(t.panel({
				tabs: this,
				item: t,
				index: e,
				name: this.dom.tabs[e]?.dataset.tab || t.name || e
			}));
			if (this.runtime.destroyed || i !== this.runtime.panelLoadId) return;
			this._setCachedPanel(t, e, n), this._renderPanelContent(e, n);
		} finally {
			!this.runtime.destroyed && i === this.runtime.panelLoadId && S(() => {
				this.state.loading = !1, n.style.minHeight = "";
			});
		}
	}
	get activeIndex() {
		return this.state.current.index;
	}
	get disabledNames() {
		return this.state.disabled.names;
	}
	bindEvents() {
		this.unbindEvents();
		let e = X(".tab-list", this.root);
		e && this.cleanup.events.on("tabClick", e, "click", (e) => {
			let t = e.target.closest(".tab-item");
			if (!t) return;
			let n = t.dataset.tab;
			n && !this.state.disabled.names.includes(n) && this.activate(n);
		});
	}
	unbindEvents() {
		this.cleanup.events.clear();
	}
	assertActive(e) {
		if (this.runtime.destroyed) throw Error(`Tabs.${e}: instance has been destroyed.`);
	}
	_getIndex(e) {
		return typeof e == "number" ? e : typeof e == "string" ? this.dom.tabs.findIndex((t) => t.dataset.tab === e) : -1;
	}
	async _activate(e, t = !0) {
		let n = this._getIndex(e);
		if (!(n < 0 || n >= this.dom.tabs.length || this.state.disabled.names.includes(this.dom.tabs[n]?.dataset.tab) || this.state.current.index === n) && (S(() => {
			this._syncCurrent(n);
		}), await this._loadPanel(n), t && this.props.onChange)) {
			let e = this.dom.tabs[n], t = this.dom.panels[n];
			await Promise.resolve(this.props.onChange(n, e?.dataset.tab || n, e, t));
		}
	}
	async activate(e) {
		this.assertActive("activate"), await this._activate(e, !0);
	}
	build() {
		this.assertActive("render"), j(this.dom.container, () => this.root);
	}
	async add(e) {
		this.assertActive("add"), V("tabConfig", e, sn, "Tabs.add"), e.name = e.name || U(), this.props.tabs = [...cn(this.props.tabs), e], this.runtime.cache.panels.clear(), this.rebuildItems(), this.syncActiveNames(this.resolveActiveNames(this.props.active)), this.bindEvents(), this._refreshDrag();
		let { onAdd: t } = this.props;
		if (t) {
			let n = this.props.tabs.length - 1;
			await Promise.resolve(t(n, e, this.dom.tabs[n], this.dom.panels[n]));
		}
	}
	async delete(e) {
		if (this.assertActive("delete"), this.props.tabs.length <= 1) return;
		let t = this._getIndex(e);
		if (t < 0 || t >= this.props.tabs.length) return;
		let n = this.props.tabs[t].name, { onRemove: r } = this.props;
		this.props.tabs = this.props.tabs.filter((e, n) => n !== t), this.runtime.cache.panels.delete(n), this.state.current.index >= this.props.tabs.length ? S(() => {
			this._syncCurrent(this.props.tabs.length - 1);
		}) : this.state.current.index > t && S(() => {
			this._syncCurrent(this.state.current.index - 1);
		}), this.rebuildItems(), this.bindEvents(), await this._loadPanel(this.state.current.index), this._refreshDrag(), r && await Promise.resolve(r(t, n));
	}
	disable(e) {
		this.assertActive("disable");
		let t = typeof e == "number" ? this.dom.tabs[e]?.dataset.tab : e;
		t && !this.state.disabled.names.includes(t) && S(() => {
			this.state.disabled = this._createDisabledState([...this.state.disabled.names, t]);
		});
	}
	enable(e) {
		this.assertActive("enable");
		let t = typeof e == "number" ? this.dom.tabs[e]?.dataset.tab : e;
		t && S(() => {
			this.state.disabled = this._createDisabledState(this.state.disabled.names.filter((e) => e !== t));
		});
	}
	resolveActiveNames(e) {
		return e == null ? -1 : typeof e == "number" ? e : typeof e == "string" ? this.dom.tabs.findIndex((t) => t.dataset.tab === e) : 0;
	}
	syncActiveNames(e) {
		S(() => {
			this._syncCurrent(e);
		});
	}
	async reInit(e = {}) {
		this.assertActive("reInit"), Object.assign(this.props, H(e, on, "Tabs")), S(() => {
			this.state.disabled = this._parseDisabled(this.props.disabled);
		}), this.rebuildItems(), this.syncActiveNames(this.resolveActiveNames(this.props.active)), this.bindEvents(), await this._loadPanel(this.state.current.index), this._refreshDrag();
	}
	get _dragContainer() {
		return this.root ? X(".tab-wrap", this.root) : null;
	}
	get _dragInner() {
		return this.root ? X(".tab-list", this.root) : null;
	}
	_initDrag() {
		let { direction: e } = this.props;
		if (!this._dragContainer || !this._dragInner) return;
		let t = e === "left" || e === "right", n = t ? this._dragInner.scrollHeight > this._dragContainer.clientHeight + 5 : this._dragInner.scrollWidth > this._dragContainer.clientWidth + 5;
		if (S(() => {
			this.state.isVertical = t, this.state.draggable = n;
		}), !n) {
			this._removeDragEvents();
			return;
		}
		this._bindDragEvents(), this.cleanup.events.on("resize", window, "resize", () => {
			cancelAnimationFrame(this._resizeRaf), this._resizeRaf = requestAnimationFrame(() => {
				this._refreshDrag();
			});
		});
	}
	_bindDragEvents() {
		this._removeDragEvents();
		let e = this._dragContainer, t = this._dragInner, n = this.state.isVertical, r = 0, i = 0, a = 0, o = !1, s = (e) => n ? e.touches ? e.touches[0].pageY : e.pageY : e.touches ? e.touches[0].pageX : e.pageX, c = (o) => {
			this.isDragging = !0, t.classList.add("dragging"), r = s(o), a = r, i = n ? e.scrollTop : e.scrollLeft, this._velocity = 0, cancelAnimationFrame(this.raf);
		}, l = (t) => {
			if (!this.isDragging) return;
			t.preventDefault();
			let c = s(t), l = r - c;
			this._velocity = a - c, a = c, o || (o = !0, requestAnimationFrame(() => {
				o = !1, n ? e.scrollTop = i + l : e.scrollLeft = i + l;
			}));
		}, u = () => {
			this.isDragging && (this.isDragging = !1, t.classList.remove("dragging"), this._startInertiaScroll());
		};
		this.cleanup.events.on("drag:mousedown", t, "mousedown", c), this.cleanup.events.on("drag:touchstart", t, "touchstart", c, { passive: !0 }), this.cleanup.events.on("drag:mousemove", window, "mousemove", l, { passive: !1 }), this.cleanup.events.on("drag:touchmove", window, "touchmove", l, { passive: !1 }), this.cleanup.events.on("drag:mouseup", window, "mouseup", u), this.cleanup.events.on("drag:touchend", window, "touchend", u);
	}
	_startInertiaScroll() {
		let e = this._dragContainer, t = this._velocity, n = this.state.isVertical, r = performance.now(), i = (a) => {
			let o = a - r;
			r = a, t *= .92, !(Math.abs(t) < .3) && (n ? e.scrollTop += t * o * .05 : e.scrollLeft += t * o * .05, this.raf = requestAnimationFrame(i));
		};
		this.raf = requestAnimationFrame(i);
	}
	_removeDragEvents() {
		this.cleanup.events.off("drag:mousedown"), this.cleanup.events.off("drag:touchstart"), this.cleanup.events.off("drag:mousemove"), this.cleanup.events.off("drag:touchmove"), this.cleanup.events.off("drag:mouseup"), this.cleanup.events.off("drag:touchend");
	}
	_refreshDrag() {
		this._initDrag();
	}
	onDestroy() {
		this.unbindEvents(), this._removeDragEvents(), this.cleanup.bindings?.(), this.cleanup.bindings = null, cancelAnimationFrame(this.raf), cancelAnimationFrame(this._resizeRaf), this.cleanup.events.off("resize"), this.root?.parentNode && this.root.parentNode.removeChild(this.root);
	}
};
function dn(e, t = {}) {
	return new un(e, t);
}
var fn = {
	type: "string",
	enum: [
		"info",
		"success",
		"warning",
		"error",
		"primary"
	]
}, pn = {
	type: "number",
	validate: (e) => e >= 0,
	message: "expects a positive number or 0."
}, mn = {
	type: "number",
	validate: (e) => e > 0,
	message: "expects a number greater than 0."
}, hn = class e {
	static show(t = "", n = 3e3, r = "info") {
		G("Toast"), V("message", t, "string", "Toast.show"), V("duration", n, pn, "Toast.show"), V("type", r, fn, "Toast.show");
		let i = e._getOrCreateContainer(), a = U(), o = P("div", {
			className: `j-toast is-${r}`,
			"data-toast": a,
			children: [P("span", {
				className: "toast-icon",
				children: It(r === "primary" ? "info" : r)
			}), P("span", {
				className: "toast-message",
				children: t
			})]
		});
		i.appendChild(o), e._setTimer(a, "show", () => {
			o.classList.add("is-shown");
		}, 10), n > 0 && e._setTimer(a, "hide", () => {
			e.hide(o);
		}, n);
		let s = jt(o, "click", () => {
			e.hide(o);
		});
		return e.disposers.set(o, s), o;
	}
	static success(t = "", n = 3e3) {
		return e.show(t, n, "success");
	}
	static info(t = "", n = 3e3) {
		return e.show(t, n, "info");
	}
	static primary(t = "", n = 3e3) {
		return e.show(t, n, "primary");
	}
	static warning(t = "", n = 3e3) {
		return e.show(t, n, "warning");
	}
	static error(t = "", n = 3e3) {
		return e.show(t, n, "error");
	}
	static hide(t) {
		if (t) {
			e.disposers.get(t)?.(), e.disposers.delete(t), t.classList.remove("is-shown"), t.classList.add("is-hidden");
			let n = t.dataset.toast;
			e._setTimer(n, "remove", () => {
				t.parentNode && t.parentNode.removeChild(t);
				let e = X(".j-toast-container");
				e && e.children.length === 0 && e.parentNode.removeChild(e);
			}, 300);
		}
	}
	static lite(t = "", n = 2e3) {
		G("Toast"), V("message", t, "string", "Toast.lite"), V("duration", n, mn, "Toast.lite");
		let r = X(".j-toast-lite");
		r && r.remove();
		let i = U(), a = P("div", {
			className: "j-toast-lite",
			"data-toast": i,
			children: t
		});
		return document.body.appendChild(a), e._setTimer(i, "show", () => a.classList.add("is-shown"), 10), e._setTimer(i, "hide", () => {
			a.classList.remove("is-shown"), a.classList.add("is-hidden"), e._setTimer(i, "remove", () => a.remove(), 300);
		}, n), a;
	}
	static action(t = "", n = {}) {
		G("Toast");
		let r = e._getOrCreateContainer(), i = U(), a = P("div", {
			className: "j-toast is-action",
			"data-toast": i,
			children: [P("div", {
				className: "toast-message",
				children: t
			}), P("div", {
				className: "toast-actions",
				children: [P("button", {
					className: "j-button is-sm is-ghost",
					children: n.text.cancel || "cancel",
					"data-action": "cancel",
					onClick: () => {
						a.classList.remove("is-shown"), a.classList.add("is-hidden"), e.hide(a);
					}
				}), P("button", {
					className: "j-button is-sm is-outline",
					children: n.text.action || "action",
					"data-action": "toast-action",
					onClick: async () => {
						await n.onAction?.(), e.hide(a);
					}
				})]
			})]
		});
		return r.appendChild(a), e._setTimer(i, "show", () => {
			a.classList.add("is-shown"), X("[data-action=\"toast-action\"]", a)?.focus();
		}, 10), a;
	}
	static _getOrCreateContainer() {
		let e = X(".j-toast-container");
		return e || (e = P("div", { className: "j-toast-container" }), document.body.appendChild(e)), e;
	}
	static _setTimer(t, n, r, i) {
		let a = `${t}-${n}`;
		return e.timers.add(a), B.start(a, i, () => {
			e.timers.delete(a), r();
		}), a;
	}
	static clearAll() {
		for (let t of e.timers) B.cancel(t);
		e.timers.clear();
		for (let t of e.disposers.values()) t();
		e.disposers.clear(), X(".j-toast-container")?.remove(), X(".j-toast-lite")?.remove();
	}
};
zt(hn, "timers", /* @__PURE__ */ new Set()), zt(hn, "disposers", /* @__PURE__ */ new Map());
//#endregion
//#region src/components/accordion.js
function gn(e = document) {
	e.querySelectorAll("[data-doc-component=\"accordion\"]").forEach((e) => {
		if (e.dataset.docReady === "true") return;
		let t = Array.from(e.querySelectorAll(":scope > [data-doc-accordion-item]"));
		if (!t.length) return;
		let n = t.map((e, t) => ({
			name: `item-${t}`,
			title: e.dataset.title || `面板 ${t + 1}`,
			content: e.innerHTML
		}));
		e.textContent = "", Kt(e, {
			collapsible: e.dataset.collapsible === "true",
			multiple: e.dataset.multiple === "true",
			items: n
		}).build(), e.dataset.docReady = "true";
	});
}
//#endregion
//#region src/components/offcanvas.js
function _n(e = document) {
	e.querySelectorAll("[data-doc-component=\"offcanvas\"]").forEach((e) => {
		if (e.dataset.docReady === "true") return;
		let t = e.querySelector("[data-doc-offcanvas-trigger]"), n = e.querySelector("[data-doc-offcanvas-content]");
		if (!t || !n) return;
		let r = Xt({
			direction: e.dataset.direction || "right",
			content: n.innerHTML
		});
		t.addEventListener("click", () => r.show()), e.dataset.docReady = "true";
	});
}
//#endregion
//#region src/components/tabs.js
function vn(e = document) {
	e.querySelectorAll("[data-doc-component=\"tabs\"]").forEach((e) => {
		if (e.dataset.docReady === "true") return;
		let t = Array.from(e.querySelectorAll(":scope > [data-doc-tab]"));
		if (!t.length) return;
		let n = t.map((e, t) => ({
			name: `tab-${t}`,
			title: e.dataset.title || `Tab ${t + 1}`,
			panel: e.innerHTML
		}));
		e.textContent = "", dn(e, { tabs: n }).build(), e.dataset.docReady = "true";
	});
}
//#endregion
//#region src/runtime.js
var yn = {
	accordion: gn,
	offcanvas: _n,
	tabs: vn
};
function bn(e = {}) {
	let t = Array.isArray(e.components) ? e.components : Object.keys(yn);
	for (let e of t) yn[e]?.(document);
}
//#endregion
export { bn as initDocPage };
