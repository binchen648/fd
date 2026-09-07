# FD Providers Package

This package contains model-provider adapters for the content pipeline.

Current scope:

- load provider runtime config from file
- read API key from local file path
- construct SiliconFlow chat-completions requests
- expose `runVision`, `runStructure`, and `runReview`

Current adapter:

- `SiliconFlowProvider`

Notes:

- this is an adapter skeleton, not a production-hardened client
- response parsing currently assumes JSON-only model output
- retry policy, rate-limit handling, and richer validation can be added later
