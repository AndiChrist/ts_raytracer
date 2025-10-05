// ============= TYPES =============
interface Vec3 {
    x: number;
    y: number;
    z: number;
}

interface Color {
    r: number;
    g: number;
    b: number;
}

interface Material {
    color: Color;
    reflectivity: number;
    shininess: number;
}

interface Sphere {
    type: "sphere";
    center: Vec3;
    radius: number;
    material: Material;
}

interface Plane {
    type: "plane";
    point: Vec3;
    normal: Vec3;
    material: Material;
}

type SceneObject = Sphere | Plane;

interface Light {
    position: Vec3;
    color: Color;
    intensity: number;
}

interface Camera {
    position: Vec3;
    target: Vec3;
    fov: number;
}

interface Scene {
    camera: Camera;
    lights: Light[];
    objects: SceneObject[];
    backgroundColor: Color;
}

interface Ray {
    origin: Vec3;
    direction: Vec3;
}

interface HitInfo {
    hit: boolean;
    distance: number;
    point: Vec3;
    normal: Vec3;
    material: Material;
}

// ============= VECTOR3 CLASS =============
class Vector3 {
    constructor(public x: number, public y: number, public z: number) {}

    static fromVec3(v: Vec3): Vector3 {
        return new Vector3(v.x, v.y, v.z);
    }

    add(other: Vector3): Vector3 {
        return new Vector3(this.x + other.x, this.y + other.y, this.z + other.z);
    }

    subtract(other: Vector3): Vector3 {
        return new Vector3(this.x - other.x, this.y - other.y, this.z - other.z);
    }

    multiply(scalar: number): Vector3 {
        return new Vector3(this.x * scalar, this.y * scalar, this.z * scalar);
    }

    dot(other: Vector3): number {
        return this.x * other.x + this.y * other.y + this.z * other.z;
    }

    cross(other: Vector3): Vector3 {
        return new Vector3(
            this.y * other.z - this.z * other.y,
            this.z * other.x - this.x * other.z,
            this.x * other.y - this.y * other.x
        );
    }

    length(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    }

    normalize(): Vector3 {
        const length = this.length();
        if (length === 0) return new Vector3(0, 0, 0);
        return new Vector3(this.x / length, this.y / length, this.z / length);
    }

    reflect(normal: Vector3): Vector3 {
        return this.subtract(normal.multiply(2 * this.dot(normal)));
    }

    toVec3(): Vec3 {
        return { x: this.x, y: this.y, z: this.z };
    }
}

