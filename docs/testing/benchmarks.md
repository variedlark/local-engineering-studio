# Benchmark Policy

## Purpose

Track regressions in command throughput, snapshot serialization, and project recovery latency.

## Required baseline checks

- command apply throughput on `medium-grid`
- project snapshot save/load latency
- autosave recovery load time
- benchmark harness: `cargo bench --package app-core --bench command_pipeline`

## CI strategy

- lightweight benchmark smoke checks on pull requests
- full benchmark suite nightly with artifact history
