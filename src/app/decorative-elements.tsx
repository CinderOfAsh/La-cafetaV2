'use client';

import { useEffect } from 'react';

export function DecorativeElements() {
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => e.target.classList.toggle('visible', e.isIntersecting));
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const follower = document.querySelector('.cursor-follower') as HTMLElement;
    if (!follower) return;
    const handleMouse = (e: MouseEvent) => {
      follower.style.transform = `translate(${e.clientX - 4}px, ${e.clientY - 4}px)`;
    };
    window.addEventListener('mousemove', handleMouse);
    return () => window.removeEventListener('mousemove', handleMouse);
  }, []);

  return (
    <>
      <div className="fixed inset-0 pointer-events-none z-0" style={{
        backgroundImage: 'url(/assets/noise-texture.svg)',
        backgroundRepeat: 'repeat',
        backgroundSize: '100px 100px',
        opacity: 0.4,
        mixBlendMode: 'overlay'
      }} />
      <div className="fixed -bottom-20 -right-20 w-[400px] h-[280px] pointer-events-none z-0 opacity-[0.08] rotate-12">
        <img src="/assets/deco-blob-1.svg" alt="" className="w-full h-full" />
      </div>
      <div className="fixed -top-20 -left-20 w-[350px] h-[260px] pointer-events-none z-0 opacity-[0.06] -rotate-6">
        <img src="/assets/deco-blob-2.svg" alt="" className="w-full h-full" />
      </div>
      <div className="cursor-follower" />
    </>
  );
}
