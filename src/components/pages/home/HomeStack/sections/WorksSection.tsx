import { WorksFlagshipPart } from './WorksFlagshipPart';
import { WorksOpsCarousel } from './WorksOpsCarousel';
import { DividerMarker } from '../visuals/DividerMarker';

// Works = AIChatClip pin (FLAGSHIP) + 業務改善 3 本横スクロール (OPS) を縦に並べる。
// 同じ section にまとめると HudOverlay の active section が混ざるため、
// 子は内部で data-section="works" / data-section="works-ops" を別々に持つ。

export const WorksSection: React.FC = () => {
    return (
        <>
            <WorksFlagshipPart />
            <DividerMarker py={48} />
            <WorksOpsCarousel />
        </>
    );
};
