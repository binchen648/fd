# FD Pipeline Utilities

This package provides minimal utilities for the card-ingestion pipeline.

Current scope:

- staged artifact path generation
- JSON artifact read/write helpers
- file stem and namespace helpers
- runner context and provider wiring skeleton
- run-vision / run-structure / run-guardrail entrypoints
- batch runner skeleton

These helpers are intentionally small so that Vision, Structuring, and Guardrail runners can share the same storage convention.
