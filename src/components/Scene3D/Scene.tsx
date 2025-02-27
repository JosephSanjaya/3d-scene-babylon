"use client";

import { useEffect, useRef, useImperativeHandle, forwardRef, useState } from "react";
import * as BABYLON from "@babylonjs/core";
import "@babylonjs/loaders";
import { Menu } from '@headlessui/react';
import { ChevronDown, Play, Loader, RefreshCw } from 'lucide-react';

// Constants
const ANIMATIONS = {
  BYE: { index: 1, label: "Bye" },
  ANGRY: { index: 2, label: "Angry" },
  HELLO: { index: 3, label: "Hello" },
  IDLE: { index: 4, label: "Idle" },
  LAUGHING: { index: 5, label: "Laughing" },
  TALKING: { index: 6, label: "Talking" },
  THANK_YOU: { index: 7, label: "Thank You" }
};

const MODELS = {
  HIJAB: { fileName: "BPJS_Female_Hijab.glb", label: "Female with Hijab" },
  NORMAL: { fileName: "BPJS_Female_Normal.glb", label: "Female Normal" }
};

// Custom hook for managing Babylon.js scene
const useBabylonScene = (canvasRef) => {
  const [engine, setEngine] = useState(null);
  const [scene, setScene] = useState(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const newEngine = new BABYLON.Engine(canvasRef.current, true);
    const newScene = new BABYLON.Scene(newEngine);

    setEngine(newEngine);
    setScene(newScene);

    // Create Light
    new BABYLON.HemisphericLight("light", new BABYLON.Vector3(1, 1, 0), newScene);

    return () => {
      newEngine.dispose();
    };
  }, []);

  return { engine, scene };
};

