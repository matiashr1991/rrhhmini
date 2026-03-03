'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown } from 'lucide-react';

interface Employee {
    id: string;
    firstName: string;
    lastName: string;
    employeeKey: string;
    documentNumber?: string;
}

interface Props {
    employees: Employee[];
    value: string;
    onChange: (id: string) => void;
    placeholder?: string;
    required?: boolean;
}

export default function SearchableEmployeeSelect({ employees, value, onChange, placeholder = "Buscar empleado...", required }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    // Selected Employee details
    const selectedEmployee = useMemo(() => employees.find(e => String(e.id) === String(value)), [employees, value]);

    // When selection changes, clear the search text to show the placeholder/selected name nicely
    // Also, if someone types but doesn't select, we discard it on blur.

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearch(''); // clear search on close
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredEmployees = useMemo(() => {
        if (!search.trim()) return employees;
        const lowSearch = search.toLowerCase();
        return employees.filter(e =>
            e.lastName.toLowerCase().includes(lowSearch) ||
            e.firstName.toLowerCase().includes(lowSearch) ||
            e.employeeKey.toLowerCase().includes(lowSearch) ||
            (e.documentNumber && e.documentNumber.includes(lowSearch))
        );
    }, [employees, search]);

    return (
        <div className="relative w-full" ref={containerRef}>
            <div
                className={`w-full flex items-center border border-gray-300 rounded-lg p-2 bg-white cursor-text focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500`}
                onClick={() => setIsOpen(true)}
            >
                <Search size={16} className="text-gray-400 mr-2" />

                {/* Visual Fake Input for when something is selected AND we are NOT searching */}
                {!isOpen && selectedEmployee ? (
                    <div className="flex-1 truncate text-gray-900 select-none">
                        {selectedEmployee.lastName}, {selectedEmployee.firstName} ({selectedEmployee.documentNumber || selectedEmployee.employeeKey})
                    </div>
                ) : (
                    <input
                        type="text"
                        className="flex-1 outline-none bg-transparent text-gray-900 w-full placeholder-gray-400"
                        placeholder={isOpen ? "Escribe para buscar..." : selectedEmployee ? "" : placeholder}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onFocus={() => setIsOpen(true)}
                        required={required && !value} // Only HTML-required if nothing is selected
                    />
                )}

                <ChevronDown size={16} className="text-gray-400 ml-2 cursor-pointer" onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }} />
            </div>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredEmployees.length === 0 ? (
                        <div className="p-3 text-sm text-gray-500 text-center">No se encontraron empleados.</div>
                    ) : (
                        <ul className="py-1">
                            {filteredEmployees.map(emp => (
                                <li
                                    key={emp.id}
                                    className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 transition-colors ${value === emp.id ? 'bg-blue-100 text-blue-900 font-medium' : 'text-gray-900'}`}
                                    onClick={() => {
                                        onChange(emp.id);
                                        setIsOpen(false);
                                        setSearch('');
                                    }}
                                >
                                    <div className="font-medium">{emp.lastName}, {emp.firstName}</div>
                                    <div className="text-xs text-gray-500 flex gap-2">
                                        {emp.documentNumber && <span>DNI: {emp.documentNumber}</span>}
                                        <span>Legajo: {emp.employeeKey}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}
