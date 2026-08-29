import JSONSchemasInterface from "@mat3ra/esse/dist/js/esse/JSONSchemasInterface";
import esseSchemas from "@mat3ra/esse/dist/js/schemas.json";
import type { JSONSchema } from "@mat3ra/esse/dist/js/esse/utils";
import { ApplicationRegistry } from "@mat3ra/standata";
import StandataDriver from "@mat3ra/standata/dist/js/StandataDriver";
import moment from "moment";

// Bootstrap — must run before any component renders
//
// `esseSchemas` is a JSON import: `resolveJsonModule` infers its string-literal fields (e.g.
// `type: "object"`) as plain `string`, which can never structurally satisfy JSONSchema7's
// `JSONSchema7TypeName` union - there is no way to write literal types in JSON. The cast to the
// exact expected element type (not `any`) is the narrowest fix; the same pattern is used by
// workflow-designer's own standalone bootstrap for the identical call.
JSONSchemasInterface.setSchemas(esseSchemas as JSONSchema[]);
ApplicationRegistry.setDriver(new StandataDriver());

declare global {
    interface Window {
        /**
         * Mirrors the same bootstrap line in workflow-designer's standalone demo. No current
         * consumer was found by searching wave.js/jove/workflow-designer's source for
         * `window.moment` - left in place unchanged (removing a global some transitive dependency
         * might read is not a type-safety change), just no longer typed away with `any`.
         */
        moment: typeof moment;
    }
}
window.moment = moment;
