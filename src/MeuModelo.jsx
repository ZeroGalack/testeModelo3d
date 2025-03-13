import React, { useState, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Html } from "@react-three/drei";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

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
  const timeValuesRef = useRef([]);

  const handlePointerDown = (e) => {
    e.stopPropagation();
    draggingRef.current = true;
    startYRef.current = e.clientY;
    initialScaleRef.current = onDrag("get");
    dragStartTimeRef.current = Date.now();
    scaleValuesRef.current = [];
    timeValuesRef.current = [];

    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerUp);
  };

  const handlePointerMove = (e) => {
    if (!draggingRef.current) return;
    const deltaY = e.clientY - startYRef.current;
    const sensitivity = 0.005;
    let newScale = initialScaleRef.current - deltaY * sensitivity;
  
    // 🛠 Aplicar o clamping aqui também
    newScale = Math.min(Math.max(newScale, 0.5), 1.5);
  
    onDrag("update", newScale);
  
    const elapsedTime = Date.now() - dragStartTimeRef.current;
    scaleValuesRef.current.push({ time: elapsedTime / 1000, value: newScale });
  };
  

  const handlePointerUp = () => {
    draggingRef.current = false;
    document.removeEventListener("pointermove", handlePointerMove);
    document.removeEventListener("pointerup", handlePointerUp);
    onDrag("finish", scaleValuesRef.current);
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
      <span style={{ fontSize: "12px", textAlign: "center" }}>Arraste<br /> para redim.</span>
    </div>
  );
}

export default function App() {
  const [scaleY, setScaleY] = useState(1);
  const [graphData, setGraphData] = useState([]);
  const [isGraphVisible, setIsGraphVisible] = useState(false);

  const handleDrag = (mode, newVal) => {
    if (mode === "get") {
      return scaleY;
    } else if (mode === "update") {
      const clamped = Math.min(Math.max(newVal, 0.5), 1.5);
      
      setScaleY(clamped);
    } else if (mode === "finish") {
      setGraphData(newVal); // Atualiza o gráfico apenas no final
    }
  };

  return (
    <div style={{ backgroundColor: "#000", position: "relative", width: "100vw", height: "100vh" }}>
      <Canvas camera={{ position: [0, 2, 5], fov: 50 }}>
        <ambientLight intensity={1} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <ResizableModel scaleY={scaleY} />
        <OrbitControls />
        <Html position={[0, 0, 0]} center>
          <DragHandle onDrag={handleDrag} />
        </Html>
      </Canvas>

      <div onClick={() => setIsGraphVisible((prev) => !prev)}
        style={{
          position: "absolute",
          top: "0px",
          left: isGraphVisible ? `calc(40% + 40px)` : "0px",
          height: "50px",
          backgroundColor: "#f5f5f5",
          cursor: "pointer",
          borderRadius: "0px 0px 5px 0px",
          padding: "10px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          writingMode: "vertical-lr",
          textAlign: "center",
          transition: "left 0.3s ease",
        }}>
        <p style={{ margin: 0 }}>Gráfico</p>
      </div>

      {isGraphVisible && (
        <div className="Graph"
          style={{
            position: "absolute",
            top: "0",
            width: "40%",
            height: "50%",
            backgroundColor: "#350525b8",
            borderRadius: "0px 0px 10px 10px",
            boxShadow: "0px 4px 10px rgba(255, 255, 255, 0.1)",
            padding: '20px'
          }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={graphData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" stroke="#ffffff" label={{ value: "Tempo (s)", position: "insideBottom", offset: -5, fill: "#f3f3f3" }} />
                <YAxis stroke="#ffffff" label={{ value: "Comprimento (mm)", dy: +60, position: "insideLeft", angle: -90, fill: "#f3f3f3" }} domain={[0, 2]} />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#ff7300" />
            </LineChart>
            </ResponsiveContainer>

        </div>
      )}
    </div>
  );
}
