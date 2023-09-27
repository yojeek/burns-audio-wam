import {ComponentChild, h} from "preact";
import {useEffect, useRef, useState} from "preact/compat";

interface DraggableProps {
    children?: ComponentChild
    initialPos: { x: number, y: number }
    fixOnAxis?: "x" | "y"
    constrainFn?: (pos: { x: number, y: number }) => { x: number, y: number }
    onDragStart?: (pos: { x: number, y: number }) => void
    onDragEnd?: (pos: { x: number, y: number }) => void
}

export const Draggable = (props: DraggableProps) => {
    const {children, initialPos, fixOnAxis, onDragEnd, onDragStart} = props;
    const ref = useRef();

    if (isFinite(initialPos.x) === false || isFinite(initialPos.y) === false) {
        console.warn('INVALID INITIAL POS', initialPos)
        return null;
    }

    const [state, setState] = useState({
        pos: initialPos,
        dragging: false,
        // position relative to the cursor
        rel: {
            x: 0,
            y: 0
        }
    });

    useEffect(() => {
        setState((p) => ({...p, pos: initialPos}));
    }, [initialPos]);

    useEffect(() => {
        if (state.dragging) {
            onDragStart && onDragStart(state.pos);
        } else {
            onDragEnd && onDragEnd(state.pos);
        }
    }, [state.dragging]);

    let isDragging = state.dragging;

    // calculate relative position to the mouse and set dragging=true
    const onMouseDown = (e) => {
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
        isDragging = false;
        setState((p) => ({...p, dragging: false}));
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

        e.stopPropagation();
        e.preventDefault();
    };

    useEffect(() => {
        if (state.dragging) {
            document.addEventListener("mousemove", onMouseMove);
            document.addEventListener("mouseup", onMouseUp);
        }

        return () => {
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
        };
    }, [state.dragging, onMouseUp, onMouseMove]);

    return (
        <div
            className="drag-handle"
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
