import React, { useState } from 'react';
import { SUMMATIVE_ASSESSMENTS } from '../constants';
import type { AssessmentCategory, DragData } from '../types';
import { ChevronUpIcon, ChevronDownIcon, PlusIcon } from './icons';

interface AssessmentBankProps {
    onDragStart: (e: React.DragEvent, data: DragData) => void;
    customTask: string;
    onCustomTaskChange: (value: string) => void;
    customTasks: string[];
    onAddCustomTask: () => void;
}

const getDefaultCollapsedState = () => {
    const initialState: Record<string, boolean> = {};
    SUMMATIVE_ASSESSMENTS.forEach(category => {
        initialState[category.category] = true; // Collapse main category
        category.groups.forEach(group => {
            const groupKey = `${category.category}-${group.groupName}`;
            initialState[groupKey] = true; // Collapse sub-category
        });
    });
    return initialState;
};

export const AssessmentBank: React.FC<AssessmentBankProps> = ({ 
    onDragStart,
    customTask,
    onCustomTaskChange,
    customTasks,
    onAddCustomTask
}) => {
    const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>(getDefaultCollapsedState);

    const toggleSection = (sectionKey: string) => {
        setCollapsedSections(prev => ({ ...prev, [sectionKey]: !prev[sectionKey] }));
    };

    const handleDragStart = (e: React.DragEvent, task: string) => {
      const dragData: DragData = { type: 'assessment', task };
      onDragStart(e, dragData);
    };
    
    return (
        <div className="flex flex-col h-full">
            <h2 className="text-2xl font-montserrat mb-4 text-gray-800 flex-shrink-0">Assessment Bank</h2>
            <div className="flex-shrink-0 mb-4">
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={customTask} 
                        onChange={e => onCustomTaskChange(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && onAddCustomTask()}
                        placeholder="Add a custom assessment..." 
                        className="flex-grow p-2 text-sm rounded-lg border border-gray-300 shadow-sm w-full bg-white focus:ring-2 focus:ring-blue-500"
                    />
                    <button onClick={onAddCustomTask} className="bg-blue-700 text-white p-2 rounded-lg hover:bg-blue-800 transition">
                        <PlusIcon className="w-5 h-5"/>
                    </button>
                </div>
            </div>

            <div className="flex-grow overflow-y-auto -mr-2 pr-2 min-h-0">
                {customTasks.length > 0 && (
                     <div className="mb-4">
                        <h4 className="font-semibold text-gray-600 mb-2 ml-1">Custom</h4>
                        <ul className="space-y-1">
                            {customTasks.map(task => (
                                <li key={task} draggable onDragStart={(e) => handleDragStart(e, task)}
                                    className="bg-gray-100 text-sm p-2 rounded-md cursor-grab active:cursor-grabbing hover:bg-gray-200 border border-gray-300">
                                    {task}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {SUMMATIVE_ASSESSMENTS.map((category: AssessmentCategory) => (
                    <div key={category.category} className="mb-2">
                        <button 
                            onClick={() => toggleSection(category.category)} 
                            className="w-full text-left font-bold text-lg flex justify-between items-center p-2 rounded-md hover:bg-gray-100 transition"
                        >
                            <span>{category.icon} {category.category}</span>
                            {collapsedSections[category.category] ? <ChevronDownIcon className="w-5 h-5" /> : <ChevronUpIcon className="w-5 h-5" />}
                        </button>
                        {!collapsedSections[category.category] && (
                            <div className="mt-2 ml-4 space-y-3 border-l-2 border-gray-200 pl-4">
                                {category.groups.map(group => {
                                    const groupKey = `${category.category}-${group.groupName}`;
                                    const isGroupCollapsed = collapsedSections[groupKey];
                                    return (
                                        <div key={group.groupName}>
                                            <button 
                                                onClick={() => toggleSection(groupKey)}
                                                className="w-full text-left font-semibold text-gray-700 mb-2 flex justify-between items-center hover:text-black"
                                            >
                                                <span>{group.groupName}</span>
                                                {isGroupCollapsed ? <ChevronDownIcon className="w-4 h-4" /> : <ChevronUpIcon className="w-4 h-4" />}
                                            </button>
                                            {!isGroupCollapsed && (
                                                <ul className="space-y-1">
                                                    {group.tasks.map(task => (
                                                        <li
                                                            key={task}
                                                            draggable
                                                            onDragStart={(e) => handleDragStart(e, task)}
                                                            className="bg-gray-100 text-sm p-2 rounded-md cursor-grab active:cursor-grabbing hover:bg-gray-200 border border-gray-300"
                                                        >
                                                            {task}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};