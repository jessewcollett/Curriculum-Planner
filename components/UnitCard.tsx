import React from 'react';
import type { Unit } from '../types';
import { XMarkIcon, LockClosedIcon } from './icons';

interface UnitCardProps {
    unit: Unit;
    isDraggable: boolean;
    onDragStart: (e: React.DragEvent) => void;
    onDragEnter?: (e: React.DragEvent, id: string) => void;
    onDrop?: (e: React.DragEvent, id: string) => void;
    onDaysChange?: (id: string, days: number) => void;
    onRemove?: (id: string) => void;
    onUnlock?: () => void;
    isEnsembleUnitUnlocked?: boolean;
    onSelectTask?: (id: string) => void;
    isBankCard?: boolean;
}

export const UnitCard: React.FC<UnitCardProps> = ({
    unit,
    isDraggable,
    onDragStart,
    onDragEnter,
    onDrop,
    onDaysChange,
    onRemove,
    onUnlock,
    isEnsembleUnitUnlocked = false,
    onSelectTask,
    isBankCard = false,
}) => {
    const categoryStyles = {
        'Performance': {
            bank: 'bg-blue-100 border-blue-200 text-blue-800 hover:bg-blue-200',
            planner: 'border-blue-500 bg-[#3c78d8]'
        },
        'Technical Theatre': {
            bank: 'bg-orange-100 border-orange-200 text-orange-800 hover:bg-orange-200',
            planner: 'border-orange-500 bg-[#fca547]'
        },
        'Other': {
            bank: 'bg-purple-100 border-purple-200 text-purple-800 hover:bg-purple-200',
            planner: 'border-purple-500 bg-[#6e5a9e]'
        }
    };

    const lockedStyle = 'bg-gray-500 border-gray-600';
    const isLockedUnit = unit.id === 'unit-locked-ensemble';
    const isCurrentlyLocked = isLockedUnit && !isEnsembleUnitUnlocked;

    if (isBankCard) {
        return (
            <div
                draggable={isDraggable}
                onDragStart={onDragStart}
                className={`px-3 py-1 rounded-full border text-sm font-semibold ${categoryStyles[unit.category].bank} cursor-grab active:cursor-grabbing transition-colors`}
            >
                {unit.title}
            </div>
        );
    }
    
    return (
        <div
            className={`relative w-40 h-52 sm:w-48 sm:h-56 p-3 rounded-lg shadow-md flex flex-col text-white ${isLockedUnit ? lockedStyle : categoryStyles[unit.category].planner} ${isDraggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
            draggable={isDraggable}
            onDragStart={isDraggable ? onDragStart : undefined}
            onDragEnter={onDragEnter ? (e) => onDragEnter(e, unit.id) : undefined}
            onDrop={onDrop ? (e) => onDrop(e, unit.id) : undefined}
        >
            {onRemove && (
                <button 
                    onClick={
                        isCurrentlyLocked
                            ? (e) => { e.stopPropagation(); onUnlock?.(); }
                            : (e) => { e.stopPropagation(); onRemove?.(unit.id); }
                    }
                    className="absolute top-1 right-1 p-1 rounded-full bg-black bg-opacity-20 hover:bg-opacity-40 transition z-10"
                    aria-label={isCurrentlyLocked ? `Unlock ${unit.title} unit` : `Remove ${unit.title} unit`}
                >
                    {isCurrentlyLocked ? (
                        <LockClosedIcon className="w-4 h-4 text-white" />
                    ) : (
                        <XMarkIcon className="w-4 h-4 text-white" />
                    )}
                </button>
            )}

            <div className="flex justify-between items-start">
                <h4 className="font-montserrat font-bold pr-5">{unit.title}</h4>
            </div>
            <button 
                className="flex-grow mt-2 text-left text-xs bg-black bg-opacity-20 p-2 rounded hover:bg-opacity-30 transition cursor-pointer w-full" 
                onDragOver={(e) => e.preventDefault()}
                onClick={() => onSelectTask?.(unit.id)}
            >
                <p className="font-bold mb-1">Summative:</p>
                <p className={!unit.task ? 'italic opacity-70' : ''}>
                    {unit.task || 'Click to select...'}
                </p>
            </button>
            {onDaysChange && (
                <div className="mt-2">
                    <label className="text-xs font-bold">Days:</label>
                    <input
                        type="number"
                        value={unit.days}
                        onChange={(e) => onDaysChange?.(unit.id, parseInt(e.target.value, 10))}
                        onClick={e => e.stopPropagation()} // Prevent modal from opening when clicking input
                        className="w-full text-center bg-white/30 text-white placeholder-white/80 border-none p-1 rounded-md focus:outline-none focus:ring-2 focus:ring-white focus:bg-white/50 transition duration-150"
                        disabled={isLockedUnit}
                    />
                </div>
            )}
        </div>
    );
};