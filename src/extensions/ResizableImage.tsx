import React, { useRef } from 'react';
import { NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react';
import { Image as TiptapImage } from '@tiptap/extension-image';

const ResizableImageComponent = (props: any) => {
    const { node, updateAttributes, selected } = props;
    const { src, alt, width } = node.attrs;
    const imgRef = useRef<HTMLImageElement>(null);

    const handleMouseDown = (e: React.MouseEvent, direction: 'left' | 'right') => {
        e.preventDefault();
        e.stopPropagation();
        
        const startX = e.pageX;
        const startWidth = imgRef.current?.clientWidth || 0;

        const onMouseMove = (moveEvent: MouseEvent) => {
            const currentX = moveEvent.pageX;
            const diff = direction === 'right' ? currentX - startX : startX - currentX;
            const newWidth = Math.max(50, startWidth + diff); // Minimum width 50px
            updateAttributes({ width: newWidth });
        };

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };

    return (
        <NodeViewWrapper as="span" className={`relative inline-block align-bottom ${selected ? 'ring-2 ring-indigo-500 ring-offset-1' : ''}`} style={{ width: width ? `${width}px` : 'auto' }}>
            <img 
                ref={imgRef} 
                src={src} 
                alt={alt} 
                style={{ width: '100%', height: 'auto', display: 'block' }} 
                data-drag-handle 
            />
            {selected && (
                <>
                    <div 
                        className="absolute top-0 left-0 w-3 h-3 bg-indigo-500 border border-white cursor-nwse-resize transform -translate-x-1/2 -translate-y-1/2 z-10" 
                        onMouseDown={(e) => handleMouseDown(e, 'left')} 
                    />
                    <div 
                        className="absolute top-0 right-0 w-3 h-3 bg-indigo-500 border border-white cursor-nesw-resize transform translate-x-1/2 -translate-y-1/2 z-10" 
                        onMouseDown={(e) => handleMouseDown(e, 'right')} 
                    />
                    <div 
                        className="absolute bottom-0 left-0 w-3 h-3 bg-indigo-500 border border-white cursor-nesw-resize transform -translate-x-1/2 translate-y-1/2 z-10" 
                        onMouseDown={(e) => handleMouseDown(e, 'left')} 
                    />
                    <div 
                        className="absolute bottom-0 right-0 w-3 h-3 bg-indigo-500 border border-white cursor-nwse-resize transform translate-x-1/2 translate-y-1/2 z-10" 
                        onMouseDown={(e) => handleMouseDown(e, 'right')} 
                    />
                </>
            )}
        </NodeViewWrapper>
    );
};

export const ResizableImage = TiptapImage.extend({
    addAttributes() {
        return {
            ...this.parent?.(),
            width: {
                default: null,
                parseHTML: element => element.getAttribute('width'),
                renderHTML: attributes => {
                    if (!attributes.width) return {};
                    return { width: attributes.width };
                },
            },
        };
    },
    addNodeView() {
        return ReactNodeViewRenderer(ResizableImageComponent);
    },
});
