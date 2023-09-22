import {ComponentChild, h} from "preact";
import {useEffect, useRef, useState} from "preact/compat";

interface DraggableProps {
    id: string
    className: string
    children: ComponentChild
    initialPos: { x: number, y: number }
    fixOnAxis?: "x" | "y"
    constrains: { x: number, y: number, width: number, height: number }
    onDragEnd?: (pos: { x: number, y: number }) => void
}

export const Draggable = (props: DraggableProps) => {
    const {id, className, children, initialPos, fixOnAxis, constrains, onDragEnd} = props;
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

    useEffect(() => {
        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);

        return () => {
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
        };
    }, [state.dragging]);

    // calculate relative position to the mouse and set dragging=true
    const onMouseDown = (e) => {
        // only left mouse button
        if (e.button !== 0) return;
        const pos = ref.current.getBoundingClientRect();

        const rel = {
            x: e.pageX - pos.left,
            y: e.pageY - pos.top
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
        setState((p) => ({...p, dragging: false}));
        onDragEnd && onDragEnd(state.pos);
        e.stopPropagation();
        e.preventDefault();
    };
    const onMouseMove = (e) => {
        if (!state.dragging) return;
        let x = e.pageX - state.rel.x;
        let y = e.pageY - state.rel.y;

        const pos = {
            x: x < constrains.x ? constrains.x : x > constrains.width ? constrains.width : x,
            y: y < constrains.y ? constrains.y : y > constrains.height ? constrains.height : y
        };
        if (fixOnAxis === "y") {
            pos.x = initialPos.x;
        }
        if (fixOnAxis === "x") {
            pos.y = initialPos.y;
        }


        setState((p) => ({...p, pos}));
        e.stopPropagation();
        e.preventDefault();
    };

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
