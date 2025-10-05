import { Raytracer } from '../core/Raytracer';

export class RaytracerApp {
    private raytracer: Raytracer;

    constructor(canvasId: string) {
        const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        if (!canvas) {
            throw new Error(`Canvas with id '${canvasId}' not found`);
        }

        this.raytracer = new Raytracer(canvas);
        console.log('RaytracerApp initialized');
    }

    async loadScene(sceneSource: string): Promise<void> {
        try {
            if (sceneSource.trim().startsWith('{')) {
                this.raytracer.loadScene(sceneSource);
            } else {
                await this.raytracer.loadSceneFromFile(sceneSource);
            }
            console.log('Scene loaded successfully');
        } catch (error) {
            console.error('Error loading scene:', error);
            throw error;
        }
    }

    async render(onProgress?: (progress: number) => void): Promise<void> {
        try {
            console.log('Starting render...');
            await this.raytracer.render(onProgress);
            console.log('Render complete');
        } catch (error) {
            console.error('Error during rendering:', error);
            throw error;
        }
    }

    setMaxDepth(depth: number): void {
        this.raytracer.setMaxDepth(depth);
    }
}
