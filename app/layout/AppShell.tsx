import type {ReactNode} from 'react';

/** Three columns (left, centre, right) under a header, plus an optional drawer over the right column. */
export function AppShell(props: {header: ReactNode; left: ReactNode; center: ReactNode; right: ReactNode; drawer?: ReactNode; leftOpen: boolean; rightOpen: boolean}) {
  return (
    <main className="shell">
      {props.header}
      <aside className={`left ${props.leftOpen ? 'open' : ''}`} aria-label="Navegação">{props.left}</aside>
      <section className="center" aria-label="Modelo 3D">{props.center}</section>
      <aside className={`right ${props.rightOpen ? 'open' : ''}`} aria-label="Detalhes">{props.right}</aside>
      {props.drawer}
    </main>
  );
}
