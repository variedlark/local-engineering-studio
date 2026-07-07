# Feature maturity matrix

| Area | Status | Notes |
| --- | --- | --- |
| Project model, command validation, local bundle save/load | Beta | Typed errors and validation are in place, but format migration is still evolving. |
| STEP export | Experimental | Produces an explicitly labelled simplified preview, not a complete CAD-grade AP203/AP214 model. |
| Gerber export | Experimental | Emits minimal pads/outlines and units; production CAM verification is still required. |
| BOM export | Beta | CSV escaping and grouping are deterministic; manufacturer/MPN are only exported when provided. |
| KiCad/Altium/Eagle import | Experimental | UI importers are validation-focused and should not be presented as full native-format parsers. |
| Cloud sync | Experimental | Independent operations merge; conflicting scalar edits still use deterministic LWW. |
| Desktop mock IPC | Mock/dev only | Useful for UI development, not a backend conformance substitute. |
