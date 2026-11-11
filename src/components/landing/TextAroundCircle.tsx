'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';
import { prepareWithSegments, layoutNextLine, type LayoutCursor, type PreparedTextWithSegments } from '@chenglou/pretext';

type Props = {
  text: string;
  circle: ReactNode;
  children?: ReactNode; // shown right after the text, e.g. a button
};

const GAP = 28; // space between the text and the circle
const NARROW_SCREEN = 640; // below this, the circle goes above the text

// How far left the circle reaches inside one line of text.
// Returns null when the line passes above or below the circle.
function circleLeftEdge(lineTop: number, lineBottom: number, centerX: number, centerY: number, radius: number) {
  // Distance from the circle's center to the closest point of the line.
  const distance = centerY < lineTop ? lineTop - centerY : centerY > lineBottom ? centerY - lineBottom : 0;
  if (distance >= radius) return null;

  return centerX - Math.sqrt(radius * radius - distance * distance);
}

// A paragraph that flows around a circle, line by line, using Pretext.
// Before the browser has measured the text, it shows as a normal paragraph.
export function TextAroundCircle({ text, circle, children }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [lines, setLines] = useState<string[] | null>(null);
  const [radius, setRadius] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let prepared: PreparedTextWithSegments | null = null;

    function layOutLines(box: HTMLDivElement) {
      const style = getComputedStyle(box);
      const lineHeight = parseFloat(style.lineHeight);
      const width = box.clientWidth;
      const circleRadius = width > NARROW_SCREEN ? Math.min(210, width * 0.3) : 0;

      // Measuring is the slow part, so it is done only once.
      prepared ??= prepareWithSegments(text, `${style.fontSize} ${style.fontFamily}`);

      // The circle sits in the top-right corner.
      const centerX = width - circleRadius;
      const centerY = circleRadius;

      const newLines: string[] = [];
      let cursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 };

      while (true) {
        const lineTop = newLines.length * lineHeight;
        const edge = circleRadius ? circleLeftEdge(lineTop, lineTop + lineHeight, centerX, centerY, circleRadius) : null;
        const maxWidth = edge === null ? width : edge - GAP;

        const line = layoutNextLine(prepared, maxWidth, cursor);
        if (line === null) break;

        newLines.push(line.text);
        cursor = line.end;
      }

      setLines(newLines);
      setRadius(circleRadius);
    }

    // Wait for the fonts, otherwise the text would be measured with the fallback font.
    const observer = new ResizeObserver(() => layOutLines(container));
    document.fonts.ready.then(() => {
      try {
        layOutLines(container);
        observer.observe(container);
      } catch (error) {
        console.error('Unable to lay out the text around the circle', error);
      }
    });

    return () => observer.disconnect();
  }, [text]);

  return (
    <div
      ref={containerRef}
      className={`text-around-circle ${lines && !radius ? 'is-stacked' : ''}`}
      style={{ minHeight: radius * 2 }}
    >
      <div className="text-around-circle-shape" style={radius ? { width: radius * 2, height: radius * 2 } : undefined}>
        {circle}
      </div>

      {lines ? (
        <p>
          {lines.map((line, index) => <span key={index}>{line}</span>)}
        </p>
      ) : (
        <p>{text}</p>
      )}

      {children}
    </div>
  );
}