// ============= RAYTRACER CLASS =============
class Raytracer {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private scene!: Scene;
    private width: number;
    private height: number;
    private maxDepth: number = 5;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not get 2D context');
        this.ctx = ctx;
        this.width = canvas.width;
        this.height = canvas.height;
    }

    loadScene(sceneData: Scene | string): void {
        if (typeof sceneData === 'string') {
            this.scene = JSON.parse(sceneData);
        } else {
            this.scene = sceneData;
        }
        console.log('Scene loaded:', this.scene);
    }

    async loadSceneFromFile(jsonPath: string): Promise<void> {
        try {
            const response = await fetch(jsonPath);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.scene = await response.json();
            console.log('Scene loaded from file:', jsonPath);
        } catch (error) {
            console.error('Error loading scene:', error);
            throw error;
        }
    }

    setMaxDepth(depth: number): void {
        this.maxDepth = depth;
    }

    async render(progressCallback?: (progress: number) => void): Promise<void> {
        if (!this.scene) {
            throw new Error('No scene loaded');
        }

        const imageData = this.ctx.createImageData(this.width, this.height);

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const ray = this.getRay(x, y);
                const color = this.traceRay(ray, this.maxDepth);

                const index = (y * this.width + x) * 4;
                imageData.data[index] = Math.min(255, Math.max(0, color.r * 255));
                imageData.data[index + 1] = Math.min(255, Math.max(0, color.g * 255));
                imageData.data[index + 2] = Math.min(255, Math.max(0, color.b * 255));
                imageData.data[index + 3] = 255;
            }

            if (progressCallback && y % 10 === 0) {
                const progress = (y / this.height) * 100;
                progressCallback(progress);

                if (y % 50 === 0) {
                    await new Promise(resolve => setTimeout(resolve, 1));
                }
            }
        }

        this.ctx.putImageData(imageData, 0, 0);
        if (progressCallback) progressCallback(100);
    }

    private getRay(x: number, y: number): Ray {
        const aspectRatio = this.width / this.height;
        const fovRadians = (this.scene.camera.fov * Math.PI) / 180;

        const ndcX = (x + 0.5) / this.width;
        const ndcY = (y + 0.5) / this.height;

        const screenX = 2 * ndcX - 1;
        const screenY = 1 - 2 * ndcY;

        const cameraX = screenX * aspectRatio * Math.tan(fovRadians / 2);
        const cameraY = screenY * Math.tan(fovRadians / 2);

        const cameraPos = Vector3.fromVec3(this.scene.camera.position);
        const target = Vector3.fromVec3(this.scene.camera.target);

        const forward = target.subtract(cameraPos).normalize();
        const right = forward.cross(new Vector3(0, 1, 0)).normalize();
        const up = right.cross(forward).normalize();

        const rayDirection = forward
            .add(right.multiply(cameraX))
            .add(up.multiply(cameraY))
            .normalize();

        return {
            origin: this.scene.camera.position,
            direction: rayDirection.toVec3()
        };
    }

    private traceRay(ray: Ray, depth: number): Color {
        if (depth <= 0) return { r: 0, g: 0, b: 0 };

        const hit = this.findClosestIntersection(ray);

        if (!hit.hit) {
            return this.scene.backgroundColor;
        }

        let color = { r: 0, g: 0, b: 0 };

        for (const light of this.scene.lights) {
            const lightColor = this.calculateLighting(hit, light, ray);
            color.r += lightColor.r;
            color.g += lightColor.g;
            color.b += lightColor.b;
        }

        if (hit.material.reflectivity > 0 && depth > 1) {
            const rayDir = Vector3.fromVec3(ray.direction);
            const normal = Vector3.fromVec3(hit.normal);
            const reflected = rayDir.reflect(normal).normalize();

            const reflectionRay: Ray = {
                origin: hit.point,
                direction: reflected.toVec3()
            };

            const reflectedColor = this.traceRay(reflectionRay, depth - 1);
            const reflectivity = hit.material.reflectivity;

            color.r = color.r * (1 - reflectivity) + reflectedColor.r * reflectivity;
            color.g = color.g * (1 - reflectivity) + reflectedColor.g * reflectivity;
            color.b = color.b * (1 - reflectivity) + reflectedColor.b * reflectivity;
        }

        return color;
    }

    private findClosestIntersection(ray: Ray): HitInfo {
        let closestHit: HitInfo = {
            hit: false,
            distance: Infinity,
            point: { x: 0, y: 0, z: 0 },
            normal: { x: 0, y: 0, z: 0 },
            material: { color: { r: 0, g: 0, b: 0 }, reflectivity: 0, shininess: 0 }
        };

        for (const obj of this.scene.objects) {
            const hit = this.intersectObject(ray, obj);
            if (hit.hit && hit.distance < closestHit.distance) {
                closestHit = hit;
            }
        }

        return closestHit;
    }

    private intersectObject(ray: Ray, obj: SceneObject): HitInfo {
        switch (obj.type) {
            case 'sphere':
                return this.intersectSphere(ray, obj);
            case 'plane':
                return this.intersectPlane(ray, obj);
            default:
                return {
                    hit: false,
                    distance: Infinity,
                    point: { x: 0, y: 0, z: 0 },
                    normal: { x: 0, y: 0, z: 0 },
                    material: { color: { r: 0, g: 0, b: 0 }, reflectivity: 0, shininess: 0 }
                };
        }
    }

    private intersectSphere(ray: Ray, sphere: Sphere): HitInfo {
        const rayOrigin = Vector3.fromVec3(ray.origin);
        const rayDir = Vector3.fromVec3(ray.direction);
        const center = Vector3.fromVec3(sphere.center);

        const oc = rayOrigin.subtract(center);
        const a = rayDir.dot(rayDir);
        const b = 2 * oc.dot(rayDir);
        const c = oc.dot(oc) - sphere.radius * sphere.radius;

        const discriminant = b * b - 4 * a * c;

        if (discriminant < 0) {
            return {
                hit: false,
                distance: Infinity,
                point: { x: 0, y: 0, z: 0 },
                normal: { x: 0, y: 0, z: 0 },
                material: sphere.material
            };
        }

        const t1 = (-b - Math.sqrt(discriminant)) / (2 * a);
        const t2 = (-b + Math.sqrt(discriminant)) / (2 * a);

        const t = t1 > 0.001 ? t1 : (t2 > 0.001 ? t2 : -1);

        if (t < 0.001) {
            return {
                hit: false,
                distance: Infinity,
                point: { x: 0, y: 0, z: 0 },
                normal: { x: 0, y: 0, z: 0 },
                material: sphere.material
            };
        }

        const hitPoint = rayOrigin.add(rayDir.multiply(t));
        const normal = hitPoint.subtract(center).normalize();

        return {
            hit: true,
            distance: t,
            point: hitPoint.toVec3(),
            normal: normal.toVec3(),
            material: sphere.material
        };
    }

    private intersectPlane(ray: Ray, plane: Plane): HitInfo {
        const rayDir = Vector3.fromVec3(ray.direction);
        const normal = Vector3.fromVec3(plane.normal).normalize();

        const denom = normal.dot(rayDir);
        if (Math.abs(denom) < 0.0001) {
            return {
                hit: false,
                distance: Infinity,
                point: { x: 0, y: 0, z: 0 },
                normal: { x: 0, y: 0, z: 0 },
                material: plane.material
            };
        }

        const rayOrigin = Vector3.fromVec3(ray.origin);
        const planePoint = Vector3.fromVec3(plane.point);
        const t = planePoint.subtract(rayOrigin).dot(normal) / denom;

        if (t < 0.001) {
            return {
                hit: false,
                distance: Infinity,
                point: { x: 0, y: 0, z: 0 },
                normal: { x: 0, y: 0, z: 0 },
                material: plane.material
            };
        }

        const hitPoint = rayOrigin.add(rayDir.multiply(t));

        return {
            hit: true,
            distance: t,
            point: hitPoint.toVec3(),
            normal: normal.toVec3(),
            material: plane.material
        };
    }

    private calculateLighting(hit: HitInfo, light: Light, ray: Ray): Color {
        const hitPoint = Vector3.fromVec3(hit.point);
        const lightPos = Vector3.fromVec3(light.position);
        const normal = Vector3.fromVec3(hit.normal);

        const lightDir = lightPos.subtract(hitPoint).normalize();
        const distance = lightPos.subtract(hitPoint).length();

        const shadowOffset = normal.multiply(0.001);
        const shadowRay: Ray = {
            origin: hitPoint.add(shadowOffset).toVec3(),
            direction: lightDir.toVec3()
        };

        const shadowHit = this.findClosestIntersection(shadowRay);
        if (shadowHit.hit && shadowHit.distance < distance) {
            return { r: 0, g: 0, b: 0 };
        }

        const diffuse = Math.max(0, normal.dot(lightDir));
        const attenuation = 1 / (1 + 0.1 * distance + 0.01 * distance * distance);

        const viewDir = Vector3.fromVec3(ray.direction).multiply(-1).normalize();
        const reflectDir = lightDir.multiply(-1).reflect(normal).normalize();
        const specular = Math.pow(Math.max(0, viewDir.dot(reflectDir)), hit.material.shininess);

        const intensity = light.intensity * attenuation;

        return {
            r: (hit.material.color.r * diffuse + specular) * light.color.r * intensity,
            g: (hit.material.color.g * diffuse + specular) * light.color.g * intensity,
            b: (hit.material.color.b * diffuse + specular) * light.color.b * intensity
        };
    }
}

