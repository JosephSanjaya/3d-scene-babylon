
import dynamic from "next/dynamic";

export const SceneRenderer = dynamic(() => import("@/components/Scene3D/Scene"), { ssr: false });

export default SceneRenderer;