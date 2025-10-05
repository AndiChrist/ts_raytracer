import type { Scene, Ray, HitInfo, Color, SceneObject, Sphere, Plane, Triangle, Box, Light } from '../types/scene.types';

class Vector3 {
    constructor(public x: number, public y: number, public z: number) {}

    static fromVec3(v: { x: number; y: number; z: number }): Vector3 {
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

    toVec3(): { x: number; y: number; z: number } {
        return { x: this.x, y: this.y, z: this.z };
    }
}

interface WorkerMessage {
    scene: Scene;
    width: number;
    height: number;
    startRow: number;
    endRow: number;
    maxDepth: number;
}

interface WorkerResponse {
    startRow: number;
    endRow: number;
    pixels: Uint8ClampedArray;
}

class WorkerRaytracer {
    private scene!: Scene;
    private width!: number;
    private height!: number;
    private maxDepth!: number;

    render(data: WorkerMessage): WorkerResponse {
        this.scene = data.scene;
        this.width = data.width;
        this.height = data.height;
        this.maxDepth = data.maxDepth;

        const rowCount = data.endRow - data.startRow;
        const pixels = new Uint8ClampedArray(rowCount * this.width * 4);

        for (let y = data.startRow; y < data.endRow; y++) {
            for (let x = 0; x < this.width; x++) {
                const ray = this.getRay(x, y);
                const color = this.traceRay(ray, this.maxDepth);

                const localY = y - data.startRow;
                const index = (localY * this.width + x) * 4;
                pixels[index] = Math.min(255, Math.max(0, color.r * 255));
                pixels[index + 1] = Math.min(255, Math.max(0, color.g * 255));
                pixels[index + 2] = Math.min(255, Math.max(0, color.b * 255));
                pixels[index + 3] = 255;
            }
        }

        return {
            startRow: data.startRow,
            endRow: data.endRow,
            pixels
        };
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
            case 'triangle':
                return this.intersectTriangle(ray, obj);
            case 'box':
                return this.intersectBox(ray, obj);
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

    private intersectTriangle(ray: Ray, triangle: Triangle): HitInfo {
        const rayOrigin = Vector3.fromVec3(ray.origin);
        const rayDir = Vector3.fromVec3(ray.direction);
        const v0 = Vector3.fromVec3(triangle.v0);
        const v1 = Vector3.fromVec3(triangle.v1);
        const v2 = Vector3.fromVec3(triangle.v2);

        const edge1 = v1.subtract(v0);
        const edge2 = v2.subtract(v0);
        const h = rayDir.cross(edge2);
        const a = edge1.dot(h);

        if (Math.abs(a) < 0.0001) {
            return {
                hit: false,
                distance: Infinity,
                point: { x: 0, y: 0, z: 0 },
                normal: { x: 0, y: 0, z: 0 },
                material: triangle.material
            };
        }

        const f = 1.0 / a;
        const s = rayOrigin.subtract(v0);
        const u = f * s.dot(h);

        if (u < 0.0 || u > 1.0) {
            return {
                hit: false,
                distance: Infinity,
                point: { x: 0, y: 0, z: 0 },
                normal: { x: 0, y: 0, z: 0 },
                material: triangle.material
            };
        }

        const q = s.cross(edge1);
        const v = f * rayDir.dot(q);

        if (v < 0.0 || u + v > 1.0) {
            return {
                hit: false,
                distance: Infinity,
                point: { x: 0, y: 0, z: 0 },
                normal: { x: 0, y: 0, z: 0 },
                material: triangle.material
            };
        }

        const t = f * edge2.dot(q);

        if (t < 0.001) {
            return {
                hit: false,
                distance: Infinity,
                point: { x: 0, y: 0, z: 0 },
                normal: { x: 0, y: 0, z: 0 },
                material: triangle.material
            };
        }

        const hitPoint = rayOrigin.add(rayDir.multiply(t));
        const normal = edge1.cross(edge2).normalize();

        return {
            hit: true,
            distance: t,
            point: hitPoint.toVec3(),
            normal: normal.toVec3(),
            material: triangle.material
        };
    }

    private intersectBox(ray: Ray, box: Box): HitInfo {
        const rayOrigin = Vector3.fromVec3(ray.origin);
        const rayDir = Vector3.fromVec3(ray.direction);
        const min = Vector3.fromVec3(box.min);
        const max = Vector3.fromVec3(box.max);

        const invDirX = 1.0 / rayDir.x;
        const invDirY = 1.0 / rayDir.y;
        const invDirZ = 1.0 / rayDir.z;

        const t1 = (min.x - rayOrigin.x) * invDirX;
        const t2 = (max.x - rayOrigin.x) * invDirX;
        const t3 = (min.y - rayOrigin.y) * invDirY;
        const t4 = (max.y - rayOrigin.y) * invDirY;
        const t5 = (min.z - rayOrigin.z) * invDirZ;
        const t6 = (max.z - rayOrigin.z) * invDirZ;

        const tmin = Math.max(Math.max(Math.min(t1, t2), Math.min(t3, t4)), Math.min(t5, t6));
        const tmax = Math.min(Math.min(Math.max(t1, t2), Math.max(t3, t4)), Math.max(t5, t6));

        if (tmax < 0 || tmin > tmax || tmin < 0.001) {
            return {
                hit: false,
                distance: Infinity,
                point: { x: 0, y: 0, z: 0 },
                normal: { x: 0, y: 0, z: 0 },
                material: box.material
            };
        }

        const t = tmin;
        const hitPoint = rayOrigin.add(rayDir.multiply(t));

        const center = min.add(max).multiply(0.5);
        const p = hitPoint.subtract(center);
        const d = min.subtract(center).multiply(0.5);
        const bias = 1.0001;

        let normal = new Vector3(0, 0, 0);
        if (Math.abs(p.x / d.x) > bias) normal = new Vector3(Math.sign(p.x), 0, 0);
        else if (Math.abs(p.y / d.y) > bias) normal = new Vector3(0, Math.sign(p.y), 0);
        else if (Math.abs(p.z / d.z) > bias) normal = new Vector3(0, 0, Math.sign(p.z));
        else normal = new Vector3(Math.sign(p.x), 0, 0);

        return {
            hit: true,
            distance: t,
            point: hitPoint.toVec3(),
            normal: normal.toVec3(),
            material: box.material
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

const workerRaytracer = new WorkerRaytracer();

self.onmessage = (e: MessageEvent<WorkerMessage>) => {
    const result = workerRaytracer.render(e.data);
    self.postMessage(result);
};
