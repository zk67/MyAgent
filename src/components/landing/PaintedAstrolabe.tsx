import Image from 'next/image';
import { Astrolabe } from '@/components/landing/Astrolabe';
import painting from '../../../public/death-of-caesar.jpg';

// "The Death of Caesar" set inside the astrolabe, like a round Renaissance painting (a tondo),
// with a small museum label underneath.
export function PaintedAstrolabe() {
  return (
    <figure className="painted-astrolabe">
      <div className="painted-astrolabe-canvas">
        <Image src={painting} alt="The Death of Caesar, painted by Jean-Léon Gérôme" fill priority sizes="420px" />
      </div>
      <Astrolabe />
      <figcaption>
        <em>The Death of Caesar</em> Jean-Léon Gérôme, 1867
      </figcaption>
    </figure>
  );
}
