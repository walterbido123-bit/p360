# Programmatic Editorial Policy

## Default posture
Automation may accelerate reporting but does not lower sourcing or verification standards. The system is fail-closed: uncertainty routes to review instead of publication.

## Automatic rejection
- Duplicate score >= 0.88.
- No attributable source.
- Confidence < 0.65.
- Invalid or incomplete newsroom contract.

## Mandatory human review
Unless explicitly approved by an editor, route to review when:
- Risk is high.
- Risk is medium.
- Confidence is below 0.85.
- Fewer than two independent attributable sources support a story intended for automatic publication.
- Story concerns allegations, deaths/injuries, minors, elections, public safety, legal accusations, corrections, graphic material, or other sensitive claims.

## Automatic publication eligibility
Only low-risk stories with confidence >= 0.85, duplicate score < 0.88 and at least two attributable sources are technically eligible. Eligibility does not force publication; supervisors may impose stricter rules per desk.

## Provenance
Every published item must retain workflow ID, source URLs, source publishers, timestamps, editorial decision and automation/human approval state in the audit trail.

## Kill switch
Production publication is disabled unless the runtime-only variable `PUBLISHING_ENABLED=true` is present. It must never be committed to Git with a production value.
