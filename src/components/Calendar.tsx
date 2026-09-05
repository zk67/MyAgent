'use client';

import { useEffect, useState } from 'react';
import "@/styles/calendar.css";
import { CalendarDay } from './CalendarDay'; 
import { CalendarEvent } from "@/types/types";

type CalendarProps = {
  refreshKey: number;
};

export function Calendar({ refreshKey }: CalendarProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Récupère les événements du mois affiché à chaque fois qu'on change de mois
  // ou qu'un événement vient d'être créé (refreshKey change)
  useEffect(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;

    fetch(`/api/calendar?year=${year}&month=${month}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Calendar request failed: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        setEvents(data.events || []);
      })
      .catch((error) => {
        console.error('Unable to load calendar events', error);
        setEvents([]);
      });
  }, [refreshKey, currentDate]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // --- Étape 1 : calculer combien de cases vides mettre avant le jour 1 ---
  // getDay() renvoie 0 pour Dimanche, 1 pour Lundi, etc.
  // Comme notre semaine commence un Lundi, on doit décaler ce chiffre.
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  let emptyCellsBeforeFirstDay: number;
  if (firstDayOfMonth === 0) {
    // Le mois commence un Dimanche → il faut 6 cases vides avant (Lun à Sam)
    emptyCellsBeforeFirstDay = 6;
  } else {
    // Sinon, le nombre de cases vides = position du jour - 1
    emptyCellsBeforeFirstDay = firstDayOfMonth - 1;
  }

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // --- Étape 2 : construire la liste complète des cases à afficher ---
  // On met "null" pour les cases vides, et le numéro du jour pour les vraies cases
  const days: (number | null)[] = [];

  for (let i = 0; i < emptyCellsBeforeFirstDay; i++) {
    days.push(null);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }

  // --- Nom du mois affiché en haut, ex: "Octobre 2026" ---
  const monthNameRaw = currentDate.toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  });
  const firstLetter = monthNameRaw.charAt(0).toUpperCase();
  const restOfName = monthNameRaw.slice(1);
  const monthName = firstLetter + restOfName;

  function previousMonth() {
    setCurrentDate(new Date(year, month - 1, 1));
  }

  function nextMonth() {
    setCurrentDate(new Date(year, month + 1, 1));
  }

  // Trouve tous les événements qui tombent sur un jour précis du mois affiché
  function getEventsForDay(day: number): CalendarEvent[] {
    return events.filter((event) => {
      let eventDate: Date | null = null;

      if (event.start.dateTime) {
        // Événement avec une heure précise (ex: réunion à 14h)
        eventDate = new Date(event.start.dateTime);
      } else if (event.start.date) {
        // Événement "journée entière" (juste une date, pas d'heure)
        eventDate = new Date(`${event.start.date}T00:00:00`);
      }

      if (!eventDate) return false;
      if (Number.isNaN(eventDate.getTime())) return false;

      const sameYear = eventDate.getFullYear() === year;
      const sameMonth = eventDate.getMonth() === month;
      const sameDay = eventDate.getDate() === day;

      return sameYear && sameMonth && sameDay;
    });
  }

  // Vérifie si un jour donné du mois affiché correspond à la date d'aujourd'hui
  function checkIsToday(day: number): boolean {
    const today = new Date();

    const sameYear = today.getFullYear() === year;
    const sameMonth = today.getMonth() === month;
    const sameDay = today.getDate() === day;

    return sameYear && sameMonth && sameDay;
  }

  return (
    <div className="panel calendar-window">
      <div className="calendar-header">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <h2>{monthName}</h2>
          <div className="calendar-nav-arrows">
            <button onClick={previousMonth} aria-label="Mois précédent">‹</button>
            <button onClick={nextMonth} aria-label="Mois suivant">›</button>
          </div>
        </div>

        <div className="view-toggle">
          <button className="active">Month</button>
          <button>Week</button>
          <button>Today</button>
        </div>
      </div>

      <div className="calendar-weekdays">
        <div>Lun</div>
        <div>Mar</div>
        <div>Mer</div>
        <div>Jeu</div>
        <div>Ven</div>
        <div>Sam</div>
        <div>Dim</div>
      </div>

      <div className="calendar-grid">
        {days.map((day, index) => {
          // Case vide (avant le 1er jour du mois) → pas de contenu, pas de bordure
          if (day === null) {
            return <div className="calendar-day-empty" key={`empty-${index}`} />;
          }

          // Vraie case de jour → on calcule ses événements et si c'est aujourd'hui
          const eventsForThisDay = getEventsForDay(day);
          const thisDayIsToday = checkIsToday(day);

          return (
            <CalendarDay
              key={`${year}-${month}-${day}`}
              day={day}
              events={eventsForThisDay}
              isToday={thisDayIsToday}
            />
          );
        })}
      </div>
    </div>
  );
}