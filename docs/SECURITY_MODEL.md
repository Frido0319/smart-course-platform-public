# Security Model

## Goal

This project prevents casual sharing of paid course access through static files, direct links, or reused activation codes.

It does not attempt to block:

- screenshots,
- screen recording,
- a student manually explaining content to another person.

## Access Model

1. Admin generates an activation code.
2. Student enters the code on the student entry page.
3. The server hashes the code and finds the activation row.
4. If unused, the code binds to the current browser device id.
5. If already bound to another device, activation is rejected.
6. If the current device already has another active code, activation is rejected.
7. The server creates an HTTP-only session cookie.
8. Protected course routes re-check session, course id, activation status, device id, and expiration.

## Protected Routes

```text
/api/course/html
/api/course/asset/[...assetPath]
/api/course/manifest
```

These routes should never serve private content without authorization.

## Admin Controls

Admin can:

- generate activation codes,
- reset a device binding,
- disable activation codes,
- delete activation codes.

Resetting a disabled or expired code must not make it usable.

## Limitations

- Browser device id is stored in localStorage.
- Clearing browser storage can make a browser look like a new device.
- Stronger commercial controls would require accounts, payment records, device-change approval, and abuse monitoring.
