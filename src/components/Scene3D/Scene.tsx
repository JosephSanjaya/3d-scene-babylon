"use client";

import { useEffect, useRef } from "react";
import * as BABYLON from "@babylonjs/core";
import "@babylonjs/loaders"; // Import loaders to handle .glb files

export const Scene = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Create Babylon.js engine
    const engine = new BABYLON.Engine(canvasRef.current, true);
    const scene = new BABYLON.Scene(engine);

    // Create Camera
    const camera = new BABYLON.ArcRotateCamera("camera", Math.PI / 2, Math.PI / 2, 20, BABYLON.Vector3.Zero(), scene);
    camera.attachControl(canvasRef.current, true);

    // Create Light
    new BABYLON.HemisphericLight("light", new BABYLON.Vector3(1, 1, 0), scene);

    // Load 3D Model
    BABYLON.SceneLoader.ImportMesh("", "/models/", "Female_All.glb", scene, (meshes, particleSystems, skeletons, animationGroups) => {
      const model = meshes[0]; // Get the main mesh
      model.scaling = new BABYLON.Vector3(1, 1, 1); // Adjust size if needed
      // model.rotationQuaternion = null;
      // model.rotation = new BABYLON.Vector3(0, -Math.PI, 0); // Rotate 180 degrees on Y-axis
      model.rotate(BABYLON.Axis.Y, Math.PI, BABYLON.Space.LOCAL);
      model.position.y -= 5; // Move the model down
      
      console.log("animations ======", animationGroups.map(a => a.name)); // Print all animation names

      // Play animations (assuming there's at least one)
      if (animationGroups.length > 0) {
        animationGroups[1].start(true); // Loop the first animation
      }

      // const walkAnim = animationGroups.find(a => a.name === "Walk");
      // const runAnim = animationGroups.find(a => a.name === "Run");

      // // Stop current animation and play new one
      // walkAnim.stop();
      // runAnim.start(true, 1.0, runAnim.from, runAnim.to, false);
    });

    // Render loop
    engine.runRenderLoop(() => {
      scene.render();
    });

    // Resize event
    // window.addEventListener("resize", () => engine.resize());

    return () => {
      engine.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} className="w-full h-full" />;
};

export default Scene;
