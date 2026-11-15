import { Link, useParams } from 'react-router';
import { Img } from '../components/Img';
import { HudGrid, Mark } from '../components/Hud';
import NotFound from './NotFound';

export const COLLAB = {
  creators: {
    title: 'For creators',
    lead: 'You make videos, photos or posts people actually watch. We want VAULTX seen in your world, not in an ad.',
    what: ['Seeding: pieces from each drop before they go live', 'Paid campaigns for short video and photo series', 'A personal code for your audience, with commission on every order', 'Early access to drops for your community'],
    need: ['Links to your channels and two or three pieces you are proud of', 'Where your audience lives (city, country)', 'What you would make with VAULTX'],
    image: 'look/concert',
    alt: 'A crowd at a concert holding up phones',
    topic: 'collab-creators',
  },
  artists: {
    title: 'For artists',
    lead: 'Painters, illustrators, photographers, tattoo artists. Every season one artist takes over a capsule: prints, labels, packaging, the lookbook.',
    what: ['A capsule of three to five pieces built around your work', 'Your name on the label and in the shop', 'A fee plus a share of every piece sold', 'A launch event in Prague'],
    need: ['A portfolio link or a PDF', 'A short note on what the city at night means to you', 'Your rough availability for the next six months'],
    image: 'look/suit',
    alt: 'A man in a dark suit with his hands on his face against a wall',
    topic: 'collab-artists',
  },
  designers: {
    title: 'For designers',
    lead: 'Fashion, product and digital designers. Help us invent the next garments, or build new features for this store.',
    what: ['Garment design: patterns, fabrics, details for upcoming drops', 'Digital design: new store features, interactions, tools for customers', 'Paid project work, remote or in the Prague studio', 'Credit on everything you ship with us'],
    need: ['A portfolio with process, not only final shots', 'Which side you want: garments or digital', 'One idea you would bring to VAULTX'],
    image: 'look/rings',
    alt: 'Close-up of hands with silver rings on a black shirt',
    topic: 'collab-designers',
  },
  outsiders: {
    title: 'For outsiders',
    lead: 'Not a creator, artist or designer, but you have an idea that does not fit anywhere else? That is exactly what we want to hear.',
    what: ['Events, spaces, music, film, anything that fits the after-hours city', 'Shop takeovers and pop-ups', 'Repairs, upcycling and second life for old pieces'],
    need: ['A few lines about you and the idea', 'Links or pictures if you have them'],
    image: 'look/car',
    alt: 'A woman in black posing in the back seat of a dark car',
    topic: 'collab-other',
  },
} as const;

export type CollabGroup = keyof typeof COLLAB;

export default function Collab() {
  const { group = '' } = useParams();
  const c = COLLAB[group as CollabGroup];
  if (!c) return <NotFound />;
  const others = (Object.keys(COLLAB) as CollabGroup[]).filter((k) => k !== group);
  return (
    <div className="collab" data-theme="light">
      <p className="page-title"><Link to="/about">About us</Link> / Collaborations</p>
      <div className="collab__grid">
        <div className="collab__text stagger">
          <h1 className="collab__title">{c.title}</h1>
          <p className="collab__lead">{c.lead}</p>
          <h2 className="mono">What we offer</h2>
          <ul className="collab__list">{c.what.map((w) => <li key={w}>{w}</li>)}</ul>
          <h2 className="mono">What to send</h2>
          <ul className="collab__list">{c.need.map((w) => <li key={w}>{w}</li>)}</ul>
          <h2 className="mono">Contact</h2>
          <dl className="kv">
            <div><dt className="mono">Studio</dt><dd>Prague, Czech Republic</dd></div>
            <div><dt className="mono">Hours</dt><dd>Mon to Fri, 9:00 to 18:00 CET</dd></div>
            <div><dt className="mono">Reply</dt><dd>Within two working days</dd></div>
          </dl>
          <Link to={`/help?topic=${c.topic}#contact`} className="btn">Write to the studio</Link>
        </div>
        <figure className="collab__img glitch">
          <Img src={c.image} alt={c.alt} sizes="(min-width: 900px) 40vw, 100vw" priority />
          <HudGrid circles={false} />
          <Mark className="collab__mark" />
        </figure>
      </div>
      <nav className="collab__others" aria-label="Other collaborations">
        {others.map((k) => <Link key={k} to={`/collab/${k}`} className="cats__link">{COLLAB[k].title}</Link>)}
      </nav>
    </div>
  );
}
