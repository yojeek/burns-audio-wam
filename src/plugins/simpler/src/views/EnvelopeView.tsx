import {h} from 'preact';
import {useEffect, useRef, useState} from "preact/compat";

export interface EnvelopeViewProps {
    points: ReadonlyArray<{ x: number, y: number }>
    children?: any
}

export const EnvelopeView = (props: EnvelopeViewProps) => {
    const containerRef = useRef();
    const canvasRef = useRef();

    const [dimensions, setDimensions] = useState({width: 0, height: 0});

    useEffect(() => {
        if (containerRef.current) {
            setDimensions({
                width: containerRef.current.offsetWidth,
                height: containerRef.current.offsetHeight,
            });
        }

        if (canvasRef.current) {
            draw();
        }
    }, [containerRef.current, canvasRef.current]);

    const draw = () => {
        const dx = 5;
        const dy = 5;
        // draw connected points on canvas
        const ctx = canvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, dimensions.width, dimensions.height);
        ctx.beginPath();
        ctx.moveTo(props.points[0].x + dx, props.points[0].y + dy);
        for (let i = 1; i < props.points.length; i++) {
            ctx.lineTo(props.points[i].x + dx, props.points[i].y + dy);
        }
        ctx.strokeStyle = 'red';
        ctx.stroke();
    }

    if (canvasRef.current) {
        draw()
    }

    const style = {
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0
    };

    return <div ref={containerRef} style={style}>
        <canvas ref={canvasRef} width={dimensions.width} height={dimensions.height}/>
        {props?.children}
    </div>
}
