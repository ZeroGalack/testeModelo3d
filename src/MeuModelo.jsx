import React, { useState, useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Html } from "@react-three/drei";

import { runHill } from "./runHill";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function ResizableModel({ scaleY }) {
  const { scene } = useGLTF("/modelo.glb");
  return (
    <group scale={[1, scaleY, 1]}>
      {" "}
      <primitive object={scene} />{" "}
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

    // Aplicar o clamping aqui
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
      <span style={{ fontSize: "12px", textAlign: "center" }}>
        Arraste
        <br /> para redim.
      </span>
    </div>
  );
}

export default function App() {
  const [scaleY, setScaleY] = useState(1);

  const [graphData, setGraphData] = useState([]);
  const [dataH, setDataH] = useState([]);

  const [deitado, setDeitado] = useState(false);
  const [isGraphVisibleEnergia, setIsGraphVisibleEnergia] = useState(false);
  const [isGraphVisibleForca, setIsGraphVisibleForca] = useState(false);
  const [isGraphVisibleTemp, setIsGraphVisibleTemp] = useState(false);
  const [isGraphVisibleCompr, setIsGraphVisibleCompr] = useState(false);
  const [currentGraph, setCurrentGraph] = useState(null); // Estado do gráfico visível

  const handleGraphChange = (graphName) => {
    setCurrentGraph(graphName === currentGraph ? null : graphName); // Alterna entre exibir ou esconder o gráfico
  };

  const Graph = ({
    isVisible,
    title,
    yAxisLabel,
    graphData,
    boxWidth,
    deitado,
  }) => {
    if (!isVisible) return null;

    return (
      <div
        className="Graph"
        style={{
          position: "absolute",
          top: "0",
          width: boxWidth,
          height: "50%",
          backgroundColor: "rgba(37, 0, 255, 0.08)",
          borderRadius: "0px 0px 10px 10px",
          boxShadow: "0px 4px 10px rgba(0, 64, 255, 0.1)",
          padding: deitado ? "1vw" : "1vh",
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={graphData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="time"
              stroke="#ffffff"
              tickFormatter={(t) => t.toFixed(2)}
              label={{
                value: "Tempo (s)",
                position: "insideBottom",
                offset: -5,
                fill: "#f3f3f3",
              }}
            />
            <YAxis
              stroke="#ffffff"
              label={{
                value: yAxisLabel,
                dy: +60,
                position: "insideLeft",
                angle: -90,
                fill: "#f3f3f3",
              }}
              domain={[0, 2]}
            />
            <Tooltip
              formatter={(value, name) => [value.toFixed(2), name]}
              labelFormatter={(label) => `Tempo: ${label.toFixed(2)}s`}
            />
            <Line type="monotone" dataKey="value" stroke="rgb(60, 255, 0)" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const GraphToggleButtons = ({
    label,
    toggleState,
    setToggleState,
    textFont,
  }) => (
    <div
      onClick={() => setToggleState(!toggleState)}
      style={{
        backgroundColor: "#f5f5f5",
        cursor: "pointer",
        borderRadius: "10px 0px 0px 10px",
        padding: "10px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        writingMode: "sideways-lr",
        textAlign: "center",
        fontSize: textFont,
      }}
    >
      <p style={{ margin: 0 }}>{label}</p>
    </div>
  );

  const [boxWidth, setBoxWidth] = useState("75%");
  useEffect(() => {
    const handleResize = () => {
      const isPortrait = window.matchMedia("(orientation: portrait)").matches;
      setBoxWidth(isPortrait ? "75%" : "45%");
      setDeitado(isPortrait ? false : true);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  function resampleDataToLength(data, targetLength = 100) {
    if (data.length === 0) return [];

    const totalTime = data[data.length - 1].time;
    const step = totalTime / (targetLength - 1);

    const resampled = [];
    let j = 0;

    for (let i = 0; i < targetLength; i++) {
      const t = i * step;

      while (j < data.length - 1 && data[j + 1].time < t) {
        j++;
      }

      if (j === data.length - 1) {
        resampled.push({ time: t, value: data[j].value });
      } else {
        const t0 = data[j].time;
        const t1 = data[j + 1].time;
        const v0 = data[j].value;
        const v1 = data[j + 1].value;
        const ratio = (t - t0) / (t1 - t0);
        const value = v0 + ratio * (v1 - v0);

        resampled.push({ time: t, value });
      }
    }

    return resampled;
  }

  const handleDrag = (mode, newVal) => {
    if (mode === "get") {
      return scaleY;
    } else if (mode === "update") {
      const clamped = Math.min(Math.max(newVal, 0.5), 1.5);
      setScaleY(clamped);
    } else if (mode === "finish") {
      const resampled = resampleDataToLength(newVal);

      const t = resampled.map((point) => point.time);
      const L = resampled.map((point) => point.value);

      const results = runHill(L, t);

      const graphDataH = t.map((time, i) => ({
        time,
        value: results.H[i],
      }));

      setDataH(graphDataH);
      setGraphData(resampled); // Atualiza o gráfico apenas no final
    }
  };

  return (
    <div
      style={{
        backgroundColor: "#000",
        position: "relative",
        width: "100vw",
        height: "100vh",
        background:
          "radial-gradient(circle, rgb(4, 0, 37) 0%, rgb(0, 0, 0) 60%, #000 100%)",
      }}
    >
      <Canvas camera={{ position: [0, 2, 5], fov: 50 }}>
        <ambientLight intensity={1} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <ResizableModel scaleY={scaleY} />
        <OrbitControls />
        <Html position={[0, 0, 0]} center>
          <DragHandle onDrag={handleDrag} />
        </Html>
      </Canvas>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: "0.2em",
          position: "absolute",
          bottom: "0px",
          right: "0px",
        }}
      >
        <GraphToggleButtons
          label="Comprimento"
          toggleState={isGraphVisibleCompr}
          setToggleState={setIsGraphVisibleCompr}
          textFont={deitado ? "1.1vw" : "1.1vh"}
        />
        <GraphToggleButtons
          label="Temperatura"
          toggleState={isGraphVisibleTemp}
          setToggleState={setIsGraphVisibleTemp}
          textFont={deitado ? "1.1vw" : "1.1vh"}
        />
        <GraphToggleButtons
          label="Força"
          toggleState={isGraphVisibleForca}
          setToggleState={setIsGraphVisibleForca}
          textFont={deitado ? "1.1vw" : "1.1vh"}
        />
        <GraphToggleButtons
          label="Energia"
          toggleState={isGraphVisibleEnergia}
          setToggleState={setIsGraphVisibleEnergia}
          textFont={deitado ? "1.1vw" : "1.1vh"}
        />
      </div>

      <Graph
        isVisible={isGraphVisibleCompr}
        title="Comprimento"
        yAxisLabel="Comprimento (mm)"
        graphData={graphData}
        boxWidth={boxWidth}
        deitado={deitado}
      />
      <Graph
        isVisible={isGraphVisibleEnergia}
        title="Energia"
        yAxisLabel="Energia (J)"
        graphData={graphData}
        boxWidth={boxWidth}
        deitado={deitado}
      />
      <Graph
        isVisible={isGraphVisibleForca}
        title="Força"
        yAxisLabel="Força (N)"
        graphData={graphData}
        boxWidth={boxWidth}
        deitado={deitado}
      />
      <Graph
        isVisible={isGraphVisibleTemp}
        title="Temperatura"
        yAxisLabel="Temperatura (°C)"
        graphData={dataH}
        boxWidth={boxWidth}
        deitado={deitado}
      />
    </div>
  );
}
