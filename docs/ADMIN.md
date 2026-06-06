# Admin Operations

## URL

Local development:

```text
http://localhost:3050/admin
```

Production:

```text
https://your-domain.example/admin
```

Do not expose the admin URL on the student-facing homepage. Admin API routes require `ADMIN_PASSWORD`.

## Environment Variable

```env
ADMIN_PASSWORD=replace-with-a-strong-admin-password
```

The admin UI sends this value through the `x-admin-password` header.

## Admin API Routes

```text
GET    /api/admin/codes
POST   /api/admin/codes
DELETE /api/admin/codes
POST   /api/admin/codes/reset-device
POST   /api/admin/codes/disable
```

All admin routes require:

```http
x-admin-password: <ADMIN_PASSWORD>
```

## Activation-Code Lifecycle

1. Admin generates a code.
2. Student enters the plaintext code.
3. The server hashes the code and finds the activation row.
4. First successful activation binds the code to the current browser device id.
5. Another device using the same code is rejected.
6. The same device activating a different active code is rejected.
7. Admin can reset, disable, or delete the code.

## Reset Device

Reset clears:

```text
bound_device_id
activated_at
```

If the code is active, reset changes it back to `unused`. Disabled or expired codes remain disabled or expired.

## Manual API Example

```powershell
$base = "https://your-domain.example"
$headers = @{ "x-admin-password" = "<ADMIN_PASSWORD>" }
Invoke-RestMethod -Uri "$base/api/admin/codes" `
  -Method POST `
  -Headers $headers `
  -ContentType "application/json" `
  -Body (@{
    count = 1
    label = "student-or-order-note"
    courseId = "smart-manufacturing"
    maxResets = 1
  } | ConvertTo-Json)
```
