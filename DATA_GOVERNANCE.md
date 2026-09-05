# YayaAiki Data Governance

YayaAiki treats governance as data attached to the object, not as a slogan about where a server is located.

## Classification

| Class | Meaning | Examples |
|---|---|---|
| D0 | Public | Marketing pages, public reputation summary |
| D1 | Business | Task catalogue, non-sensitive project metadata |
| D2 | Personal | Name, contact details, ordinary profile data |
| D3 | Sensitive Personal | KYC documents, biometric onboarding material |
| D4 | Restricted Economic | Payment details, pricing, confidential client datasets, private evidence |
| D5 | Strategic / Sovereign | Regulated-sector or national-interest contract data |

## Required metadata

Relevant records should support `data_class`, `data_owner`, `data_subject`, `purpose`, `processing_basis`, `jurisdiction`, `storage_region`, `processing_region`, `retention_policy`, `deletion_policy`, `cross_border_status`, `ai_processing_status`, `training_permission`, `access_policy`, `created_at`, and `expires_at`.

## AI separation

`ai_processing_status` answers whether a provider may process data to complete a task. `training_permission` answers whether that data may be used to train or improve a model. They are separate, explicit, revocable permissions. No client dataset silently becomes training data.

## Retention and access

Access is contextual: an actor may access only the resource, purpose, and data class required for the action under a versioned policy. Retention and deletion are policy decisions recorded with the object. Legal, contractual, and jurisdictional requirements must be reviewed before enabling cross-border processing.

## Human accountability

AI can assist extraction, translation, matching, support, and anomaly detection. It must not silently create a verified qualification, final payment decision, permanent sanction, or dispute outcome from an unverified claim.
