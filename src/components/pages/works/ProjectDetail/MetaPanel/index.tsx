import React, { useState } from 'react';
import { cn } from '@/utils/cn';
import { motion, AnimatePresence } from 'framer-motion';

interface Project {
    slug: string;
    data: {
        title: string;
        attributes: {
            stack: string[];
        };
        meta: {
            thumbnail?: { src: string };
        };
    };
}

interface ProjectMetaPanelProps {
    title: string;
    roles: string[];
    duration: string;
    stack: string[];
    className?: string; // Add className prop for flexibility
    projects: Project[]; // All projects for filtering
}

const ProjectMetaPanel: React.FC<ProjectMetaPanelProps> = ({ title, roles, duration, stack, className, projects }) => {
    // State to track which tech stack is being hovered
    const [hoveredStack, setHoveredStack] = useState<string | null>(null);

    return (
        <div className={cn("flex flex-col h-full font-mono text-gray-800", className)}>
            {/* Top Header Section */}
            <div className="mb-8 relative group">
                <div className="absolute -left-4 top-0 w-1 h-full bg-yellow-400 group-hover:h-1/2 transition-all duration-300" />
                <h1 className="text-5xl font-black tracking-tighter uppercase leading-none mb-2 relative z-10">
                    {title}
                </h1>
                <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-gray-400">
                    <span>PROJECT_ID</span>
                    <span className="w-8 h-[1px] bg-gray-300"></span>
                    <span>001</span> {/* Dynamic ID if available */}
                </div>
            </div>

            {/* Stats Grid - "Spec Sheet" Style */}
            <div className="grid grid-cols-1 gap-6">

                {/* Roles Block */}
                <div className="relative border-l-2 border-gray-200 pl-4 py-1 hover:border-yellow-400 transition-colors duration-300">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-2 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-yellow-400 rotate-45"></span>
                        Role / Function
                    </h3>
                    <ul className="space-y-1">
                        {roles.map((role) => (
                            <li key={role} className="text-xl font-bold tracking-tight uppercase leading-snug">
                                {role}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Duration Block */}
                <div className="relative border-l-2 border-gray-200 pl-4 py-1 hover:border-yellow-400 transition-colors duration-300">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-2 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-gray-300 rotate-45"></span>
                        Timeline
                    </h3>
                    <p className="text-2xl font-black font-sans tracking-tight">
                        {duration}
                    </p>
                </div>

                {/* Tech Stack Block - More Visual with Hover Context */}
                <div className="relative border-l-2 border-gray-200 pl-4 py-1 hover:border-yellow-400 transition-colors duration-300">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-3 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-gray-300 rotate-45"></span>
                        System / Stack
                    </h3>
                    <div className="flex flex-wrap gap-2 relative">
                        {stack.map((tech) => (
                            <div
                                key={tech}
                                className="relative group/stack"
                                onMouseEnter={() => setHoveredStack(tech)}
                                onMouseLeave={() => setHoveredStack(null)}
                            >
                                <span
                                    className="block px-2 py-1 bg-gray-200 text-gray-700 text-xs font-bold uppercase tracking-wider hover:bg-black hover:text-yellow-400 transition-colors cursor-pointer rounded-md"
                                >
                                    {tech}
                                </span>

                                {/* Hover Popover */}
                                <AnimatePresence>
                                    {hoveredStack === tech && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 5, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 5, scale: 0.95 }}
                                            transition={{ duration: 0.15 }}
                                            // Add pt-2 to create a transparent bridge for mouse movement
                                            className="absolute left-0 top-full z-50 pt-2 w-max min-w-[220px]"
                                        >
                                            <div className="bg-white/95 backdrop-blur-xl border border-gray-200 shadow-2xl p-4 flex flex-col gap-3 rounded-2xl relative overflow-hidden">

                                                {/* Popover Header */}
                                                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                                                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                                                        Related Projects
                                                    </span>
                                                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                                                </div>

                                                {/* Projects Grid */}
                                                <div className="flex gap-2 flex-wrap">
                                                    {projects
                                                        .filter(p => p.data.attributes.stack.includes(tech))
                                                        .map(p => {
                                                            const isCurrent = p.data.title === title;
                                                            return (
                                                                <a
                                                                    key={p.slug}
                                                                    href={isCurrent ? "#" : `/works/${p.slug}`}
                                                                    className={cn(
                                                                        "w-12 h-12 flex items-center justify-center border transition-all duration-300 rounded-full overflow-hidden relative group/icon shadow-sm",
                                                                        isCurrent
                                                                            ? "border-yellow-400 border-2 shadow-[0_0_10px_rgba(250,204,21,0.3)] cursor-default"
                                                                            : "border-gray-200 hover:border-black hover:scale-110 cursor-pointer bg-gray-50"
                                                                    )}
                                                                    title={p.data.title}
                                                                    onClick={(e) => isCurrent && e.preventDefault()}
                                                                >
                                                                    {p.data.meta.thumbnail ? (
                                                                        <img
                                                                            src={p.data.meta.thumbnail.src}
                                                                            alt={p.data.title}
                                                                            className={cn(
                                                                                "w-full h-full object-cover transition-opacity duration-200",
                                                                                isCurrent ? "opacity-100" : "opacity-90 group-hover/icon:opacity-100"
                                                                            )}
                                                                        />
                                                                    ) : (
                                                                        <span className="text-xs font-bold font-mono">
                                                                            {p.data.title.substring(0, 2).toUpperCase()}
                                                                        </span>
                                                                    )}

                                                                    {/* 'NOW' Overlay for Current Project */}
                                                                    {isCurrent && (
                                                                        <div className="absolute inset-0 bg-gray-900/90 flex items-center justify-center opacity-0 group-hover/icon:opacity-100 transition-opacity duration-200 z-10">
                                                                            <span className="text-[8px] font-black text-yellow-400 tracking-widest">NOW</span>
                                                                        </div>
                                                                    )}
                                                                </a>
                                                            );
                                                        })}
                                                </div>

                                                {/* Decorative Popover Elements */}
                                                <div className="absolute top-0 right-0 p-2 opacity-10 pointer-events-none">
                                                    <div className="w-8 h-8 border-t-2 border-r-2 border-black rounded-tr-xl"></div>
                                                </div>
                                            </div>

                                            {/* Stylized Arrow (Triangle) */}
                                            <div className="absolute top-[2px] left-4 w-4 h-4 bg-white border-t border-l border-gray-200 transform rotate-45 z-0 clip-triangle"></div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Extra Decorative Tech Elements */}
                <div className="mt-8 grid grid-cols-2 gap-2 opacity-50 pointer-events-none">
                    <div className="h-1 bg-gray-200 w-full" />
                    <div className="h-1 bg-gray-200 w-1/2" />
                    <div className="text-[10px] font-mono text-gray-400 col-span-2">
                        SYSTEM_STATUS: ONLINE<br />
                        RENDER_MODE: HIGH_FIDELITY
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ProjectMetaPanel;
