import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';

interface Project {
    slug: string;
    title: string;
    iconUrl?: string; // Optional image URL for icon
}

interface ProjectNavigationProps {
    projects: Project[];
    currentSlug: string;
    className?: string;
    onProjectClick?: (project: Project) => void; // For future SFX/Haptics
}

const ProjectNavigation: React.FC<ProjectNavigationProps> = ({
    projects,
    currentSlug: initialSlug,
    className,
    onProjectClick
}) => {
    // State to handle current slug updates during client-side navigation
    const [activeSlug, setActiveSlug] = useState(initialSlug);

    useEffect(() => {
        // Function to update active slug based on URL
        const updateActiveSlug = () => {
            // Extract slug from URL path: /projects/swept -> swept
            const pathSegments = window.location.pathname.split('/').filter(Boolean);
            // Assuming structure /projects/[slug]
            const slugIndex = pathSegments.indexOf('projects');
            if (slugIndex !== -1 && pathSegments[slugIndex + 1]) {
                setActiveSlug(pathSegments[slugIndex + 1]);
            }
        };

        // Update on mount (for initial load)
        updateActiveSlug();

        // Listen for Astro's page-load event (fired on initial load and after view transitions)
        document.addEventListener('astro:page-load', updateActiveSlug);

        return () => {
            document.removeEventListener('astro:page-load', updateActiveSlug);
        };
    }, []);

    // Container variants for stagger animation
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05,
                delayChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: -20, scale: 0.8 },
        visible: {
            opacity: 1, y: 0, scale: 1,
            transition: { type: "spring", stiffness: 300, damping: 20 } as const
        }
    };

    return (
        <nav className={cn(
            "w-full flex items-center overflow-visible flex-wrap py-4 px-4 md:px-0 z-30 select-none",
            "transition-colors duration-300",
            className
        )}>
            <div className="flex items-center justify-between mx-auto w-full max-w-[1920px]">

                {/* Left Area: Navigation Links */}
                <div className="hidden md:flex justify-start flex-1 items-center gap-6 pr-6 min-w-max">
                    <a href="/" className="group flex flex-col items-start transition-colors">
                        <span className="text-[10px] text-gray-400 font-mono tracking-[0.2em] leading-none group-hover:text-yellow-500 transition-colors">RETURN TO</span>
                        <span className="text-xl font-bold text-black tracking-tighter group-hover:opacity-70 transition-opacity">HOME</span>
                    </a>
                    <div className="w-[1px] h-8 bg-gray-300"></div>
                    <a href="/projects" className="group flex flex-col items-start transition-colors">
                        <span className="text-[10px] text-gray-400 font-mono tracking-[0.2em] leading-none group-hover:text-yellow-500 transition-colors">INDEX OF</span>
                        <span className="text-xl font-bold text-black tracking-tighter group-hover:opacity-70 transition-opacity">PROJECTS</span>
                    </a>
                </div>

                <motion.ul
                    className="flex justify-center flex-shrink-0 flex-wrap gap-3 pr-8 md:pr-0"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {projects.map((project) => {
                        const isActive = project.slug === activeSlug;

                        return (
                            <motion.li
                                key={project.slug}
                                variants={itemVariants}
                                className="flex-shrink-0"
                            >
                                <a
                                    href={`/projects/${project.slug}`}
                                    onClick={(e) => {
                                        // e.preventDefault(); // Let default navigation happen for now
                                        if (onProjectClick) onProjectClick(project);
                                    }}
                                    className="relative group block"
                                >
                                    {/* Outline / Shape */}
                                    <div className={cn(
                                        "w-12 h-12 md:w-14 md:h-14 flex items-center justify-center relative transition-all duration-300 rounded-full overflow-hidden",
                                        isActive
                                            ? "bg-transparent border-2 border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.4)]"
                                            : "bg-gray-100/50 backdrop-blur-sm border border-gray-300 hover:border-black hover:scale-105"
                                    )}
                                    >
                                        {/* Content: Icon or Text */}
                                        {project.iconUrl ? (
                                            <img
                                                src={project.iconUrl}
                                                alt={project.title}
                                                className={cn(
                                                    "w-full h-full object-cover transition-all duration-300",
                                                    isActive ? "opacity-100" : "opacity-70 group-hover:opacity-100 grayscale group-hover:grayscale-0"
                                                )}
                                            />
                                        ) : (
                                            <span className={cn(
                                                "font-mono text-lg font-bold tracking-tighter",
                                                isActive ? "text-black" : "text-gray-400 group-hover:text-black"
                                            )}>
                                                {project.title.substring(0, 2).toUpperCase()}
                                            </span>
                                        )}

                                        {/* 'NOW' Overlay for Current Project */}
                                        {isActive && (
                                            <div className="absolute inset-0 bg-black/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                                                <span className="text-[8px] font-black text-yellow-400 tracking-widest leading-none">NOW</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Tooltip Title on Hover (PC only) - Only show for non-active items */}
                                    {!isActive && (
                                        <div className="hidden md:block absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                                            <div className="bg-black border border-gray-700 px-2 py-1 text-[10px] text-white font-mono tracking-wider shadow-lg rounded-md">
                                                {project.title.toUpperCase()}
                                            </div>
                                        </div>
                                    )}
                                </a>
                            </motion.li>
                        )
                    })}
                </motion.ul>

                {/* Current Project Info (Top Right) */}
                <div className="hidden md:flex justify-end flex-1 flex-col items-end text-[10px] text-gray-500 font-mono pl-6">
                    <span>STATUS: ACTIVE</span>
                    <span>MODE: VIEW_ARCHIVE</span>
                </div>
            </div>
        </nav>
    );
};

export default ProjectNavigation;
