# CampusGig Security Specification & Adversarial Audit

## 1. Core Data Invariants
1. **PII Isolation**: Email addresses, student enrollment numbers, mobile numbers, and UPI IDs live strictly in `/users_private/{userId}` and are readable/writable only by the account owner or an authorized administrator. Public profiles in `/users_public/{userId}` never contain PII.
2. **No Self-Assigned Admin or Verification Escalation**: Regular users cannot create `admins/{uid}` documents, cannot set `role: "admin"`, and cannot self-verify (`verificationStatus: "verified"`) without verified university domain email or admin approval.
3. **No Self-Applications or Duplicate Applications**: Deterministic document IDs (`${taskId}_${applicantId}`) prevent duplicate applications; rules reject `applicantId == posterId`.
4. **Strict Task Lifecycle & Terminal Locking**: Tasks transition monotonically (`open -> accepted -> in_progress -> submitted -> completed`). Once `completed` or `cancelled`, non-admins cannot mutate task state.
5. **Verified-Only Participation**: Unverified or suspended students cannot submit gig applications.
6. **Participant-Only Messaging & Transactions**: Conversations, messages, and transaction records are strictly restricted to the task's `posterId`, `assignedWorkerId`, or an administrator.
7. **Server-Enforced Timestamps & Bounded Payloads**: All `createdAt`/`updatedAt` timestamps must match `request.time`; every string and list enforces explicit `.size()` bounds.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Role Escalation on Registration**: Creating `/users_public/{uid}` with `role: "admin"` as a non-admin user -> `PERMISSION_DENIED`.
2. **Self-Verification Bypass**: Updating `/users_public/{uid}` to `verificationStatus: "verified"` by a non-admin user -> `PERMISSION_DENIED`.
3. **Shadow Ghost Field Injection**: Creating a `/tasks/{taskId}` with an extra undocumented field `featured: true` -> `PERMISSION_DENIED`.
4. **PII Cross-Read**: User B attempting `get` or `list` on `/users_private/{userA}` -> `PERMISSION_DENIED`.
5. **Unverified Student Application**: Creating `/applications/{appId}` when `users_public/{uid}.verificationStatus != "verified"` -> `PERMISSION_DENIED`.
6. **Self-Application Attack**: Creating `/applications/{appId}` where `applicantId == posterId` -> `PERMISSION_DENIED`.
7. **State Shortcutting**: Worker attempting to update `/tasks/{taskId}` directly from `open` to `completed` -> `PERMISSION_DENIED`.
8. **Terminal Task Tampering**: Poster attempting to update budget or status of a `completed` task -> `PERMISSION_DENIED`.
9. **Unauthorized Chat Snooping**: User C (not in `participantIds`) reading `/conversations/{convId}/messages/{msgId}` -> `PERMISSION_DENIED`.
10. **Duplicate Payment / Forged Payout**: Non-poster creating `/transactions/{txnId}` or mutating `platformCommissionInr` after completion -> `PERMISSION_DENIED`.
11. **ID Poisoning**: Creating `/tasks/{oversized_1kb_id}` violating `isValidId()` regex/length -> `PERMISSION_DENIED`.
12. **Client-Forged Timestamps**: Creating a task or review with `createdAt` set to a backdated client timestamp instead of `request.time` -> `PERMISSION_DENIED`.
