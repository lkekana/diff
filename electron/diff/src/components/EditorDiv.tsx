import { forwardRef } from "react";

interface EditorDivProps {
	className?: string;
}

const EditorDiv = forwardRef<HTMLDivElement, EditorDivProps>(({ className = "" }, ref) => {
	return <div ref={ref} className={`w-full h-full min-h-100 ${className}`} />;
});

export default EditorDiv;
