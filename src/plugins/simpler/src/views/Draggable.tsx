import {ComponentChild, h} from "preact";
import {useEffect, useRef, useState} from "preact/compat";

interface DraggableProps {
    id: string
    className?: string
    children?: ComponentChild
    initialPos: { x: number, y: number }
    fixOnAxis?: "x" | "y"
    onDragEnd?: (pos: { x: number, y: number }) => void
    containerRef?: any
    constrainFn?: (pos: { x: number, y: number }) => { x: number, y: number }
}

export const Draggable = (props: DraggableProps) => {
    const {id, className, children, initialPos, fixOnAxis, onDragEnd} = props;
    const ref = useRef();

    const [state, setState] = useState({
        pos: initialPos,
        dragging: false,
        // position relative to the cursor
        rel: {
            x: 0,
            y: 0
        }
    });

    console.log('DRAGGABLE', state.pos);

    let isDragging = state.dragging;

    // calculate relative position to the mouse and set dragging=true
    const onMouseDown = (e) => {
        console.log('MOUSEDOWN')
        // only left mouse button
        if (e.button !== 0) return;

        const rel = {
            x: e.pageX - state.pos.x,
            y: e.pageY - state.pos.y
        };

        if (fixOnAxis === "y") {
            rel.x = initialPos.x;
        }
        if (fixOnAxis === "x") {
            rel.y = initialPos.y;
        }

        setState((p) => ({...p, dragging: true, rel}));

        e.stopPropagation();
        e.preventDefault();
    };
    const onMouseUp = (e) => {
        console.log('MOUSEUP')
        isDragging = false;
        setState((p) => ({...p, dragging: false}));
        console.log(state.pos)
        onDragEnd && onDragEnd(state.pos);
        e.stopPropagation();
        e.preventDefault();
    };
    const onMouseMove = (e) => {
        // prevent extra drag event just after mouseup
        if (!state.dragging || !isDragging) return;

        let x = e.pageX - state.rel.x;
        let y = e.pageY - state.rel.y;

        if (fixOnAxis === "y") {
            x = initialPos.x;
        }
        if (fixOnAxis === "x") {
            y = initialPos.y;
        }

        if (props.constrainFn) {
            ({x, y} = props.constrainFn({x, y}));
        }

        setState((p) => ({...p, pos: {x, y}}));

        console.log('MOUSEMOVE', state.pos, {x, y})

        e.stopPropagation();
        e.preventDefault();
    };

    useEffect(() => {
        console.log('DRAGGING', state.dragging);

        if (state.dragging) {
            document.addEventListener("mousemove", onMouseMove);
            document.addEventListener("mouseup", onMouseUp);
        }

        return () => {
            console.log(`CLEANUP, DRAGGING ${state.dragging}`)

            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
        };
    }, [state.dragging, onMouseUp, onMouseMove]);

    return (
        <div
            id={id}
            className={className}
            ref={ref}
            onMouseDown={onMouseDown}
            onMouseUp={onMouseUp}
            style={{
                position: "absolute",
                left: state.pos.x,
                top: state.pos.y
            }}
        >
            {children}
        </div>
    );
};
