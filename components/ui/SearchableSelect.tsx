
"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, Check } from "lucide-react";

interface Option {
    id: string;
    name: string;
}

interface SearchableSelectProps {
    label: string;
    options: Option[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
}

export default function SearchableSelect({
    label,
    options,
    value,
    onChange,
    placeholder = "Select...",
    disabled = false
}: SearchableSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(opt => opt.id === value);

    // Close when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredOptions = options.filter(opt =>
        opt.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="relative" ref={containerRef}>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">
                {label}
            </label>

            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={`w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-left flex items-center justify-between transition-all outline-none focus:ring-2 focus:ring-black/5 ${disabled ? "opacity-60 cursor-not-allowed" : "hover:bg-gray-100"
                    }`}
            >
                <span className={selectedOption ? "text-black" : "text-gray-500"}>
                    {selectedOption ? selectedOption.name : placeholder}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {isOpen && (
                <div className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top">
                    <div className="p-2 border-b border-gray-100 sticky top-0 bg-white">
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search..."
                                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-black/5"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                autoFocus
                            />
                        </div>
                    </div>

                    <div className="max-h-60 overflow-y-auto custom-scrollbar">
                        {/* "Any" Option */}
                        <button
                            type="button"
                            onClick={() => {
                                onChange("any");
                                setIsOpen(false);
                                setSearchTerm("");
                            }}
                            className={`w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors flex items-center justify-between ${value === "any" ? "bg-gray-50 text-black font-semibold" : "text-gray-600"
                                }`}
                        >
                            <span>Any</span>
                            {value === "any" && <Check className="w-4 h-4 text-emerald-500" />}
                        </button>

                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((opt) => (
                                <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() => {
                                        onChange(opt.id);
                                        setIsOpen(false);
                                        setSearchTerm("");
                                    }}
                                    className={`w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors flex items-center justify-between ${opt.id === value ? "bg-gray-50 text-black font-semibold" : "text-gray-600"
                                        }`}
                                >
                                    <span className="truncate pr-2">{opt.name}</span>
                                    {opt.id === value && <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
                                </button>
                            ))
                        ) : (
                            <div className="p-4 text-center text-sm text-gray-400">
                                No results found.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
