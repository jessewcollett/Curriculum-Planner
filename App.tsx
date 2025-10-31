import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { marked } from 'marked';

import type { Unit, Skill, GeneratedDoc, DragData, GradeLevel } from './types';
import { UNIT_TOPICS, SKILLS_LIST, LOCKED_UNIT, SUMMATIVE_ASSESSMENTS } from './constants';
import { COLORADO_STANDARDS_OVERVIEW, LESSON_PLAN_TEMPLATE_STRUCTURE, PEDAGOGICAL_FRAMEWORKS } from './promptContext';
import { UnitCard } from './components/UnitCard';
import { AssessmentBank } from './components/AssessmentBank';
import { SparklesIcon, ClipboardIcon, ClipboardCheckIcon, PlusIcon, XMarkIcon } from './components/icons';

const GRADE_LEVELS: GradeLevel[] = ['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

const App: React.FC = () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const [courseName, setCourseName] = useState("");
    const [selectedGrades, setSelectedGrades] = useState<Set<GradeLevel>>(new Set());
    const [totalDays, setTotalDays] = useState("80");
    const [classLength, setClassLength] = useState("50");
    
    const [sourceUnits, setSourceUnits] = useState(() => UNIT_TOPICS.map(t => ({ id: t.id, title: t.title, category: t.category as Unit['category'], days: 10, task: ''})));
    const [plannedUnits, setPlannedUnits] = useState<Unit[]>([LOCKED_UNIT]);
    
    const [skills, setSkills] = useState<Skill[]>(() => SKILLS_LIST.map(name => ({ name, checked: false })));
    const [teacherRequest, setTeacherRequest] = useState("");
    const [docTypeToGenerate, setDocTypeToGenerate] = useState<GeneratedDoc['type'] | null>('Year at a Glance');
    const [includeStandards, setIncludeStandards] = useState(false);
    
    const [generatedDocs, setGeneratedDocs] = useState<GeneratedDoc[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [copiedDocId, setCopiedDocId] = useState<string | null>(null);

    // State for granular document generation
    const [selectedUnitForLessons, setSelectedUnitForLessons] = useState<string>("");
    const [selectedUnitForSlides, setSelectedUnitForSlides] = useState<string>("");
    const [selectedDayForSlides, setSelectedDayForSlides] = useState<string>("1");
    
    // State for custom unit & assessment creation (lifted state)
    const [customUnitName, setCustomUnitName] = useState("");
    const [customTask, setCustomTask] = useState('');
    const [customTasks, setCustomTasks] = useState<string[]>([]);

    // State for locked unit
    const [isEnsembleUnitUnlocked, setIsEnsembleUnitUnlocked] = useState(false);

    // State for Assessment Modal
    const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false);
    const [targetUnitForAssessment, setTargetUnitForAssessment] = useState<string | null>(null);

    const draggedItem = useRef<DragData | null>(null);
    const dragOverItem = useRef<string | null>(null);
    
    const selectableUnits = useMemo(() => plannedUnits, [plannedUnits]);

    useEffect(() => {
        if (selectableUnits.length > 0) {
            if (!selectableUnits.find(u => u.id === selectedUnitForLessons)) {
                setSelectedUnitForLessons(selectableUnits[0].id);
            }
            if (!selectableUnits.find(u => u.id === selectedUnitForSlides)) {
                setSelectedUnitForSlides(selectableUnits[0].id);
            }
        } else {
            setSelectedUnitForLessons("");
            setSelectedUnitForSlides("");
        }
    }, [selectableUnits, selectedUnitForLessons, selectedUnitForSlides]);
    
    const handleDocTypeChange = (type: GeneratedDoc['type']) => {
        setDocTypeToGenerate(type);
    };

    const handleGradeToggle = (grade: GradeLevel) => {
        setSelectedGrades(prev => {
            const newSet = new Set(prev);
            if (newSet.has(grade)) {
                newSet.delete(grade);
            } else {
                newSet.add(grade);
            }
            return newSet;
        });
    };
    
    const formatGradeLabel = (grade: GradeLevel) => {
        if (grade === 'K') return 'Kindergarten';
        const num = parseInt(grade as string);
        if (num === 1) return '1st Grade';
        if (num === 2) return '2nd Grade';
        if (num === 3) return '3rd Grade';
        return `${grade}th Grade`;
    };

    const handleUnitDaysChange = (id: string, newDays: number) => {
        setPlannedUnits(units => units.map(u => u.id === id ? { ...u, days: isNaN(newDays) ? 0 : newDays } : u));
    };

    const handleSkillToggle = (skillName: string) => {
        setSkills(prev => prev.map(s => s.name === skillName ? { ...s, checked: !s.checked } : s));
    };
    
    const handleAddCustomUnit = () => {
        if (customUnitName.trim() === "") return;

        const newUnit: Omit<Unit, 'task'> & { task: string } = {
            id: `custom-${customUnitName.trim().replace(/\s/g, '')}`,
            title: customUnitName.trim(),
            category: 'Other',
            days: 10,
            task: ''
        };

        if (sourceUnits.some(u => u.id === newUnit.id) || plannedUnits.some(u => u.id === newUnit.id)) {
            console.warn("Unit already exists");
            return;
        }

        setSourceUnits(prev => [...prev, newUnit].sort((a, b) => a.title.localeCompare(b.title)));
        setCustomUnitName("");
    };

    const handleAddCustomTask = () => {
        if (customTask.trim() && !customTasks.includes(customTask.trim())) {
            setCustomTasks(prev => [...prev, customTask.trim()]);
            setCustomTask('');
        }
    };
    
    const handleUnlockEnsembleUnit = () => {
        const confirmed = window.confirm("Are you sure you want to unlock this foundational unit for removal?");
        if (confirmed) {
            setIsEnsembleUnitUnlocked(true);
        }
    };

    const handleRemoveUnit = (unitId: string) => {
        const unitToRemove = plannedUnits.find(u => u.id === unitId);
        if (!unitToRemove) return;
        
        setPlannedUnits(prev => prev.filter(u => u.id !== unitId));
        if (unitToRemove.id !== LOCKED_UNIT.id) {
             setSourceUnits(prev => [...prev, unitToRemove].sort((a, b) => a.title.localeCompare(b.title)));
        } else {
            setIsEnsembleUnitUnlocked(false); // Reset lock state when removed
        }
    };

    const handleDragStart = (e: React.DragEvent, data: DragData) => {
        draggedItem.current = data;
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragEnter = (e: React.DragEvent, id: string) => {
        e.preventDefault();
        dragOverItem.current = id;
    };

    const handleDragEnd = () => {
        draggedItem.current = null;
        dragOverItem.current = null;
    };
    
    const handleDropOnPlanner = (e: React.DragEvent) => {
        e.preventDefault();
        const dragged = draggedItem.current;
        if (!dragged || dragged.type !== 'unit-bank') return;
    
        const existingUnit = plannedUnits.find(u => u.id === dragged.id);
        if (existingUnit) return;
    
        const unitData = sourceUnits.find(u => u.id === dragged.id);
        if (!unitData) return;
    
        const newUnit: Unit = { ...unitData, task: '' };
    
        setPlannedUnits(prev => [...prev, newUnit]);
        setSourceUnits(prev => prev.filter(u => u.id !== dragged.id));
    };
    
    const handleDropOnBank = (e: React.DragEvent) => {
        e.preventDefault();
        const dragged = draggedItem.current;
        if (!dragged || dragged.type !== 'unit-planner') return;
        
        const unitData = plannedUnits.find(u => u.id === dragged.id);
        if (!unitData || unitData.id === LOCKED_UNIT.id) return;

        setSourceUnits(prev => [...prev, unitData].sort((a, b) => a.title.localeCompare(b.title)));
        setPlannedUnits(prev => prev.filter(u => u.id !== dragged.id));
    };
    
    const handleDropOnUnit = (e: React.DragEvent, targetUnitId: string) => {
        e.preventDefault();
        e.stopPropagation();
        const dragged = draggedItem.current;
        if (!dragged) return;

        if (dragged.type === 'assessment') {
            setPlannedUnits(prev => prev.map(u => u.id === targetUnitId ? { ...u, task: dragged.task } : u));
        }
    };
    
    const handleUnitReorder = (e: React.DragEvent) => {
        e.preventDefault();
        const dragged = draggedItem.current;
        if (!dragged || dragged.type !== 'unit-planner') return;
        
        const targetId = dragOverItem.current;
        if (!targetId || targetId === dragged.id) return;

        setPlannedUnits(prev => {
            const draggedUnit = prev.find(u => u.id === dragged.id);
            if (!draggedUnit) return prev;

            const unitsWithoutDragged = prev.filter(u => u.id !== dragged.id);
            const targetIndex = unitsWithoutDragged.findIndex(u => u.id === targetId);
            
            unitsWithoutDragged.splice(targetIndex, 0, draggedUnit);
            return unitsWithoutDragged;
        });
    };

    const handleOpenAssessmentModal = (unitId: string) => {
        setTargetUnitForAssessment(unitId);
        setIsAssessmentModalOpen(true);
    };

    const handleCloseAssessmentModal = () => {
        setIsAssessmentModalOpen(false);
        setTargetUnitForAssessment(null);
    };

    const handleSelectAssessment = (task: string) => {
        if (targetUnitForAssessment) {
            setPlannedUnits(prev => prev.map(u => u.id === targetUnitForAssessment ? { ...u, task } : u));
        }
        handleCloseAssessmentModal();
    };
    
    const generatePrompt = useCallback(() => {
        if (!docTypeToGenerate) return "";

        const selectedSkillNames = skills.filter(s => s.checked).map(s => s.name).join(', ') || 'Not specified';
        const curriculumDetails = plannedUnits.map(unit => `  - ${unit.title} (${unit.days} days). Summative Task: ${unit.task}`).join('\n');
        const formattedGrades = Array.from(selectedGrades).map(formatGradeLabel).join(', ');
        
        const lessonUnit = plannedUnits.find(u => u.id === selectedUnitForLessons);
        const slideUnit = plannedUnits.find(u => u.id === selectedUnitForSlides);

        return `You are a curriculum generation assistant. Your task is to generate a "${docTypeToGenerate}" document based on the provided details.
The output must be **only** the requested document content in clean, well-formatted Markdown. Do not include any introductory statements, conversational filler, or explanations about your process.

**CORE CURRICULUM DETAILS:**
- **Course Name:** ${courseName || 'Untitled Course'}
- **Grade Level(s):** ${formattedGrades || 'Not specified'}
- **Total Course Days:** ${totalDays || 'Not specified'}
- **Class Period Length:** ${classLength || 'Not specified'} minutes
- **Selected Skills Focus:** ${selectedSkillNames}

**PLANNED UNITS OF STUDY:**
${curriculumDetails}

**TEACHER'S SPECIFIC REQUEST:**
${teacherRequest || "None"}

**DOCUMENT-SPECIFIC INSTRUCTIONS:**

1.  **If "Year at a Glance":**
    - Create a Markdown table with columns: "Unit", "Summative Task", "Duration (Days)" ${includeStandards ? ', "Key Colorado Standards"' : ''}.
    - Populate it with the planned units.
    ${includeStandards ? "- For 'Key Colorado Standards', select 2-3 relevant standard codes (e.g., DT.H2.1.1) for each unit that align with its content and task." : ""}

2.  **If "Unit Overviews":**
    - Generate an overview for EVERY unit listed in the plan.
    - For each unit, provide:
        - A main heading for the unit title (e.g., '## Acting').
        - **Essential Questions:** 3 thought-provoking questions.
        - **Summative Task:** Restate the planned task.
        - **Formative Assessment Ideas:** 3-4 practical, in-class checks for understanding.
        - **Key Vocabulary:** 5-7 essential terms.
        ${includeStandards ? "- **Colorado Standards:** List 3-5 relevant standard codes." : ""}

3.  **If "Daily Lesson Plans (Google Doc)":**
    - Generate a complete, detailed lesson plan for **EVERY DAY of the selected "${lessonUnit?.title || ''}" unit.** The unit is planned for ${lessonUnit?.days || 0} days.
    - Each daily lesson plan MUST follow the specific structure and pedagogical principles provided below. Be detailed and practical for each day.
    - Clearly separate each day's lesson plan with a heading (e.g., '### Day 1: [Lesson Focus]').

4.  **If "Slide Decks (Google Slides)":**
    - Generate the text content for a slide deck for **Day ${selectedDayForSlides} of the "${slideUnit?.title || ''}" unit**.
    - Format it clearly with slide titles (e.g., '### Slide 1: Title'). Include speaker notes for the teacher where appropriate.
    - The deck should have 8-10 slides: Title, Agenda, Objectives (SWBAT), Warm-up, Core Content/Activity, Reflection/Exit Ticket.

**CONTEXT & FRAMEWORKS TO INTEGRATE:**
${PEDAGOGICAL_FRAMEWORKS}
${includeStandards ? COLORADO_STANDARDS_OVERVIEW : ''}
${docTypeToGenerate === 'Daily Lesson Plans (Google Doc)' ? LESSON_PLAN_TEMPLATE_STRUCTURE : ''}
`;
    }, [courseName, selectedGrades, totalDays, classLength, skills, plannedUnits, teacherRequest, docTypeToGenerate, includeStandards, selectedUnitForLessons, selectedUnitForSlides, selectedDayForSlides]);

    const handleGenerateClick = async () => {
        if (isGenerateDisabled || isLoading) return;
        setIsLoading(true);
        setGeneratedDocs([]);

        const prompt = generatePrompt();
        
        try {
            const response = await ai.models.generateContent({
                model: "gemini-2.5-pro",
                contents: prompt,
            });
            const text = response.text;
            
            const newDoc: GeneratedDoc = {
                id: crypto.randomUUID(),
                type: docTypeToGenerate!,
                title: `${courseName || 'Curriculum'}: ${docTypeToGenerate}`,
                content: text
            };
            setGeneratedDocs([newDoc]);

        } catch (error) {
            console.error("Error generating document:", error);
            const errorDoc: GeneratedDoc = {
                id: crypto.randomUUID(),
                type: 'error',
                title: `Error Generating ${docTypeToGenerate}`,
                content: `An error occurred while generating the document. Please check your API key setup and network connection. Details: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
            setGeneratedDocs([errorDoc]);
        } finally {
            setIsLoading(false);
        }
    };
    
    const isGenerateDisabled = isLoading || !docTypeToGenerate ||
        (docTypeToGenerate === 'Daily Lesson Plans (Google Doc)' && !selectedUnitForLessons) ||
        (docTypeToGenerate === 'Slide Decks (Google Slides)' && (!selectedUnitForSlides || !selectedDayForSlides || parseInt(selectedDayForSlides) < 1));


    const copyToClipboard = async (id: string, markdownContent: string) => {
        try {
            const htmlContent = marked.parse(markdownContent) as string;
            const htmlBlob = new Blob([htmlContent], { type: 'text/html' });
            const textBlob = new Blob([markdownContent], { type: 'text/plain' });
    
            const clipboardItem = new ClipboardItem({
                'text/html': htmlBlob,
                'text/plain': textBlob,
            });
    
            await navigator.clipboard.write([clipboardItem]);
    
            setCopiedDocId(id);
            setTimeout(() => setCopiedDocId(null), 2000);
        } catch (error) {
            console.error("Failed to copy rich text, falling back to plain text.", error);
            navigator.clipboard.writeText(markdownContent).then(() => {
                setCopiedDocId(id);
                setTimeout(() => setCopiedDocId(null), 2000);
            }).catch(err => {
                console.error("Fallback plain text copy failed: ", err);
            });
        }
    };

    const renderedPlannedUnits = useMemo(() => (
        plannedUnits.map(unit => (
            <UnitCard
                key={unit.id}
                unit={unit}
                onDaysChange={handleUnitDaysChange}
                onRemove={handleRemoveUnit}
                onSelectTask={handleOpenAssessmentModal}
                isDraggable={unit.id !== LOCKED_UNIT.id}
                onDragStart={(e) => handleDragStart(e, { type: 'unit-planner', id: unit.id })}
                onDragEnter={(e) => handleDragEnter(e, unit.id)}
                onDrop={handleDropOnUnit}
                onUnlock={handleUnlockEnsembleUnit}
                isEnsembleUnitUnlocked={isEnsembleUnitUnlocked}
            />
        ))
    ), [plannedUnits, isEnsembleUnitUnlocked]);

    return (
        <div className="bg-gray-100 min-h-screen font-lato text-gray-800">
             {isAssessmentModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-60 z-40 flex justify-center items-center p-4" onClick={handleCloseAssessmentModal}>
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white">
                            <h3 className="text-xl font-montserrat text-gray-800">Select an Assessment</h3>
                            <button onClick={handleCloseAssessmentModal} className="text-gray-500 hover:text-gray-800 transition">
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-4 overflow-y-auto space-y-4">
                             {customTasks.length > 0 && (
                                <div className="mb-4">
                                    <h4 className="font-bold text-gray-700 mb-2">Custom</h4>
                                    <div className="space-y-2">
                                        {customTasks.map(task => (
                                            <button key={task} onClick={() => handleSelectAssessment(task)}
                                                className="w-full text-left bg-gray-100 text-sm p-3 rounded-md hover:bg-blue-100 border border-gray-300 transition">
                                                {task}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {SUMMATIVE_ASSESSMENTS.map(category => (
                                <div key={category.category}>
                                    <h4 className="font-bold text-lg mb-2 text-gray-800">{category.icon} {category.category}</h4>
                                    <div className="space-y-3 ml-2 pl-4 border-l-2">
                                        {category.groups.map(group => (
                                            <div key={group.groupName}>
                                                <h5 className="font-semibold text-gray-700 mb-2">{group.groupName}</h5>
                                                <div className="space-y-2">
                                                    {group.tasks.map(task => (
                                                         <button key={task} onClick={() => handleSelectAssessment(task)}
                                                            className="w-full text-left bg-gray-100 text-sm p-3 rounded-md hover:bg-blue-100 border border-gray-300 transition">
                                                            {task}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
            <header className="bg-white shadow-sm p-4 sticky top-0 z-20">
                <h1 className="text-3xl font-montserrat font-bold text-[#3c78d8] text-center">Theatre Curriculum Planner</h1>
            </header>
            
            <main className="p-4 sm:p-6 lg:p-8 space-y-8">
                {/* Section 1: Course Setup */}
                <section className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-2xl font-montserrat mb-4 text-gray-800">Course Setup</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="col-span-1 md:col-span-2">
                            <label htmlFor="course-name" className="block text-sm font-bold text-gray-600 mb-1">Class/Course Name</label>
                            <input type="text" id="course-name" value={courseName} onChange={(e) => setCourseName(e.target.value)} placeholder="E.g., Intro to Theatre Arts" className="w-full p-2 rounded-lg border border-gray-300 bg-white shadow-sm focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                            <label htmlFor="total-days" className="block text-sm font-bold text-gray-600 mb-1"># Days of Course Instruction</label>
                            <input type="number" id="total-days" value={totalDays} onChange={(e) => setTotalDays(e.target.value)} className="w-full p-2 rounded-lg border border-gray-300 bg-white shadow-sm focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                            <label htmlFor="class-length" className="block text-sm font-bold text-gray-600 mb-1">Class Length (minutes)</label>
                            <input type="number" id="class-length" value={classLength} onChange={(e) => setClassLength(e.target.value)} className="w-full p-2 rounded-lg border border-gray-300 bg-white shadow-sm focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div className="col-span-1 md:col-span-2 lg:col-span-4">
                            <label className="block text-sm font-bold text-gray-600 mb-2">Grade Level(s)</label>
                            <div className="flex flex-wrap gap-x-4 gap-y-2">
                                {GRADE_LEVELS.map(grade => (
                                    <label key={grade} className="flex items-center space-x-2 cursor-pointer">
                                        <input type="checkbox" checked={selectedGrades.has(grade)} onChange={() => handleGradeToggle(grade)} className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500" />
                                        <span className="text-sm">{formatGradeLabel(grade)}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section 2: Workspace & Toolkit */}
                <section className="flex flex-col lg:flex-row gap-8">
                    {/* Left Column: Workspace */}
                    <div className="w-full lg:w-1/2 flex flex-col gap-8" onDrop={handleUnitReorder} onDragOver={(e) => e.preventDefault()} onDragEnd={handleDragEnd}>
                        <div className="bg-white p-6 rounded-lg shadow flex-grow flex flex-col" onDragOver={(e) => e.preventDefault()} onDrop={handleDropOnPlanner}>
                            <h2 className="text-2xl font-montserrat mb-4 text-gray-800 flex-shrink-0">Workspace</h2>
                            <div className="flex-grow overflow-y-auto pr-2 -mr-2 flex flex-wrap gap-4 items-start content-start">
                                {renderedPlannedUnits}
                                {plannedUnits.length === 0 && (
                                     <div className="text-center py-16 px-4 border-2 border-dashed border-gray-300 rounded-lg w-full">
                                        <p className="text-gray-500">Drag units from the "Unit Bank" to start building your curriculum!</p>
                                     </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Toolkit */}
                    <div className="w-full lg:w-1/2 flex flex-col gap-8">
                        <div className="bg-white p-6 rounded-lg shadow flex flex-col flex-grow min-h-0" onDragOver={(e) => e.preventDefault()} onDrop={handleDropOnBank}>
                           <h2 className="text-2xl font-montserrat mb-4 text-gray-800 flex-shrink-0">Unit Bank</h2>
                           <div className="flex-shrink-0 mb-4">
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={customUnitName} 
                                        onChange={e => setCustomUnitName(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleAddCustomUnit()}
                                        placeholder="Add a custom unit..." 
                                        className="flex-grow p-2 text-sm rounded-lg border border-gray-300 shadow-sm w-full bg-white focus:ring-2 focus:ring-blue-500"
                                    />
                                    <button onClick={handleAddCustomUnit} className="bg-blue-700 text-white p-2 rounded-lg hover:bg-blue-800 transition">
                                        <PlusIcon className="w-5 h-5"/>
                                    </button>
                                </div>
                            </div>
                            <div className="flex-grow overflow-y-auto pr-2 -mr-2 min-h-0">
                                <div className="flex flex-wrap gap-2">
                                    {sourceUnits.map(unit => (
                                        <UnitCard key={unit.id} unit={unit} isBankCard={true} isDraggable={true} onDragStart={(e) => handleDragStart(e, {type: 'unit-bank', id: unit.id})}/>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow flex flex-col flex-grow min-h-0">
                            <AssessmentBank 
                                onDragStart={handleDragStart} 
                                customTask={customTask}
                                onCustomTaskChange={setCustomTask}
                                customTasks={customTasks}
                                onAddCustomTask={handleAddCustomTask}
                            />
                        </div>
                         <div className="bg-white p-6 rounded-lg shadow">
                            <h2 className="text-2xl font-montserrat mb-4 text-gray-800">Skills Focus</h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-1 gap-x-4">
                                {skills.map(skill => (
                                    <label key={skill.name} className="flex items-center space-x-2 cursor-pointer">
                                        <input type="checkbox" checked={skill.checked} onChange={() => handleSkillToggle(skill.name)} className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500" />
                                        <span className="text-sm">{skill.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
                
                {/* Section 3: Generation */}
                <section className="bg-white p-6 rounded-lg shadow">
                     <h2 className="text-2xl font-montserrat mb-4 text-gray-800">Generate Documents</h2>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                        <div>
                            <label htmlFor="teacher-request" className="block text-sm font-bold text-gray-600 mb-1">Teacher's Request (Optional)</label>
                            <textarea id="teacher-request" value={teacherRequest} onChange={(e) => setTeacherRequest(e.target.value)} rows={3} placeholder='E.g., "Generate 3 essential questions for the Acting unit..."' className="w-full p-2 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 bg-white"></textarea>
                        </div>
                        <div className="space-y-4">
                             <div>
                                <label className="block text-sm font-bold text-gray-600 mb-2">1. Select a document to generate:</label>
                                <div className="flex flex-wrap gap-2">
                                    {(['Year at a Glance', 'Unit Overviews', 'Daily Lesson Plans (Google Doc)', 'Slide Decks (Google Slides)'] as const).map(docType => (
                                        <button key={docType} onClick={() => handleDocTypeChange(docType)} className={`px-3 py-1.5 text-sm rounded-full border transition ${docTypeToGenerate === docType ? 'bg-blue-600 text-white border-blue-700' : 'bg-white hover:bg-gray-100 border-gray-300'}`}>
                                            {docType.replace(' (Google Doc)', '').replace(' (Google Slides)', '')}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            {docTypeToGenerate === 'Daily Lesson Plans (Google Doc)' && (
                                <div>
                                    <label htmlFor="lesson-unit-select" className="block text-sm font-bold text-gray-600 mb-2">2. Select unit for lesson plans:</label>
                                    <select id="lesson-unit-select" value={selectedUnitForLessons} onChange={(e) => setSelectedUnitForLessons(e.target.value)} className="w-full p-2 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 bg-white">
                                        {selectableUnits.length === 0 ? (
                                             <option disabled>Add a unit to your workspace first</option>
                                        ) : (
                                            selectableUnits.map(unit => <option key={unit.id} value={unit.id}>{unit.title}</option>)
                                        )}
                                    </select>
                                </div>
                            )}

                             {docTypeToGenerate === 'Slide Decks (Google Slides)' && (
                                <div className="space-y-4 p-4 bg-gray-50 rounded-lg border">
                                    <div>
                                        <label htmlFor="slide-unit-select" className="block text-sm font-bold text-gray-600 mb-2">2. Select unit for slide deck:</label>
                                        <select id="slide-unit-select" value={selectedUnitForSlides} onChange={(e) => setSelectedUnitForSlides(e.target.value)} className="w-full p-2 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 bg-white">
                                             {selectableUnits.length === 0 ? (
                                                 <option disabled>Add a unit to your workspace first</option>
                                             ) : (
                                                 selectableUnits.map(unit => <option key={unit.id} value={unit.id}>{unit.title}</option>)
                                             )}
                                        </select>
                                    </div>
                                     <div>
                                         <label htmlFor="slide-day-select" className="block text-sm font-bold text-gray-600 mb-2">3. Enter lesson day:</label>
                                         <input type="number" id="slide-day-select" value={selectedDayForSlides} onChange={(e) => setSelectedDayForSlides(e.target.value)} min="1" className="w-full p-2 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 bg-white" />
                                     </div>
                                </div>
                            )}

                            <div>
                                <label className="flex items-center space-x-2 cursor-pointer mt-2">
                                    <input type="checkbox" checked={includeStandards} onChange={(e) => setIncludeStandards(e.target.checked)} className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500" />
                                    <span className="text-sm font-bold text-gray-600">Include Colorado Academic Standards</span>
                                </label>
                            </div>
                        </div>
                     </div>
                     <div className="mt-6 text-center">
                        <button onClick={handleGenerateClick} disabled={isGenerateDisabled} className="inline-flex items-center justify-center px-8 py-3 bg-blue-700 text-white text-lg font-bold rounded-lg hover:bg-blue-800 disabled:bg-gray-400 transition shadow-lg transform active:scale-95">
                             {isLoading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    Generating...
                                </>
                             ) : (
                                <>
                                    <SparklesIcon className="w-6 h-6 mr-2" />
                                    Create
                                </>
                             )}
                        </button>
                     </div>
                </section>

                {/* Generated Docs Output */}
                {generatedDocs.length > 0 && (
                    <section className="space-y-6">
                        {generatedDocs.map((doc) => (
                            <div key={doc.id} className="bg-white p-6 rounded-lg shadow">
                                <div className="flex justify-between items-center mb-4 border-b pb-2">
                                    <h3 className="text-xl font-montserrat text-gray-800">{doc.title}</h3>
                                    <button onClick={() => copyToClipboard(doc.id, doc.content)} className={`flex items-center gap-2 px-3 py-1 rounded-md text-sm transition ${copiedDocId === doc.id ? 'bg-green-100 text-green-700' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}>
                                        {copiedDocId === doc.id ? <ClipboardCheckIcon className="w-4 h-4" /> : <ClipboardIcon className="w-4 h-4" />}
                                        {copiedDocId === doc.id ? 'Copied!' : 'Copy'}
                                    </button>
                                </div>
                                <div className="max-h-[70vh] overflow-y-auto pr-2">
                                   <div
                                        className="prose prose-sm max-w-none font-lato"
                                        dangerouslySetInnerHTML={{ __html: marked.parse(doc.content || '') as string }}
                                    />
                                </div>
                            </div>
                        ))}
                    </section>
                )}
            </main>
        </div>
    );
};

export default App;