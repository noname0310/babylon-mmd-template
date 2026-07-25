import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera.pure";
import { EngineFunctionContext } from "@babylonjs/core/Engines/abstractEngine.functions";
import { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine.pure";
import { RegisterAbstractEngineLoadingScreen } from "@babylonjs/core/Engines/AbstractEngine/abstractEngine.loadingScreen.pure";
import { RegisterAbstractEngineStates } from "@babylonjs/core/Engines/AbstractEngine/abstractEngine.states.pure";
import { RegisterAbstractEngineStencil } from "@babylonjs/core/Engines/AbstractEngine/abstractEngine.stencil.pure";
import { RegisterAbstractEngineTexture } from "@babylonjs/core/Engines/AbstractEngine/abstractEngine.texture.pure";
import { RegisterEnginesExtensionsEngineAlpha } from "@babylonjs/core/Engines/Extensions/engine.alpha.pure";
import { RegisterEnginesExtensionsEngineRawTexture } from "@babylonjs/core/Engines/Extensions/engine.rawTexture.pure";
import { RegisterEnginesExtensionsEngineRenderTarget } from "@babylonjs/core/Engines/Extensions/engine.renderTarget.pure";
import { RegisterEnginesExtensionsEngineRenderTargetTexture } from "@babylonjs/core/Engines/Extensions/engine.renderTargetTexture.pure";
import { RegisterEngineUniformBuffer } from "@babylonjs/core/Engines/Extensions/engine.uniformBuffer.pure";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight.pure";
import { ShadowGenerator } from "@babylonjs/core/Lights/Shadows/shadowGenerator";
import { RegisterLoadingScreen } from "@babylonjs/core/Loading/loadingScreen.pure";
import { LoadAssetContainerAsync } from "@babylonjs/core/Loading/sceneLoader";
import { _GetCompatibleTextureLoader } from "@babylonjs/core/Materials/Textures/Loaders/textureLoaderManager";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color.pure";
import { Matrix, Vector3 } from "@babylonjs/core/Maths/math.vector.pure";
import { CreateGround } from "@babylonjs/core/Meshes/Builders/groundBuilder.pure";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode.pure";
import { SetMissingSideEffectWarningsEnabled } from "@babylonjs/core/Misc/devTools";
import { LoadFile, LoadImage } from "@babylonjs/core/Misc/fileTools.pure";
import { DefaultRenderingPipeline } from "@babylonjs/core/PostProcesses/RenderPipeline/Pipelines/defaultRenderingPipeline.pure";
import { Scene } from "@babylonjs/core/scene.pure";
import { WebXRDefaultExperience } from "@babylonjs/core/XR/webXRDefaultExperience";
import { ShadowOnlyMaterial } from "@babylonjs/materials/shadowOnly/shadowOnlyMaterial";
import { RegisterMmdOutlineRenderer } from "babylon-mmd/esm/Loader/mmdOutlineRenderer.pure";
import { MmdStandardMaterialBuilder } from "babylon-mmd/esm/Loader/mmdStandardMaterialBuilder";
import { RegisterBpmxLoader } from "babylon-mmd/esm/Loader/Optimized/bpmxLoader.pure";
import { BvmdLoader } from "babylon-mmd/esm/Loader/Optimized/bvmdLoader";
import { RegisterDxBmpTextureLoader } from "babylon-mmd/esm/Loader/registerDxBmpTextureLoader";
import { SdefInjector } from "babylon-mmd/esm/Loader/sdefInjector";
import { RegisterMmdRuntimeCameraAnimation } from "babylon-mmd/esm/Runtime/Animation/mmdRuntimeCameraAnimation.pure";
import { RegisterMmdRuntimeModelAnimation } from "babylon-mmd/esm/Runtime/Animation/mmdRuntimeModelAnimation.pure";
import { StreamAudioPlayer } from "babylon-mmd/esm/Runtime/Audio/streamAudioPlayer";
import { MmdCamera } from "babylon-mmd/esm/Runtime/mmdCamera.pure";
import type { MmdMesh } from "babylon-mmd/esm/Runtime/mmdMesh";
import { MmdRuntime } from "babylon-mmd/esm/Runtime/mmdRuntime";
import { MmdWasmInstanceTypeMPR } from "babylon-mmd/esm/Runtime/Optimized/InstanceType/multiPhysicsRelease";
import { GetMmdWasmInstance } from "babylon-mmd/esm/Runtime/Optimized/mmdWasmInstance";
import { MultiPhysicsRuntime } from "babylon-mmd/esm/Runtime/Optimized/Physics/Bind/Impl/multiPhysicsRuntime";
import { MotionType } from "babylon-mmd/esm/Runtime/Optimized/Physics/Bind/motionType";
import { PhysicsStaticPlaneShape } from "babylon-mmd/esm/Runtime/Optimized/Physics/Bind/physicsShape";
import { RigidBody } from "babylon-mmd/esm/Runtime/Optimized/Physics/Bind/rigidBody";
import { RigidBodyConstructionInfo } from "babylon-mmd/esm/Runtime/Optimized/Physics/Bind/rigidBodyConstructionInfo";
import { MmdBulletPhysics } from "babylon-mmd/esm/Runtime/Optimized/Physics/mmdBulletPhysics";
import { MmdPlayerControl } from "babylon-mmd/esm/Runtime/Util/mmdPlayerControl";

import type { ISceneBuilder } from "./baseRuntime";

export class SceneBuilder implements ISceneBuilder {
    public async build(canvas: HTMLCanvasElement, engine: AbstractEngine): Promise<Scene> {
        SetMissingSideEffectWarningsEnabled(true); // for debug, we enable missing side effect warning.

        // Required Engine Extensions
        RegisterAbstractEngineStates();
        RegisterAbstractEngineStencil();
        RegisterAbstractEngineTexture();
        RegisterEnginesExtensionsEngineAlpha();
        RegisterEnginesExtensionsEngineRawTexture();
        // RegisterEnginesExtensionsEngineReadTexture();
        RegisterEnginesExtensionsEngineRenderTarget();
        RegisterEnginesExtensionsEngineRenderTargetTexture();
        RegisterEngineUniformBuffer();

        AbstractEngine.GetCompatibleTextureLoader = _GetCompatibleTextureLoader; // core/Engines/AbstractEngine/abstractEngine.textureLoaders.ts

        // core/Misc/fileTools.pure.ts
        // instead of using RegisterFileTools() to register the functions, we directly assign them to EngineFunctionContext
        EngineFunctionContext.loadFile = LoadFile;
        EngineFunctionContext.loadImage = LoadImage;

        // Optional Engine Extensions
        RegisterAbstractEngineLoadingScreen(); // optional, for use loading screen, we need to register this extension.
        RegisterLoadingScreen(); // optional, for use default loading screen, we need to register this extension.

        // RegisterPmxLoader(); // for load .pmx file, we need to register this extension.
        // RegisterPmdLoader(); // for load .pmd file, we need to register this extension.
        RegisterBpmxLoader(); // for load .bpmx file, we need to register this extension.
        RegisterMmdOutlineRenderer(); // for render outline, we need to register this extension.
        RegisterMmdRuntimeCameraAnimation(); // for play `MmdAnimation` we need to register this extension.
        RegisterMmdRuntimeModelAnimation(); // for play `MmdAnimation` we need to register this extension.

        // for accurate bmp texture loading, we need custom loader
        RegisterDxBmpTextureLoader();

        // for apply SDEF on shadow, outline, depth rendering
        SdefInjector.OverrideEngineCreateEffect(engine);

        // create mmd standard material builder
        const materialBuilder = new MmdStandardMaterialBuilder();
        // if you want override texture loading, uncomment following lines.
        // materialBuilder.loadDiffuseTexture = (): void => { /* do nothing */ };
        // materialBuilder.loadSphereTexture = (): void => { /* do nothing */ };
        // materialBuilder.loadToonTexture = (): void => { /* do nothing */ };

        // if you dont need outline rendering, comment out following line.
        // materialBuilder.loadOutlineRenderingProperties = (): void => { /* do nothing */ };

        const scene = new Scene(engine);
        scene.clearColor = new Color4(0.95, 0.95, 0.95, 1.0);
        scene.ambientColor = new Color3(0.5, 0.5, 0.5); // mmd scale material ambient color to 0.5. for same result, set ambient color to 0.5

        const mmdRoot = new TransformNode("mmdRoot", scene);
        mmdRoot.position.z = 20;

        // mmd camera for play mmd camera animation
        const mmdCamera = new MmdCamera("mmdCamera", new Vector3(0, 10, 0), scene);
        mmdCamera.maxZ = 300;
        mmdCamera.minZ = 1;
        mmdCamera.parent = mmdRoot;

        const camera = new ArcRotateCamera("arcRotateCamera", 0, 0, 45, new Vector3(0, 10, 1), scene);
        camera.maxZ = 1000;
        camera.minZ = 0.1;
        camera.setPosition(new Vector3(0, 10, -45));
        camera.attachControl(canvas, false);
        camera.inertia = 0.8;
        camera.speed = 4;
        camera.parent = mmdRoot;

        // for same result with mmd, we should use only directional light but if you want to use hemispheric light, uncomment following lines.
        // const hemisphericLight = new HemisphericLight("HemisphericLight", new Vector3(0, 1, 0), scene);
        // hemisphericLight.intensity = 0.4;
        // hemisphericLight.specular = new Color3(0, 0, 0);
        // hemisphericLight.groundColor = new Color3(1, 1, 1);

        const directionalLight = new DirectionalLight("DirectionalLight", new Vector3(0.5, -1, 1), scene);
        directionalLight.intensity = 1.0;
        // set frustum size manually for optimize shadow rendering
        directionalLight.autoCalcShadowZBounds = false;
        directionalLight.autoUpdateExtends = false;
        directionalLight.shadowMaxZ = 20;
        directionalLight.shadowMinZ = -20;
        directionalLight.orthoTop = 18;
        directionalLight.orthoBottom = -3;
        directionalLight.orthoLeft = -10;
        directionalLight.orthoRight = 10;
        directionalLight.shadowOrthoScale = 0;

        const shadowGenerator = new ShadowGenerator(1024, directionalLight, true);
        shadowGenerator.transparencyShadow = true;
        shadowGenerator.usePercentageCloserFiltering = true;
        shadowGenerator.forceBackFacesOnly = true;
        shadowGenerator.filteringQuality = ShadowGenerator.QUALITY_MEDIUM;
        shadowGenerator.frustumEdgeFalloff = 0.1;

        const ground = CreateGround("ground1", { width: 100, height: 100, subdivisions: 2, updatable: false }, scene);
        const shadowOnlyMaterial = ground.material = new ShadowOnlyMaterial("shadowOnly", scene);
        shadowOnlyMaterial.activeLight = directionalLight;
        shadowOnlyMaterial.alpha = 0.4;
        ground.receiveShadows = true;
        ground.parent = mmdRoot;

        // set audio player
        const audioPlayer = new StreamAudioPlayer(scene);
        audioPlayer.preservesPitch = false;
        // you need to get this file by yourself from https://youtu.be/y__uZETTuL8
        audioPlayer.source = "res/private_test/motion/melancholy_night/melancholy_night.mp3";

        // show loading screen
        engine.displayLoadingUI();

        const loadingTexts: string[] = [];
        const updateLoadingText = (updateIndex: number, text: string): void => {
            loadingTexts[updateIndex] = text;
            engine.loadingUIText = "<br/><br/><br/><br/>" + loadingTexts.join("<br/><br/>");
        };

        // for load .bvmd file, we use BvmdLoader. if you want to load .vmd or .vpd file, use VmdLoader / VpdLoader
        const bvmdLoader = new BvmdLoader(scene);
        bvmdLoader.loggingEnabled = true;

        // fatch assets in parallel by using Promise.all
        const [[mmdRuntime, physicsRuntime], mmdAnimation, modelMesh] = await Promise.all([
            (async(): Promise<[MmdRuntime, MultiPhysicsRuntime]> => {
                updateLoadingText(0, "Loading mmd runtime...");
                const wasmInstance = await GetMmdWasmInstance(new MmdWasmInstanceTypeMPR());
                updateLoadingText(0, "Loading mmd runtime... Done");

                const physicsRuntime = new MultiPhysicsRuntime(wasmInstance);
                physicsRuntime.setGravity(new Vector3(0, -98, 0));
                physicsRuntime.register(scene);

                // create mmd runtime with physics
                // see https://github.com/noname0310/babylon-mmd/pull/38 for more information about MMD Runtime setup
                const mmdRuntime = new MmdRuntime(scene, new MmdBulletPhysics(physicsRuntime)); // `MmdPhysics` use Bullet physics engine for solve rigid body simulation
                mmdRuntime.loggingEnabled = true;
                mmdRuntime.register(scene);
                mmdRuntime.setAudioPlayer(audioPlayer);
                mmdRuntime.playAnimation();
                return [mmdRuntime, physicsRuntime];
            })(),
            // you need to get this file by yourself from https://www.nicovideo.jp/watch/sm41164308
            bvmdLoader.loadAsync("motion", "res/private_test/motion/melancholy_night/motion.bvmd",
                (event) => updateLoadingText(0, `Loading motion... ${event.loaded}/${event.total} (${Math.floor(event.loaded * 100 / event.total)}%)`)),
            // you need to get this file by yourself from https://www.deviantart.com/sanmuyyb/art/YYB-Hatsune-Miku-10th-DL-702119716
            // for this example, we use .bpmx file. but you can use .pmx or .pmd file with same way with side effect import statement at the top of this file.
            LoadAssetContainerAsync(
                "res/private_test/model/YYB Hatsune Miku_10th.bpmx",
                scene,
                {
                    onProgress: (event) => updateLoadingText(1, `Loading model... ${event.loaded}/${event.total} (${Math.floor(event.loaded * 100 / event.total)}%)`),
                    pluginOptions: {
                        mmdmodel: {
                            loggingEnabled: true,
                            materialBuilder: materialBuilder
                        }
                    }
                }
            ).then(result => {
                result.addAllToScene();
                return result.rootNodes[0] as MmdMesh;
            })
        ]);

        // hide loading screen
        scene.onAfterRenderObservable.addOnce(() => engine.hideLoadingUI());

        // create youtube like player control
        const mmdPlayerControl = new MmdPlayerControl(scene, mmdRuntime, audioPlayer);
        mmdPlayerControl.showPlayerControl();

        const cameraAnimationHandle = mmdCamera.createRuntimeAnimation(mmdAnimation);
        mmdCamera.setRuntimeAnimation(cameraAnimationHandle);
        mmdRuntime.addAnimatable(mmdCamera);

        {
            modelMesh.parent = mmdRoot;

            for (const mesh of modelMesh.metadata.meshes) mesh.receiveShadows = true;
            shadowGenerator.addShadowCaster(modelMesh);

            const mmdModel = mmdRuntime.createMmdModel(modelMesh);
            const modelAnimationHandle = mmdModel.createRuntimeAnimation(mmdAnimation);
            mmdModel.setRuntimeAnimation(modelAnimationHandle);

            // make sure directional light follow the model
            const bodyBone = mmdModel.runtimeBones.find((bone) => bone.name === "センター");
            const boneWorldMatrix = new Matrix();

            scene.onBeforeRenderObservable.add(() => {
                bodyBone!.getWorldMatrixToRef(boneWorldMatrix).multiplyToRef(modelMesh.getWorldMatrix(), boneWorldMatrix);
                boneWorldMatrix.getTranslationToRef(directionalLight.position);
                directionalLight.position.y -= 10;
            });
        }

        // optimize scene when all assets are loaded (unstable)
        scene.onAfterRenderObservable.addOnce(() => {
            scene.freezeMaterials();

            const meshes = scene.meshes;
            for (let i = 0, len = meshes.length; i < len; ++i) {
                const mesh = meshes[i];
                mesh.freezeWorldMatrix();
                mesh.doNotSyncBoundingInfo = true;
                mesh.isPickable = false;
                mesh.doNotSyncBoundingInfo = true;
                mesh.alwaysSelectAsActiveMesh = true;
            }

            scene.skipPointerMovePicking = true;
            scene.skipPointerDownPicking = true;
            scene.skipPointerUpPicking = true;
            scene.skipFrustumClipping = true;
            scene.blockMaterialDirtyMechanism = true;
        });

        const info = new RigidBodyConstructionInfo(physicsRuntime.wasmInstance);
        info.motionType = MotionType.Static;
        info.shape = new PhysicsStaticPlaneShape(physicsRuntime, new Vector3(0, 1, 0), 0);
        const groundBody = new RigidBody(physicsRuntime, info);
        physicsRuntime.addRigidBodyToGlobal(groundBody);

        const defaultPipeline = new DefaultRenderingPipeline("default", true, scene, [mmdCamera, camera]);
        defaultPipeline.samples = 4;
        defaultPipeline.bloomEnabled = false;
        defaultPipeline.chromaticAberrationEnabled = true;
        defaultPipeline.chromaticAberration.aberrationAmount = 1;
        defaultPipeline.fxaaEnabled = true;
        defaultPipeline.imageProcessingEnabled = false;

        // switch camera when double click
        let lastClickTime = -Infinity;
        canvas.onclick = (): void => {
            const currentTime = performance.now();
            if (500 < currentTime - lastClickTime) {
                lastClickTime = currentTime;
                return;
            }
            lastClickTime = -Infinity;

            scene.activeCamera = scene.activeCamera === mmdCamera ? camera : mmdCamera;
        };

        // if you want to use inspector, uncomment following line.
        // ShowInspector(scene);

        // webxr experience for AR
        const webXrExperience = await WebXRDefaultExperience.CreateAsync(scene, {
            disablePointerSelection: true,
            disableTeleportation: true,
            disableNearInteraction: true,
            disableHandTracking: true,
            uiOptions: {
                sessionMode: "immersive-ar",
                referenceSpaceType: "local-floor"
            }
        });
        if (webXrExperience.baseExperience !== undefined) {
            // post process seems not working on immersive-ar
            // webXrExperience.baseExperience.sessionManager.onXRFrameObservable.addOnce(() => {
            //     defaultPipeline.addCamera(webXrExperience.baseExperience.camera);
            // });
            webXrExperience.baseExperience.sessionManager.worldScalingFactor = 15;
        }

        return scene;
    }
}
