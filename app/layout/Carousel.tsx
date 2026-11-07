import {useEffect, useRef, useState, type ReactNode} from 'react';
import {ChevronLeft, ChevronRight} from 'lucide-react';

/**
 * Horizontal strip that scrolls with the mouse wheel, by dragging, by its arrows or by the scrollbar.
 * A drag never counts as a click on the card under the pointer.
 */
export function Carousel(props: {children: ReactNode; label: string}) {
  const strip = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({start: true, end: false});

  useEffect(() => {
    const el = strip.current!;
    const update = () => setEdges({start: el.scrollLeft <= 2, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 2});
    // A plain vertical wheel over the strip moves it sideways (trackpads already scroll horizontally).
    const wheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX) || el.scrollWidth <= el.clientWidth) return;
      const atEdge = (e.deltaY < 0 && el.scrollLeft <= 0) || (e.deltaY > 0 && el.scrollLeft + el.clientWidth >= el.scrollWidth - 1);
      if (atEdge) return; // let the sidebar scroll on
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };
    // Mouse drag; touch keeps its native swipe.
    let drag: {x: number; left: number; moved: boolean} | null = null;
    const down = (e: PointerEvent) => { if (e.pointerType === 'mouse' && e.button === 0) drag = {x: e.clientX, left: el.scrollLeft, moved: false}; };
    const move = (e: PointerEvent) => {
      if (!drag) return;
      const dx = e.clientX - drag.x;
      if (!drag.moved && Math.abs(dx) < 5) return;
      if (!drag.moved) { drag.moved = true; el.setPointerCapture(e.pointerId); el.classList.add('dragging'); }
      el.scrollLeft = drag.left - dx;
    };
    const up = () => {
      if (drag?.moved) {
        el.classList.remove('dragging');
        // Swallow the click that follows the drag.
        const swallow = (ev: MouseEvent) => { ev.stopPropagation(); ev.preventDefault(); };
        el.addEventListener('click', swallow, {capture: true, once: true});
        setTimeout(() => el.removeEventListener('click', swallow, {capture: true}), 0);
      }
      drag = null;
    };
    el.addEventListener('scroll', update, {passive: true});
    el.addEventListener('wheel', wheel, {passive: false});
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    const observer = new ResizeObserver(update); observer.observe(el); update();
    return () => {
      observer.disconnect();
      el.removeEventListener('scroll', update);
      el.removeEventListener('wheel', wheel);
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
    };
  }, []);

  const page = (dir: 1 | -1) => strip.current?.scrollBy({left: dir * strip.current.clientWidth * 0.8, behavior: 'smooth'});
  return (
    <div className="carousel-wrap">
      <div className="carousel" ref={strip} role="group" aria-label={props.label}>{props.children}</div>
      {!edges.start && <button className="carousel-arrow prev" onClick={() => page(-1)} aria-label="Ver anteriores"><ChevronLeft size={16} /></button>}
      {!edges.end && <button className="carousel-arrow next" onClick={() => page(1)} aria-label="Ver mais"><ChevronRight size={16} /></button>}
    </div>
  );
}
