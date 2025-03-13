import React, { useState, useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Html } from "@react-three/drei";

function ResizableModel({ scaleY }) {
  const { scene } = useGLTF("/modelo.glb");
  return (
    <group scale={[1, scaleY, 1]}>
      <primitive object={scene} />
    </group>
  );
}

function DragHandle({ onDrag }) {
    const draggingRef = useRef(false);
    const startYRef = useRef(0);
    const initialScaleRef = useRef(0);
  
    const dragStartTimeRef = useRef(0);
    const scaleValuesRef = useRef([]);
    const timeValuesRef = useRef([]); // Novo array para armazenar os tempos
  
    const handlePointerDown = (e) => {
      e.stopPropagation();
      draggingRef.current = true;
      startYRef.current = e.clientY;
      initialScaleRef.current = onDrag("get");
  
      dragStartTimeRef.current = Date.now();
      
      scaleValuesRef.current = [initialScaleRef.current];
      timeValuesRef.current = [0]; // Começa com tempo 0
  
      document.addEventListener("pointermove", handlePointerMove);
      document.addEventListener("pointerup", handlePointerUp);
    };
  
    const handlePointerMove = (e) => {
      if (!draggingRef.current) return;
      const deltaY = e.clientY - startYRef.current;
      const sensitivity = 0.005;
      const newScale = initialScaleRef.current - deltaY * sensitivity;
      onDrag("update", newScale);
  
      const elapsedTime = Date.now() - dragStartTimeRef.current;
  
      scaleValuesRef.current.push(newScale);
      timeValuesRef.current.push(elapsedTime);
    };
  
    const handlePointerUp = () => {
      draggingRef.current = false;
  
      console.log("Tempos (ms):", timeValuesRef.current);
      console.log("Valores de escala:", scaleValuesRef.current);
  
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
    };
  
    return (
      <div
        onPointerDown={handlePointerDown}
        style={{
          width: "60px",
          height: "60px",
          backgroundColor: "#ffffff38",
          borderRadius: "10px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          cursor: "grab",
          userSelect: "none",
          boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
        }}
      >
        <span style={{ fontSize: "12px", textAlign: "center" }}>
          Arraste
          <br /> para redim.
        </span>
      </div>
    );
  }

export default function App() {
  const [scaleY, setScaleY] = useState(1);
  const [boxWidth, setBoxWidth] = useState("75%");
  const [textFont, setTextFont] = useState("1.1vw");
  const [terminalContent, setTerminalContent] = useState([]);

  const [isTerminalVisible, setIsTerminalVisible] = useState(false);
  const [isGraphVisible, setIsGraphVisible] = useState(false);

  const terminalRef = useRef(null);
  const graphRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      const isPortrait = window.matchMedia("(orientation: portrait)").matches;
      setBoxWidth(isPortrait ? "75%" : "45%");
      setTextFont(isPortrait ? "1.1vh" : "1.1vw");
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const increaseScale = () => {
    setScaleY((prev) => {
      const newScale = Math.min(prev + 0.1, 1.5);
      addTerminalEntry(`Leght: ${newScale.toFixed(2)} mm`);
      return newScale;
    });
  };

  const decreaseScale = () => {
    setScaleY((prev) => {
      const newScale = Math.max(prev - 0.1, 0.5);
      addTerminalEntry(`Leght: ${newScale.toFixed(2)} mm`);
      return newScale;
    });
  };

  const addTerminalEntry = (entry) => {
    setTerminalContent((prevContent) => [...prevContent, entry]);
  };

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalContent]);

  const toggleTerminal = () => {
    setIsTerminalVisible((prev) => !prev);
  };

  const toggleGraph = () => {
    setIsGraphVisible((prev) => !prev);
  };

  // Callback usado pelo DragHandle
  const handleDrag = (mode, newVal) => {
    if (mode === "get") {
      return scaleY;
    } else if (mode === "update") {
      const clamped = Math.min(Math.max(newVal, 0.5), 1.5);
      setScaleY(clamped);
      addTerminalEntry(`Leght: ${clamped.toFixed(2)} mm`);
    }
  };

  return (
    <div style={{ backgroundColor: "#000", position: "relative", width: "100vw", height: "100vh" }}>
      <Canvas camera={{ position: [0, 2, 5], fov: 50 }}>
        <ambientLight intensity={1} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <ResizableModel scaleY={scaleY} />
        <OrbitControls />
        {/* Renderiza o DragHandle dentro do Canvas com <Html> */}
        <Html position={[0, 0, 0]} center>
          <DragHandle onDrag={handleDrag} />
        </Html>
      </Canvas>

      {/* Botões e outros elementos DOM (Terminal, Gráfico) fora do Canvas */}
      {!isGraphVisible && (
        <div
          onClick={toggleTerminal}
          style={{
            position: "absolute",
            top: "0px",
            left: isTerminalVisible ? boxWidth : "0px",
            height: "50px",
            backgroundColor: "#ffff",
            cursor: "pointer",
            borderRadius: "0px 0px 5px 0px",
            padding: "10px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            writingMode: "vertical-lr",
            textAlign: "center",
            transition: "left 0.3s ease",
          }}
        >
          <p style={{ margin: 0 }}>Terminal</p>
        </div>
      )}

      {!isTerminalVisible && (
        <div
          onClick={toggleGraph}
          style={{
            position: "absolute",
            top: "72px",
            left: isGraphVisible ? boxWidth : "0px",
            height: "50px",
            backgroundColor: "#ffff",
            cursor: "pointer",
            borderRadius: "0px 0px 5px 0px",
            padding: "10px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            writingMode: "vertical-lr",
            textAlign: "center",
            transition: "left 0.3s ease",
          }}
        >
          <p style={{ margin: 0 }}>Gráfico</p>
        </div>
      )}

      {isTerminalVisible && (
        <div
          className="Terminal"
          style={{
            position: "absolute",
            top: "0",
            width: boxWidth,
            height: "50%",
            backgroundColor: "#350525b8",
            borderRadius: "0px 10px 10px 10px",
            boxShadow: "0px 4px 10px rgba(255, 255, 255, 0.1)",
            overflowY: "auto",
          }}
          ref={terminalRef}
        >
          {terminalContent.map((entry, index) => (
            <p key={index} style={{ color: "#ffffff", paddingLeft: "10px", fontSize: textFont }}>
              {entry}
            </p>
          ))}
        </div>
      )}

      {isGraphVisible && (
        <div
          className="Graph"
          style={{
            position: "absolute",
            top: "0",
            width: boxWidth,
            height: "50%",
            backgroundColor: "#350525b8",
            borderRadius: "0px 10px 10px 10px",
            boxShadow: "0px 4px 10px rgba(255, 255, 255, 0.1)",
            overflowY: "auto",
          }}
          ref={graphRef}
        >
          <p style={{ color: "#ffffff", paddingLeft: "10px", fontSize: textFont }}>Gráfico estará aqui!</p>
        </div>
      )}
    </div>
  );
}
