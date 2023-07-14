import type { Engine,
    Mesh} from "@babylonjs/core";
import {
    Color3,
    Color4,
    DefaultRenderingPipeline,
    DirectionalLight,
    HavokPlugin,
    HemisphericLight,
    ImageProcessingConfiguration,
    MeshBuilder,
    PhysicsBody,
    PhysicsMotionType,
    PhysicsShapeBox,
    Quaternion,
    Scene,
    SceneLoader,
    ShadowGenerator,
    SkeletonViewer,
    UniversalCamera,
    Vector3
} from "@babylonjs/core";
import HavokPhysics from "@babylonjs/havok";
import type { MmdAnimation } from "babylon-mmd";
import { BpmxLoader, BvmdLoader, MmdCamera, MmdPhysics, MmdRuntime, SdefInjector, StreamAudioPlayer } from "babylon-mmd";

// import { Inspector } from "@babylonjs/inspector";
import type { ISceneBuilder } from "./BaseRuntime";

export class SceneBuilder implements ISceneBuilder {
    public async build(canvas: HTMLCanvasElement, engine: Engine): Promise<Scene> {
        SdefInjector.OverrideEngineCreateEffect(engine);
        const pmxLoader = new BpmxLoader();
        pmxLoader.loggingEnabled = true;
        // materialBuilder.loadDiffuseTexture = (): void => { /* do nothing */ };
        // materialBuilder.loadSphereTexture = (): void => { /* do nothing */ };
        // materialBuilder.loadToonTexture = (): void => { /* do nothing */ };
        // materialBuilder.loadOutlineRenderingProperties = (): void => { /* do nothing */ };
        SceneLoader.RegisterPlugin(pmxLoader);

        const scene = new Scene(engine);
        scene.clearColor = new Color4(1, 1, 1, 1.0);

        const mmdCamera = new MmdCamera("mmdCamera", new Vector3(0, 10, 0), scene);
        mmdCamera.maxZ = 5000;

        const camera = new UniversalCamera("camera1", new Vector3(0, 15, -40), scene);
        camera.maxZ = 5000;
        camera.setTarget(new Vector3(0, 10, 0));
        camera.attachControl(canvas, false);
        camera.keysUp.push("W".charCodeAt(0));
        camera.keysDown.push("S".charCodeAt(0));
        camera.keysLeft.push("A".charCodeAt(0));
        camera.keysRight.push("D".charCodeAt(0));
        camera.inertia = 0;
        camera.angularSensibility = 500;
        camera.speed = 10;

        const hemisphericLight = new HemisphericLight("HemisphericLight", new Vector3(0, 1, 0), scene);
        hemisphericLight.intensity = 0.5;
        hemisphericLight.specular = new Color3(0, 0, 0);
        hemisphericLight.groundColor = new Color3(1, 1, 1);

        const directionalLight = new DirectionalLight("DirectionalLight", new Vector3(0.5, -1, 1), scene);
        directionalLight.intensity = 0.8;
        directionalLight.autoCalcShadowZBounds = false;
        directionalLight.autoUpdateExtends = false;
        directionalLight.shadowMaxZ = 20;
        directionalLight.shadowMinZ = -15;
        directionalLight.orthoTop = 18;
        directionalLight.orthoBottom = -1;
        directionalLight.orthoLeft = -10;
        directionalLight.orthoRight = 10;
        directionalLight.shadowOrthoScale = 0;

        const shadowGenerator = new ShadowGenerator(1024, directionalLight, true, mmdCamera);
        shadowGenerator.usePercentageCloserFiltering = true;
        shadowGenerator.forceBackFacesOnly = true;
        shadowGenerator.filteringQuality = ShadowGenerator.QUALITY_MEDIUM;
        shadowGenerator.frustumEdgeFalloff = 0.1;

        const ground = MeshBuilder.CreateGround("ground1", { width: 100, height: 100, subdivisions: 2, updatable: false }, scene);
        ground.setEnabled(true);

        const mmdRuntime = new MmdRuntime(new MmdPhysics(scene));
        mmdRuntime.loggingEnabled = true;

        const audioPlayer = new StreamAudioPlayer();
        audioPlayer.source = "res/private_test/motion/melancholy_night/melancholy_night.mp3";
        mmdRuntime.setAudioPlayer(audioPlayer);
        canvas.addEventListener("click", () => {
            audioPlayer.unmute();
        });

        mmdRuntime.playAnimation();

        engine.displayLoadingUI();

        const loadingTexts: string[] = new Array(4).fill("");
        const updateLoadingText = (updateIndex: number, text: string): void => {
            loadingTexts[updateIndex] = text;
            engine.loadingUIText = "<br/><br/><br/><br/>" + loadingTexts.join("<br/><br/>");
        };

        const promises: Promise<any>[] = [];

        const bvmdLoader = new BvmdLoader(scene);
        bvmdLoader.loggingEnabled = true;

        promises.push(bvmdLoader.loadAsync("motion", "res/private_test/motion/melancholy_night/motion.bvmd",
            (event) => updateLoadingText(0, `Loading motion... ${event.loaded}/${event.total} (${Math.floor(event.loaded * 100 / event.total)}%)`))
        );

        promises.push(SceneLoader.ImportMeshAsync(
            undefined,
            "res/private_test/model/YYB Hatsune Miku_10th.bpmx",
            undefined,
            scene,
            (event) => updateLoadingText(1, `Loading model... ${event.loaded}/${event.total} (${Math.floor(event.loaded * 100 / event.total)}%)`)
        ));

        promises.push((async(): Promise<void> => {
            updateLoadingText(2, "Loading physics engine...");
            const havokInstance = await HavokPhysics();
            const havokPlugin = new HavokPlugin(true, havokInstance);
            scene.enablePhysics(new Vector3(0, -9.8, 0), havokPlugin);
            updateLoadingText(2, "Loading physics engine... Done");
        })());

        const loadResults = await Promise.all(promises);

        setTimeout(() => engine.hideLoadingUI(), 0);

        scene.meshes.forEach((mesh) => {
            if (mesh.name === "skyBox") return;
            mesh.receiveShadows = true;
            shadowGenerator.addShadowCaster(mesh);
        });

        mmdRuntime.setCamera(mmdCamera);
        mmdCamera.addAnimation(loadResults[0] as MmdAnimation);
        mmdCamera.setAnimation("motion");

        {
            const modelMesh = loadResults[1].meshes[0] as Mesh;

            const mmdModel = mmdRuntime.createMmdModel(modelMesh);
            mmdModel.addAnimation(loadResults[0] as MmdAnimation);
            mmdModel.setAnimation("motion");

            const bodyBone = modelMesh.skeleton!.bones.find((bone) => bone.name === "センター");

            scene.onBeforeRenderObservable.add(() => {
                bodyBone!.getFinalMatrix()!.getTranslationToRef(directionalLight.position);
                directionalLight.position.y -= 10;
            });

            const viewer = new SkeletonViewer(modelMesh.skeleton!, modelMesh, scene, false, 3, {
                displayMode: SkeletonViewer.DISPLAY_SPHERE_AND_SPURS
            });
            viewer.isEnabled = false;
        }

        mmdRuntime.register(scene);

        const groundRigidBody = new PhysicsBody(ground, PhysicsMotionType.STATIC, true, scene);
        groundRigidBody.shape = new PhysicsShapeBox(
            new Vector3(0, -1, 0),
            new Quaternion(),
            new Vector3(100, 2, 100), scene);

        const useBasicPostProcess = true;

        if (useBasicPostProcess) {
            const defaultPipeline = new DefaultRenderingPipeline("default", true, scene, [mmdCamera]);
            defaultPipeline.samples = 4;
            defaultPipeline.bloomEnabled = false;
            defaultPipeline.chromaticAberrationEnabled = false;
            defaultPipeline.chromaticAberration.aberrationAmount = 1;
            defaultPipeline.depthOfFieldEnabled = false;
            defaultPipeline.fxaaEnabled = true;
            defaultPipeline.imageProcessingEnabled = false;
            defaultPipeline.imageProcessing.toneMappingEnabled = true;
            defaultPipeline.imageProcessing.toneMappingType = ImageProcessingConfiguration.TONEMAPPING_ACES;
            defaultPipeline.imageProcessing.vignetteWeight = 0.5;
            defaultPipeline.imageProcessing.vignetteStretch = 0.5;
            defaultPipeline.imageProcessing.vignetteColor = new Color4(0, 0, 0, 0);
            defaultPipeline.imageProcessing.vignetteEnabled = true;
        }

        // Inspector.Show(scene, { });

        return scene;
    }
}