// Custom hook for managing model loading and animations
const useModelManager = (scene) => {
  const currentModelRef = useRef(null);
  const animationGroupsRef = useRef([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentAnimation, setCurrentAnimation] = useState(ANIMATIONS.IDLE.label);
  const [currentModel, setCurrentModel] = useState(MODELS.HIJAB.label);

  const loadModel = async (modelFileName) => {
    if (!scene) return;
    setIsLoading(true);

    try {
      if (currentModelRef.current) {
        currentModelRef.current.dispose();
      }

      return new Promise((resolve, reject) => {
        BABYLON.SceneLoader.ImportMesh(
            "",
            "/models/",
            modelFileName,
            scene,
            (meshes, particleSystems, skeletons, animationGroups) => {
              if (!meshes.length) {
                console.error("No meshes found!");
                reject();
                return;
              }

              const model = meshes[0];
              model.scaling = new BABYLON.Vector3(1, 1, 1);
              model.rotate(BABYLON.Axis.Y, Math.PI, BABYLON.Space.LOCAL);
              model.position.y -= 5;

              currentModelRef.current = model;
              animationGroupsRef.current = animationGroups;

              let customCamera = scene.getCameraByName("Camera");
              if (customCamera) {
                console.log("Using model's camera");
                customCamera.attachControl(scene.getEngine().getRenderingCanvas(), true);
                scene.activeCamera = customCamera;
              } else {
                console.warn("Model has no camera, creating default one.");
                const camera = new BABYLON.ArcRotateCamera(
                    "defaultCamera",
                    Math.PI / 2,
                    Math.PI / 2,
                    20,
                    BABYLON.Vector3.Zero(),
                    scene
                );
                camera.attachControl(scene.getEngine().getRenderingCanvas(), true);
                scene.activeCamera = camera;
              }

              // 🎥 Start the default animation
              if (animationGroups.length > 0) {
                animationGroups[ANIMATIONS.IDLE.index]?.start(true);
              } else {
                console.warn("No animations found in model.");
              }

              setIsLoading(false);
              resolve();
            },
            null, // onProgress
            (error) => {
              console.error("Error loading model:", error);
              setIsLoading(false);
              reject(error);
            }
        );
      });
    } catch (error) {
      console.error("Error in loadModel function:", error);
      setIsLoading(false);
    }
  };

  return {
    loadModel,
    currentModelRef,
    animationGroupsRef,
    isLoading,
    currentAnimation,
    setCurrentAnimation,
    currentModel,
    setCurrentModel
  };
};

// Debug UI Component
const DebugUI = ({ onAnimationChange, onModelChange, currentAnimation, currentModel, isLoading }) => {
  return (
      <div className="fixed top-4 left-4 space-y-2 bg-white/90 p-4 rounded-lg shadow-lg">
        <h3 className="font-bold text-lg mb-4">Debug Controls</h3>

        <div className="space-y-4">
          <Menu as="div" className="relative">
            <Menu.Button className="flex items-center justify-between w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
              <span>Animation: {currentAnimation}</span>
              <ChevronDown className="w-4 h-4 ml-2" />
            </Menu.Button>
            <Menu.Items className="absolute left-0 mt-2 w-56 bg-white rounded-md shadow-lg p-1 z-10">
              {Object.values(ANIMATIONS).map((anim) => (
                  <Menu.Item key={anim.index}>
                    <button
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 rounded"
                        onClick={() => onAnimationChange(anim.index, anim.label)}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      {anim.label}
                    </button>
                  </Menu.Item>
              ))}
            </Menu.Items>
          </Menu>

          <Menu as="div" className="relative">
            <Menu.Button className="flex items-center justify-between w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
              <span>Model: {currentModel}</span>
              <ChevronDown className="w-4 h-4 ml-2" />
            </Menu.Button>
            <Menu.Items className="absolute left-0 mt-2 w-56 bg-white rounded-md shadow-lg p-1 z-10">
              {Object.values(MODELS).map((model) => (
                  <Menu.Item key={model.fileName}>
                    <button
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-green-50 rounded"
                        onClick={() => onModelChange(model.fileName, model.label)}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      {model.label}
                    </button>
                  </Menu.Item>
              ))}
            </Menu.Items>
          </Menu>
        </div>

        {isLoading && (
            <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
              <Loader className="w-6 h-6 text-white animate-spin" />
            </div>
        )}
      </div>
  );
};

// Main Scene Component
export const Scene = forwardRef((props, ref) => {
  const canvasRef = useRef(null);
  const { engine, scene } = useBabylonScene(canvasRef);
  const {
    loadModel,
    animationGroupsRef,
    isLoading,
    currentAnimation,
    setCurrentAnimation,
    currentModel,
    setCurrentModel
  } = useModelManager(scene);

  useEffect(() => {
    if (!scene || !engine) return;

    loadModel(MODELS.HIJAB.fileName).then((result) => {
      console.log(result)
      engine.runRenderLoop(() => {
        scene.render();
      });
    });

    return () => engine.stopRenderLoop();
  }, [scene, engine]);

  useImperativeHandle(ref, () => ({
    changeAnimation: (animationIndex) => {
      if (!animationGroupsRef.current.length) return;

      animationGroupsRef.current.forEach(anim => anim.stop());
      if (animationGroupsRef.current[animationIndex]) {
        animationGroupsRef.current[animationIndex].start(true);
      }
    },
    changeModel: async (modelFileName) => {
      if (!scene) return;
      await loadModel(modelFileName);
    }
  }));

  const handleAnimationChange = (index, label) => {
    setCurrentAnimation(label);
    if (!animationGroupsRef.current.length) {
      console.warn("No animation groups available!");
      return;
    }

    animationGroupsRef.current.forEach(anim => anim.stop());
    if (animationGroupsRef.current[index]) {
      console.log(`Playing animation: ${label}`);
      animationGroupsRef.current[index].start(true);
    } else {
      console.warn("Animation index out of range:", index);
    }
  };

  const handleModelChange = async (fileName, label) => {
    setCurrentModel(label);
    await loadModel(fileName);
  };

  return (
      <>
        <canvas ref={canvasRef} className="w-full h-full" />
        <DebugUI
            onAnimationChange={handleAnimationChange}
            onModelChange={handleModelChange}
            currentAnimation={currentAnimation}
            currentModel={currentModel}
            isLoading={isLoading}
        />
      </>
  );
});

Scene.displayName = 'Scene';

export default Scene;