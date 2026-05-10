import type { Project } from './data';
import { NO_FOLDER_BAND_TOP_VH, NO_FOLDER_BAND_HEIGHT_VH } from './constants';

// 各プロジェクトの carousel stage。WORKS heading と同じ位置に重ね、Phase F で
// opacity 切替により順送り表示する。WORKS stage と構造が似ているが、こちらは
// reveal アニメ無し (parent の opacity tween のみ) なのでシンプル。
// 配置は no-folder band (top row 下端 ↔ bottom row 上端) を親枠として、左寄せで描画。
export const ProjectStage: React.FC<{ project: Project; reduced: boolean }> = ({
    project,
    reduced,
}) => (
    <div
        data-stage="project"
        data-project-id={project.id}
        className="absolute left-0 right-0 z-40 px-6 md:px-12 flex flex-col justify-center"
        style={{
            top: `${NO_FOLDER_BAND_TOP_VH}vh`,
            height: `${NO_FOLDER_BAND_HEIGHT_VH}vh`,
            opacity: 0,
        }}
    >
        <div className="max-w-7xl w-full">
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

            <h2 className="font-sans font-black text-foreground text-left text-[clamp(2.75rem,11vw,9rem)] leading-[0.9] tracking-[-0.03em]">
                {project.name}
            </h2>

            <div className="mt-6 md:mt-8 flex flex-col items-start gap-5">
                <p className="font-sans text-[14px] md:text-[16px] text-foreground/80 text-left max-w-2xl leading-relaxed">
                    {project.description}
                </p>
            </div>
        </div>
    </div>
);
