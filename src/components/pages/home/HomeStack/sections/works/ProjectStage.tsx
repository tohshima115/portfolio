import type { Project } from './data';

// 各プロジェクトの carousel stage。WORKS heading と同じ位置に重ね、Phase F で
// opacity 切替により順送り表示する。WORKS stage と構造が似ているが、こちらは
// reveal アニメ無し (parent の opacity tween のみ) なのでシンプル。
export const ProjectStage: React.FC<{ project: Project; reduced: boolean }> = ({
    project,
    reduced,
}) => (
    <div
        data-stage="project"
        data-project-id={project.id}
        className="absolute inset-x-0 top-1/2 -translate-y-1/2 z-40 px-6 md:px-12"
        style={{ opacity: 0 }}
    >
        <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-4 mb-6 md:mb-8">
                <span
                    aria-hidden
                    data-project-rule="left"
                    className="h-px bg-foreground/40 origin-right flex-1"
                    style={{ transform: reduced ? undefined : 'scaleX(0)' }}
                />
                <p className="font-mono text-[10px] md:text-[11px] uppercase tracking-[0.5em] text-muted-foreground whitespace-nowrap">
                    <span className="text-accent">+</span>
                    <span className="ml-3">
                        Project {project.id} / {project.meta}
                    </span>
                </p>
                <span
                    aria-hidden
                    data-project-rule="right"
                    className="h-px bg-foreground/40 origin-left flex-1"
                    style={{ transform: reduced ? undefined : 'scaleX(0)' }}
                />
            </div>

            <h2 className="font-sans font-black text-foreground text-center text-[clamp(2.75rem,11vw,9rem)] leading-[0.9] tracking-[-0.03em]">
                {project.name}
            </h2>

            <div className="mt-6 md:mt-8 flex flex-col items-center gap-5">
                <p className="font-sans text-[14px] md:text-[16px] text-foreground/80 text-center max-w-2xl leading-relaxed">
                    {project.description}
                </p>
            </div>
        </div>
    </div>
);
