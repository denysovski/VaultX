import { Link } from 'react-router';
import { Img } from '../components/Img';
import { HudGrid, Mark, Type } from '../components/Hud';
import { PHOTOGRAPHER } from '../data/looks';

const ROWS = [
  {
    image: 'look/scarf',
    alt: 'A young man in a white shirt and a printed scarf looking into the camera',
    title: 'Made for the night shift',
    text: 'VAULTX started in 2021 in a Prague flat, as clothes for friends who work late, ride the last tram and stay out until the city goes quiet. We still make every piece for them first.',
  },
  {
    image: 'look/cover-face',
    alt: 'A woman covering her face with her hand at a market',
    title: 'Heavy, black, built to last',
    text: 'Dense cotton, leather that gets better with age, knits that hold their shape. One colour, so everything works with everything. Small drops, no restocks, nothing designed to be thrown away.',
  },
  {
    image: 'look/reading',
    alt: 'A woman reading a magazine in a busy market',
    title: 'The bloc',
    text: 'The people around the brand are part of it: photographers, artists, designers, the ones who wear it every night. If you want to make something with us, there is a page for you.',
  },
];

export default function About() {
  return (
    <div className="about" data-theme="light">
      <header className="about__head">
        <h1 className="page-title">About us</h1>
        <p className="about__lead"><Type speed={10}>Clothing for the after-hours city. Designed and packed in Prague.</Type></p>
      </header>

      {ROWS.map((r, i) => (
        <section key={r.title} className={`about__row${i % 2 ? ' about__row--flip' : ''}`} aria-labelledby={`ab-${i}`}>
          <figure className="about__img glitch">
            <Img src={r.image} alt={r.alt} sizes="(min-width: 900px) 50vw, 100vw" priority={i === 0} />
            <HudGrid circles={false} />
          </figure>
          <div className="about__text">
            <h2 id={`ab-${i}`} className="mono">{r.title}</h2>
            <p>{r.text}</p>
          </div>
        </section>
      ))}

      <section className="about__collab" data-theme="dark" aria-labelledby="ab-collab">
        <Mark className="about__mark" />
        <h2 id="ab-collab" className="mono">Work with us</h2>
        <nav className="about__links" aria-label="Collaborations">
          <Link to="/collab/creators">Creators</Link>
          <Link to="/collab/artists">Artists</Link>
          <Link to="/collab/designers">Designers</Link>
          <Link to="/collab/outsiders">Outsiders</Link>
        </nav>
      </section>

      <p className="about__credit mono muted">
        Photos by <a href={PHOTOGRAPHER.url} target="_blank" rel="noopener noreferrer" className="text-link">{PHOTOGRAPHER.name}</a> on Unsplash
      </p>
    </div>
  );
}
