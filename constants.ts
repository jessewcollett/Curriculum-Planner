import type { Unit, AssessmentCategory } from './types';

export const PERFORMANCE_UNITS: string[] = [
    "Acting", "Auditioning", "Body/Movement", "Devising", "Directing", "Improv", 
    "Playwriting", "Stage Combat", "Voice"
].sort();

export const TECH_UNITS: string[] = [
    "Carpentry", "Costumes", "Elements and Principles of Design", "Lighting", 
    "Projection Design", "Props", "Scenery", "Sound", "Stage Management"
].sort();

const OTHER_UNITS: string[] = ["Show Production"].sort();

export const UNIT_TOPICS: {id: string, title: string, category: Unit['category']}[] = [
    ...PERFORMANCE_UNITS.map(t => ({id: t.replace(/\s/g, ''), title: t, category: 'Performance' as const})),
    ...TECH_UNITS.map(t => ({id: t.replace(/\s/g, ''), title: t, category: 'Technical Theatre' as const})),
    ...OTHER_UNITS.map(t => ({id: t.replace(/\s/g, ''), title: t, category: 'Other' as const})),
];


export const SKILLS_LIST: string[] = [
    'Artistic Vision', 'Creative Expression', 'Character', 'Story Presentation',
    'Collaboration', 'Communication', 'Critical Thinking', 'Leadership',
    'Design & Technical Presentation', 'Critical Response', 'Reflective Practice', 'Safety'
];

export const LOCKED_UNIT: Unit = {
    id: 'unit-locked-ensemble',
    title: 'Ensemble Building',
    days: 5,
    task: 'Ensemble/Risk Building',
    category: 'Other'
};

