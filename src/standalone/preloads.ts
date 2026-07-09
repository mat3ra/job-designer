import moment from "moment";
import JSONSchemasInterface from "@mat3ra/esse/dist/js/esse/JSONSchemasInterface";
import esseSchemas from "@mat3ra/esse/dist/js/schemas.json";
import { ApplicationRegistry } from "@mat3ra/standata";
import { ApplicationDriver } from "@mat3ra/standata/dist/js/ApplicationDriver";
import { math } from "@mat3ra/code/dist/js/math";
import { sharedUtils } from "@mat3ra/utils";

// Bootstrap — must run before any component renders
JSONSchemasInterface.setSchemas(esseSchemas as any);
ApplicationRegistry.setDriver(new ApplicationDriver());

(window as any).moment = moment;

/**
 * Compatibility patch: wave.js bonds.js calls sharedUtils.math.max / sharedUtils.math.vDist,
 * but the current @mat3ra/utils only exposes { math: { numberToPrecision, default } }.
 * The full mathjs instance is available from @mat3ra/code — we merge it in here.
 */
if (sharedUtils?.math && typeof (sharedUtils.math as any).max !== "function") {
    const mathFull = math as any;
    // Add standard mathjs functions that wave.js bonds.js relies on
    (sharedUtils.math as any).max = (...args: any[]) => mathFull.max(...args);
    (sharedUtils.math as any).min = (...args: any[]) => mathFull.min(...args);
    // vDist: Euclidean distance between two coordinate arrays
    (sharedUtils.math as any).vDist = (a: number[], b: number[]) => {
        const sum = a.reduce((acc, ai, i) => acc + (ai - b[i]) ** 2, 0);
        return Math.sqrt(sum);
    };
    // vLen: vector length
    (sharedUtils.math as any).vLen = (v: number[]) =>
        Math.sqrt(v.reduce((acc, vi) => acc + vi ** 2, 0));
}
