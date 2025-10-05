export interface Vec3 {
    x: number;
    y: number;
    z: number;
}

export interface Color {
    r: number;
    g: number;
    b: number;
}

export interface Material {
    color: Color;
    reflectivity: number;
    shininess: number;
}

export interface Sphere {
    type: "sphere";
    center: Vec3;
    radius: number;
    material: Material;
}

export interface Plane {
    type: "plane";
    point: Vec3;
    normal: Vec3;
    material: Material;
}

export interface Triangle {
    type: "triangle";
    v0: Vec3;
    v1: Vec3;
    v2: Vec3;
    material: Material;
}

export interface Box {
    type: "box";
    min: Vec3;
    max: Vec3;
    material: Material;
}

export type SceneObject = Sphere | Plane | Triangle | Box;

export interface Light {
    position: Vec3;
    color: Color;
    intensity: number;
}

export interface Camera {
    position: Vec3;
    target: Vec3;
    fov: number;
}

export interface Scene {
    camera: Camera;
    lights: Light[];
    objects: SceneObject[];
    backgroundColor: Color;
}

export interface Ray {
    origin: Vec3;
    direction: Vec3;
}

export interface HitInfo {
    hit: boolean;
    distance: number;
    point: Vec3;
    normal: Vec3;
    material: Material;
}