export const SUMMATIVE_ASSESSMENTS: AssessmentCategory[] = [
    {
      category: 'Performance Focused Tasks',
      icon: '🎭',
      groups: [
        {
          groupName: 'Voice',
          tasks: ["Radio Play (group)", "Vocal Storybook (solo recording)", "Poetry Out Loud / Slam (performance)", "Informative Speech (persuasive or informative)", "Character Voice Reel (creating 3-5 distinct character voices)"]
        },
        {
          groupName: 'Acting',
          tasks: ["Final Monologue Performance", "Contemporary Scene (duet or trio)", "Period Scene (e.g., Shakespeare, Greek, Comedy of Manners)", "Solo Performance Piece", "Character Analysis Presentation (presenting research as the character)"]
        },
        {
          groupName: 'Improv',
          tasks: ["Short-Form Showcase (performing 5-7 games for an audience)", "Long-Form Set (e.g., performing a Harold, La Ronde, or Armando)", "Create a \"Set List\" (curating and hosting a 30-minute show)", "Improvised Play (long-form narrative)", "Devise an Improv Game (creating and teaching a new game)"]
        },
        {
          groupName: 'Body/Movement',
          tasks: ["Tableau / Stage Pictures Project (telling a story in 5 frozen pictures)", "Pantomime Scene (solo or group)", "Silent Scene (with objective/conflict, but no words)", "Viewpoints-Based Performance (group)", "Physical Storytelling (abstract movement piece to music)"]
        },
        {
          groupName: 'Auditioning',
          tasks: ["Mock Audition (performing a monologue/song package)", "Cold Reading Showcase", "Professional Portfolio (resume, headshot, and repertoire list)", "\"Cattle Call\" Simulation (performing 1-minute cut for the class)", "Self-Tape Submission (filming and editing a professional video audition)"]
        },
        {
          groupName: 'Stage Combat',
          tasks: ["Unarmed Fight Scene (choreographed)", "Armed (Single Sword/Rapier) Fight Scene (choreographed)", "Found-Object Fight Scene", "\"Master at Arms\" Skills Test (performing all moves safely)", "Choreographer's Project (notating and teaching a short combo)"]
        }
      ]
    },
    {
      category: 'Creative & Leadership Tasks',
      icon: '✍️',
      groups: [
         {
          groupName: 'Devising',
          tasks: ["Original 10-Minute Play (group-created and performed)", "Docudrama / Verbatim Theatre Project", "Physical Theatre Piece (based on a theme or stimulus)", "\"Page to Stage\" (adapting a non-theatrical text)", "Process Portfolio (documenting the creation process)"]
        },
        {
          groupName: 'Directing',
          tasks: ["10-Minute Scene (fully directed and presented)", "One-Act Play (fully produced for a showcase)", "Director's Prompt Book (complete with concept, analysis, and blocking)", "Concept Presentation (pitching a full-length play to a \"season committee\")", "Peer Coaching Project (coaching a monologue for another student)"]
        },
        {
          groupName: 'Playwriting',
          tasks: ["10-Minute Play (final script)", "One-Act Play (final script)", "\"24-Hour\" Play Festival (writing a short play on a deadline)", "Adaptation (adapting a short story or fairy tale)", "Staged Reading (casting and rehearsing a reading of your script)"]
        }
      ]
    },
    {
      category: 'Design & Technical Focused Tasks',
      icon: '🛠️',
      groups: [
         {
          groupName: 'Show Production',
          tasks: ["Crew Head Role (managing a crew for a mainstage show)", "Production Role Portfolio (submitting all work from a show)", "\"Tech Olympics\" (timed skills-based challenges)", "Run Crew Final Assessment (successfully running a show cue-to-cue)"]
        },
        {
          groupName: 'Stage Management',
          tasks: ["Prompt Book Project (creating a full prompt book for a one-act)", "Cue-Calling Simulation (calling cues for a complex scene)", "Rehearsal Report Packet (submitting a week's worth of paperwork)", "Stage Manager for a One-Act (fully managing a student-directed play)"]
        },
        {
          groupName: 'Elements and Principles of Design',
          tasks: ["Conceptual Design Presentation (pitching a concept for one play)", "Design Analysis Essay (analyzing a professional designer's work)", "Multi-Disciplinary Design Project (e.g., \"Design in a Box\")", "Found-Object Art Project (using principles of design)"]
        },
        {
          groupName: 'Carpentry',
          tasks: ["Build a Flat (standard theatrical flat)", "Build a Platform (simple 4'x4' stock platform)", "Tool Safety & Identification Test (written and practical)", "Read a Drafting Packet (interpreting technical drawings)"]
        },
        {
          groupName: 'Costumes',
          tasks: ["Costume Renderings (a set of final, colored drawings)", "Costume Plot (a spreadsheet tracking all pieces for a show)", "Build/Craft Project (e.g., distressing a garment, making a mask)", "Conceptual \"Design Bible\" (renderings, swatches, and research)"]
        },
        {
          groupName: 'Lighting',
          tasks: ["Light Plot (drafting a full plot for a one-act)", "Cue-to-Cue (programming and running 10 cues on the board)", "Gobo/Color \"Mood\" Project (using light to tell a story)", "Instrument Hang & Focus (practical test)"]
        },
        {
          groupName: 'Projection Design',
          tasks: ["Projection Storyboard (mapping all visual cues for a play)", "Animated Sequence (creating a short animated projection)", "Sourcing Portfolio (finding and editing all media for a scene)", "Q-Lab or PowerPoint Design (building the show file)"]
        },
        {
          groupName: 'Props',
          tasks: ["Prop Master's Plot (list of all props to be bought/built/pulled)", "Prop Build (creating a \"hero prop\" from scratch)", "Prop Table Setup (sourcing and organizing props for a scene)"]
        },
        {
          groupName: 'Scenery (Scenic Design)',
          tasks: ["Set Model (1/4\" or 1/2\" scale model)", "Ground Plan (drafted to scale)", "Designer's Renderings (perspective or elevational drawings)", "Scenic Painting Sampler (demonstrating 3-5 paint techniques)"]
        },
        {
          groupName: 'Sound',
          tasks: ["Sound Plot / Cue Sheet (listing all cues for a show)", "Found Soundscape (creating a 2-minute atmosphere from recordings)", "Cue-Building Project (editing and organizing 10 cues in QLab)", "Foley Project (creating live sound effects for a cartoon)"]
        }
      ]
    }
];
