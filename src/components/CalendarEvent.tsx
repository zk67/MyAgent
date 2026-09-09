// 'use client';
// import '@/styles/calendar.css';
// import { CalendarEvent as CalendarEventData } from "@/types/types";

// type CalendarEventProps = {
//   event: CalendarEventData;
//   compact?: boolean;
// };

// export function CalendarEvent({
//   event,
//   compact = false,
// }: CalendarEventProps) {

//   const title = event.summary || '(Sans titre)';

//   // Google peut utiliser dateTime OU date pour les événements toute la journée
//   const startValue = event.start.dateTime || event.start.date;
//   const endValue = event.end.dateTime || event.end.date;

//   const startDate = startValue ? new Date(startValue) : null;
//   const endDate = endValue ? new Date(endValue) : null;

//   const isAllDay = !!event.start.date;

//   const formatTime = (date: Date | null) => {
//     if (!date) return '';

//     return date.toLocaleTimeString('fr-CA', {
//       hour: '2-digit',
//       minute: '2-digit',
//     });
//   };

//   // Version compacte pour la vue Mois
//   if (compact) {
//     return (
//       <div className="calendar-event calendar-event-compact">
//         {!isAllDay && startDate && (
//           <span className="calendar-event-time">
//             {formatTime(startDate)}
//           </span>
//         )}

//         <span className="calendar-event-title">
//           {title}
//         </span>
//       </div>
//     );
//   }

//   // Version complète
//   return (
//     <div className="calendar-event">

//       <div className="calendar-event-main">

//         <h3 className="calendar-event-title">
//           {title}
//         </h3>

//         <div className="calendar-event-time">
//           {isAllDay ? (
//             <span>Toute la journée</span>
//           ) : (
//             <span>
//               {formatTime(startDate)}
//               {endDate && ` – ${formatTime(endDate)}`}
//             </span>
//           )}
//         </div>

//       </div>

//       {event.description && (
//         <p className="calendar-event-description">
//           {event.description}
//         </p>
//       )}a

//     </div>
//   );
// }