// ============= DEFAULT SCENE =============
function getDefaultScene(): Scene {
    return {
        camera: {
            position: { x: 0, y: 1, z: 5 },
            target: { x: 0, y: 0, z: 0 },
            fov: 60
        },
        lights: [
            {
                position: { x: 5, y: 5, z: 5 },
                color: { r: 1, g: 1, b: 1 },
                intensity: 1
            }
        ],
        objects: [
            {
                type: "sphere",
                center: { x: 0, y: 0, z: 0 },
                radius: 1,
                material: {
                    color: { r: 1, g: 0.2, b: 0.2 },
                    reflectivity: 0.3,
                    shininess: 32
                }
            },
            {
                type: "sphere",
                center: { x: -2, y: 0, z: -1 },
                radius: 0.8,
                material: {
                    color: { r: 0.2, g: 1, b: 0.2 },
                    reflectivity: 0.5,
                    shininess: 64
                }
            },
            {
                type: "plane",
                point: { x: 0, y: -1.5, z: 0 },
                normal: { x: 0, y: 1, z: 0 },
                material: {
                    color: { r: 0.8, g: 0.8, b: 0.8 },
                    reflectivity: 0.1,
                    shininess: 8
                }
            }
        ],
        backgroundColor: { r: 0.1, g: 0.1, b: 0.2 }
    };
}

// ============= APPLICATION =============
class RaytracerApp {
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

// ============= INITIALIZATION =============
let app: RaytracerApp;

console.log('🚀 Main.ts wird ausgeführt...');

window.addEventListener('DOMContentLoaded', () => {
    console.log('✅ DOM loaded, initializing...');

    try {
        console.log('🔧 Creating RaytracerApp...');
        app = new RaytracerApp('raytracer-canvas');
        console.log('✅ RaytracerApp created');

        // Globale Verfügbarkeit
        (window as any).raytracerApp = app;
        (window as any).getDefaultScene = getDefaultScene;
        console.log('✅ Global variables set');

        // Default scene laden
        console.log('📄 Loading default scene...');
        app.loadScene(JSON.stringify(getDefaultScene()))
            .then(() => {
                console.log('✅ Default scene loaded successfully');
                const sceneEditor = document.getElementById('scene-editor') as HTMLTextAreaElement;
                if (sceneEditor) {
                    sceneEditor.value = JSON.stringify(getDefaultScene(), null, 2);
                    console.log('✅ Scene editor populated');
                } else {
                    console.warn('⚠️ Scene editor not found');
                }
            })
            .catch(error => {
                console.error('❌ Error loading default scene:', error);
            });

        console.log('🎉 App initialized successfully!');
    } catch (error) {
        console.error('❌ CRITICAL ERROR initializing app:', error);
        // Zeige Fehler im UI
        const status = document.getElementById('status');
        if (status) {
            status.textContent = '❌ Fehler: ' + (error as Error).message;
            status.style.background = '#f44336';
            status.style.color = 'white';
        }
    }
});

export { RaytracerApp, Raytracer, getDefaultScene };