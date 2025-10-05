import type { Vec3 } from '../types/scene.types';

export class Vector3 {
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
