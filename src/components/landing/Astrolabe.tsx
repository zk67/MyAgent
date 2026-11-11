'use client';

import { useEffect, useState } from 'react';

const CENTER = 200;
const NUMERALS = [
  { text: 'XII', angle: 0 },
  { text: 'III', angle: 90 },
  { text: 'VI', angle: 180 },
  { text: 'IX', angle: 270 },
];

// Point on a circle around the center. 0° is at the top, angles go clockwise.
// Rounded so the server and the browser compute exactly the same numbers.
function pointAt(radius: number, angleInDegrees: number) {
  const angle = ((angleInDegrees - 90) * Math.PI) / 180;
  const round = (value: number) => Math.round(value * 100) / 100;
  return { x: round(CENTER + radius * Math.cos(angle)), y: round(CENTER + radius * Math.sin(angle)) };
}

// Angle of the hour hand for the current time, on a 12-hour dial.
function currentHourAngle() {
  const now = new Date();
  return ((now.getHours() % 12) + now.getMinutes() / 60) * 30;
}

// An engraved astrolabe whose single hand shows the real time.
export function Astrolabe() {
  // The hand is only drawn in the browser, so the server and client HTML match.
  const [handAngle, setHandAngle] = useState<number | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHandAngle(currentHourAngle());
    const timer = setInterval(() => setHandAngle(currentHourAngle()), 60_000);
    return () => clearInterval(timer);
  }, []);

  // 48 ticks: a long one every hour, a short one every half hour.
  const ticks = Array.from({ length: 48 }, (_, index) => {
    const angle = index * 7.5;
    const isHour = index % 4 === 0;
    const outer = pointAt(186, angle);
    const inner = pointAt(isHour ? 170 : 178, angle);
    return <line key={index} x1={outer.x} y1={outer.y} x2={inner.x} y2={inner.y} strokeWidth={isHour ? 1.4 : 0.8} />;
  });

  const handTip = handAngle === null ? null : pointAt(148, handAngle);

  return (
    <svg className="astrolabe" viewBox="0 0 400 400" role="img" aria-label="An astrolabe showing the current time">
      <g className="astrolabe-lines" fill="none">
        <circle cx={CENTER} cy={CENTER} r={196} strokeWidth={1.4} />
        <circle cx={CENTER} cy={CENTER} r={186} strokeWidth={0.8} />
        {ticks}
        <circle cx={CENTER} cy={CENTER} r={128} strokeWidth={0.8} />
        <circle cx={CENTER} cy={CENTER} r={92} strokeWidth={0.8} strokeDasharray="2 5" />
        {/* The rete: two offset circles, as on a real astrolabe */}
        <circle cx={CENTER} cy={CENTER - 34} r={104} strokeWidth={0.8} />
        <circle cx={CENTER} cy={CENTER + 54} r={62} strokeWidth={0.8} />
        <line x1={CENTER} y1={14} x2={CENTER} y2={386} strokeWidth={0.6} />
        <line x1={14} y1={CENTER} x2={386} y2={CENTER} strokeWidth={0.6} />
      </g>

      {NUMERALS.map(({ text, angle }) => {
        const { x, y } = pointAt(150, angle);
        return (
          <text key={text} className="astrolabe-numeral" x={x} y={y} textAnchor="middle" dominantBaseline="central">
            {text}
          </text>
        );
      })}

      {handTip && <line className="astrolabe-hand" x1={CENTER} y1={CENTER} x2={handTip.x} y2={handTip.y} />}
      <circle className="astrolabe-pin" cx={CENTER} cy={CENTER} r={5} />
    </svg>
  );
}
