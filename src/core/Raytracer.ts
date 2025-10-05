import type { Scene, Ray, HitInfo, Color, SceneObject, Sphere, Plane, Light } from '../types/scene.types';
import { Vector3 } from '../math/Vector3';

export class Raytracer {
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
