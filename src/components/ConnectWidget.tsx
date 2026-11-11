'use client';

import { motion } from 'motion/react';
import { PaintedAstrolabe } from '@/components/landing/PaintedAstrolabe';
import { TextAroundCircle } from '@/components/landing/TextAroundCircle';
import '@/styles/connectwidget.css';

const INTRO =
  'Leave the deadlines to MyAgent and keep your mind for the work that matters. ' +
  'Hand it a syllabus or an exam schedule and it fills your Google Calendar, class by class. ' +
  'Ask about your week in your own words. Nothing leaves your calendar unless you say so.';

// Google sign-in opens in a centered popup. The main page listens for its success message.
function openGoogleSignIn() {
  const width = 500;
  const height = 700;
  const left = window.screenX + (window.outerWidth - width) / 2;
  const top = window.screenY + (window.outerHeight - height) / 2;
  window.open('/api/auth/login', 'Google-Authentification', `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`);
}

// The page people see before connecting their calendar.
export function ConnectWidget() {
  return (
    <section className="landing">
      <div className="landing-hero">
        <h1 className="landing-title">
          <motion.span initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            Your semester,
          </motion.span>
          <motion.span initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.12 }}>
            in <em>order</em>.
          </motion.span>
        </h1>

        <TextAroundCircle text={INTRO} circle={<PaintedAstrolabe />}>
          <button type="button" className="button-primary landing-connect" onClick={openGoogleSignIn}>
            Let&apos;s get started
          </button>
        </TextAroundCircle>
      </div>
    </section>
  );
}
