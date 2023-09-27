import {h} from 'preact';
import {useEffect, useRef, useState} from "preact/compat";

export interface EnvelopeViewProps {
    points: ReadonlyArray<{ x: number, y: number }>
    children?: any
    width: number
    height: number
}

export const EnvelopeView = (props: EnvelopeViewProps) => {
    const containerRef = useRef();
    const canvasRef = useRef();


    const draw = () => {
        // draw connected points on canvas
        const ctx = canvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, props.width, props.height);
        ctx.beginPath();
        ctx.moveTo(props.points[0].x, props.points[0].y);
        for (let i = 1; i < props.points.length; i++) {
            ctx.lineTo(props.points[i].x, props.points[i].y);
        }
        ctx.strokeStyle = 'red';
        ctx.stroke();
    }

    useEffect(() => {
        draw()
    }, [canvasRef.current]);

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
        <canvas ref={canvasRef} width={props.width} height={props.height}/>
        {props?.children}
    </div>
}
