import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

import { getJobReadiness } from "../src/jobReadiness";
import { getMessage, MESSAGES, type TranslateFunction } from "../src/messages";
import { setDependencies } from "../src/setDependencies";

/** Restores English between tests; the resolver is module-level state. */
const clearTranslator = () => setDependencies({ translate: undefined });

afterEach(clearTranslator);

describe("getMessage — English fallback", () => {
    it("returns the English default when no host resolver is injected", () => {
        assert.equal(getMessage("readiness.review.ready"), "Ready to submit");
    });

    it("interpolates named parameters", () => {
        assert.equal(
            getMessage("readiness.material.batch", { count: 3 }),
            "3 materials — runs 3 times",
        );
    });

    it("fills a parameter used more than once in the sentence", () => {
        // Languages place the count differently; the message stays one string so a
        // translation can move both occurrences.
        assert.match(getMessage("preflight.inputs.batch", { count: 4 }), /4 materials.*4 times/);
    });

    it("leaves an unfilled placeholder visible rather than blanking it", () => {
        assert.equal(getMessage("readiness.material.fromParent"), "From parent job {name}");
    });
});

describe("getMessage — host resolver", () => {
    it("prefers the host's translation", () => {
        setDependencies({ translate: ((key) => `«${key}»`) as TranslateFunction });
        assert.equal(getMessage("readiness.review.ready"), "«readiness.review.ready»");
    });

    it("interpolates into the host's translation too", () => {
        setDependencies({
            translate: ((key) =>
                key === "readiness.material.batch"
                    ? "{count} Materialien"
                    : undefined) as TranslateFunction,
        });
        assert.equal(getMessage("readiness.material.batch", { count: 2 }), "2 Materialien");
    });

    it("falls back per key, not per host", () => {
        // A partial translation is the normal case; the keys it lacks must still
        // read as sentences.
        setDependencies({
            translate: ((key) =>
                key === "readiness.review.ready" ? "Bereit" : undefined) as TranslateFunction,
        });
        assert.equal(getMessage("readiness.review.ready"), "Bereit");
        assert.equal(getMessage("readiness.review.viewOnly"), "View only");
    });

    it("never shows a key when a translation is empty", () => {
        setDependencies({ translate: (() => "") as TranslateFunction });
        assert.equal(getMessage("preflight.allPassed"), "All checks passed");
    });

    it("survives a resolver that throws", () => {
        // A broken host translator must not take the designer's copy with it.
        setDependencies({
            translate: (() => {
                throw new Error("i18n not initialised");
            }) as TranslateFunction,
        });
        assert.equal(getMessage("preflight.allPassed"), "All checks passed");
    });
});

describe("the catalogue is what the designer actually says", () => {
    it("routes readiness summaries through it", () => {
        setDependencies({ translate: ((key) => `«${key}»`) as TranslateFunction });
        const readiness = getJobReadiness({
            job: { isInInitialStatus: true, workflow: { subworkflows: [] }, compute: null },
            materials: [],
        });
        assert.deepEqual(
            readiness.steps.map((step) => step.summary),
            [
                "«readiness.material.empty»",
                "«readiness.workflow.empty»",
                "«readiness.compute.empty»",
                "«readiness.review.remaining»",
            ],
        );
    });

    it("routes the submit blockers through it", () => {
        setDependencies({ translate: ((key) => `«${key}»`) as TranslateFunction });
        const readiness = getJobReadiness({
            job: { isInInitialStatus: true, workflow: { subworkflows: [] }, compute: null },
            materials: [],
        });
        assert.deepEqual(readiness.blockingReasons, [
            "«blocker.material»",
            "«blocker.workflow»",
            "«blocker.compute»",
            "«blocker.save»",
        ]);
    });

    it("has no duplicate English defaults hiding a merge mistake", () => {
        // Two keys with identical copy is usually a copy-paste, and it makes the
        // catalogue lie about how many distinct things the designer says.
        const seen = new Map<string, string>();
        const duplicates: string[] = [];
        Object.entries(MESSAGES).forEach(([key, text]) => {
            const previous = seen.get(text);
            if (previous) duplicates.push(`${previous} / ${key}: "${text}"`);
            else seen.set(text, key);
        });
        assert.deepEqual(duplicates, []);
    });

    it("names every parameter its sentence uses", () => {
        // A key whose default has no placeholders but whose callers pass params
        // silently drops them; the reverse shows braces to the reader.
        const withPlaceholders = Object.entries(MESSAGES).filter(([, text]) =>
            /\{\w+\}/.test(text),
        );
        assert.ok(withPlaceholders.length > 10, "expected interpolated messages in the catalogue");
        withPlaceholders.forEach(([key, text]) => {
            assert.doesNotMatch(text, /\{\s*\}/, `${key} has an empty placeholder`);
        });
    });
});
