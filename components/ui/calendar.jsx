"use client";

import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

export default function DarkCalendar({
  value,
  onChange,
  minDate,
  maxDate,
}) {
  return (
    <div className="dark-calendar">
      <Calendar
        value={value}
        onChange={onChange}
        minDate={minDate}
        maxDate={maxDate}
        locale="es-ES"
        calendarType="gregory"
        next2Label={null}
        prev2Label={null}
      />

      {/* ESTILOS */}
      <style jsx global>{`
        .dark-calendar {
          background: #0a0a0a;
          padding: 16px;
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .react-calendar {
          background: transparent;
          border: none;
          color: white;
          width: 100%;
        }

        /* ---------- HEADER ---------- */
        .react-calendar__navigation button {
          background: transparent !important;
          color: white;
          border-radius: 8px;
        }

        .react-calendar__navigation button:focus,
        .react-calendar__navigation button:active {
          background: transparent !important;
          box-shadow: none !important;
        }

        .react-calendar__navigation button:hover {
          background: rgba(255, 255, 255, 0.1) !important;

        }
          
        /* ---------- DAYS HEADER ---------- */
        .react-calendar__month-view__weekdays {
          display: grid !important;
          grid-template-columns: repeat(7, 1fr);
          text-align: center;
          margin-bottom: 8px;
        }

        .react-calendar__month-view__weekdays__weekday {
          font-size: 12px;
          color: #9ca3af;
          text-transform: capitalize;
        }

        /* ---------- DAYS GRID ---------- */
        .react-calendar__month-view__days {
          display: grid !important;
          grid-template-columns: repeat(7, 1fr);
          gap: 6px;
        }

        .react-calendar__tile {
          background: transparent;
          color: white;
          border-radius: 8px;
          padding: 10px 0;
          font-size: 14px;
        }

        .react-calendar__tile:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .react-calendar__tile--now {
          border: 1px solid rgba(255, 255, 255, 0.4);
        }

        .react-calendar__tile--active {
          background: white !important;
          color: black !important;
        }

        .react-calendar__tile:disabled {
          color: rgba(255, 255, 255, 0.2);
          background: transparent;
        }
      `}</style>
    </div>
  );
}
