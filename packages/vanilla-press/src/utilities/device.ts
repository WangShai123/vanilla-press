export function deviceClassBootScript(): string {
  return `(function(w,d){try{var n=w.navigator||{},u=n.userAgent||'',m=n.userAgentData&&n.userAgentData.mobile;if(typeof m!=='boolean'){m=/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobi/i.test(u)||((n.platform==='MacIntel'||/Macintosh/i.test(u))&&n.maxTouchPoints>1)}var h=d.documentElement;if(!h)return;h.classList.remove('desktop','mobile');h.classList.add(m?'mobile':'desktop')}catch(e){try{d.documentElement.classList.add('desktop')}catch(x){}}})(window,document);`
}
