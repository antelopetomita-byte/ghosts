/* Ghosts service worker — push notifications only (no fetch caching, to avoid stale content) */
self.addEventListener('install', e=>{ self.skipWaiting(); });
self.addEventListener('activate', e=>{ e.waitUntil(self.clients.claim()); });

self.addEventListener('push', (event)=>{
  let data={title:'Ghosts', body:'新しいメッセージ'};
  try{ if(event.data) data=Object.assign(data, event.data.json()); }catch(e){}
  const opts={
    body:data.body, icon:'icon-192.png', badge:'icon-192.png',
    tag:data.tag||'ghosts-msg', renotify:true, data:{url:'./'}
  };
  event.waitUntil((async()=>{
    await self.registration.showNotification(data.title, opts);
    try{ if(self.navigator && self.navigator.setAppBadge) await self.navigator.setAppBadge(); }catch(e){}
  })());
});

self.addEventListener('notificationclick', (event)=>{
  event.notification.close();
  event.waitUntil((async()=>{
    const all=await self.clients.matchAll({type:'window', includeUncontrolled:true});
    for(const c of all){ if('focus' in c) return c.focus(); }
    if(self.clients.openWindow) return self.clients.openWindow('./');
  })());
});
