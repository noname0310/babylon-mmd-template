import { Engine } from "@babylonjs/core";

import { BaseRuntime } from "./BaseRuntime";
import css from "./index.css";
import { SceneBuilder } from "./SceneBuilder";
css;

const canvas = document.getElementById("render-canvas");
if (!(canvas instanceof HTMLCanvasElement)) throw new Error("Invalid canvas element");

const engine = new Engine(canvas, true, {
    preserveDrawingBuffer: true,
    stencil: true,
    antialias: true
}, true);

BaseRuntime.Create({
    canvas,
    engine,
    sceneBuilder: new SceneBuilder()
}).then(runtime => runtime.run());
