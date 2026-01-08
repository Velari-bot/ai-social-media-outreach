
"use client";

import { useState } from 'react';
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    isSameMonth,
    isSameDay,
    addDays,
    eachDayOfInterval,
    isBefore,
    startOfDay
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SimpleCalendarProps {
    selectedDate: Date | undefined;
    onSelect: (date: Date) => void;
    availableDates?: string[]; // Dates that have available slots (optional optimization)
}

export default function SimpleCalendar({ selectedDate, onSelect, availableDates }: SimpleCalendarProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const today = startOfDay(new Date());

    const onNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const onPrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const calendarDays = eachDayOfInterval({
        start: startDate,
        end: endDate,
    });

    const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    return (
        <div className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">
                    {format(currentMonth, 'MMMM yyyy')}
                </h2>
                <div className="flex space-x-2">
                    <button
                        onClick={onPrevMonth}
                        disabled={isBefore(endOfMonth(subMonths(currentMonth, 1)), startOfMonth(today))}
                        className="p-2 hover:bg-gray-100 rounded-full text-gray-600 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <button
                        onClick={onNextMonth}
                        className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 text-center mb-2">
                {weekDays.map(day => (
                    <div key={day} className="text-xs font-semibold text-gray-400 uppercase tracking-wide py-2">
                        {day}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, dayIdx) => {
                    const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
                    const isToday = isSameDay(day, today);
                    const isPast = isBefore(day, today);
                    const isCurrentMonth = isSameMonth(day, currentMonth);

                    // We can check availableDates here if provided to gray out unavailable days
                    // For now, simpler: disable past days and weekends (if business only)
                    const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                    const isDisabled = isPast || isWeekend;

                    return (
                        <button
                            key={day.toString()}
                            onClick={() => !isDisabled && onSelect(day)}
                            disabled={isDisabled}
                            className={`
                aspect-square flex items-center justify-center rounded-full text-sm font-medium transition-all duration-200
                ${isSelected
                                    ? 'bg-black text-white shadow-md scale-105'
                                    : isDisabled
                                        ? 'text-gray-300 cursor-not-allowed'
                                        : 'text-gray-700 hover:bg-gray-100 hover:text-black'}
                ${!isCurrentMonth && !isSelected ? 'text-gray-300' : ''}
                ${isToday && !isSelected ? 'ring-1 ring-black/20 font-bold' : ''}
              `}
                        >
                            {format(day, 'd')}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
