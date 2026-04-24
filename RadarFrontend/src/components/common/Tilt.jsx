import { useMemo, useRef, useState } from 'react';

const toNumber = (value, fallback) => (typeof value === 'number' ? value : fallback);

export default function Tilt({ children, className = '', options = {} }) {
    const containerRef = useRef(null);
    const [transform, setTransform] = useState('perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');

    const config = useMemo(() => ({
        max: toNumber(options.max, 10),
        perspective: toNumber(options.perspective, 1000),
        scale: toNumber(options.scale, 1),
        speed: toNumber(options.speed, 300),
        reset: options.reset !== false,
        reverse: Boolean(options.reverse),
        axis: options.axis ?? null,
        transition: options.transition !== false,
        easing: options.easing ?? 'cubic-bezier(.03,.98,.52,.99)',
    }), [options]);

    const buildTransform = (rotateX, rotateY, scale = config.scale) => (
        `perspective(${config.perspective}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(${scale}, ${scale}, ${scale})`
    );

    const handleMouseMove = (event) => {
        if (!containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const relativeX = (event.clientX - rect.left) / rect.width;
        const relativeY = (event.clientY - rect.top) / rect.height;
        const reverseFactor = config.reverse ? -1 : 1;

        let rotateY = (relativeX - 0.5) * (config.max * 2) * reverseFactor;
        let rotateX = (0.5 - relativeY) * (config.max * 2) * reverseFactor;

        if (config.axis === 'x') {
            rotateY = 0;
        }

        if (config.axis === 'y') {
            rotateX = 0;
        }

        setTransform(buildTransform(rotateX, rotateY));
    };

    const handleMouseLeave = () => {
        if (!config.reset) return;
        setTransform(buildTransform(0, 0, 1));
    };

    const style = {
        transform,
        transformStyle: 'preserve-3d',
        transition: config.transition ? `transform ${config.speed}ms ${config.easing}` : undefined,
        willChange: 'transform',
    };

    return (
        <div
            ref={containerRef}
            className={className}
            style={style}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            {children}
        </div>
    );
}
