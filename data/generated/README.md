# Generated Playtest Artifacts

Owner: Content Platform, reviewed by Rules Engine.

The three `fd-playtest-v1.*.json` files are generated exclusively by
`scripts/compile-playtest-content-pack.ts` from the manifest and authoring
sources under `data/packs` and `data/authoring`.

Do not edit generated JSON manually. Run:

```text
npm run content:compile
npm run verify:generated-content
```

`verify:generated-content` performs two clean compilations in temporary
directories, compares their SHA-256 hashes, and compares the result with the
checked-in artifacts. Timestamp changes are not content changes.
