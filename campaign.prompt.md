## Plan: Offers & WhatsApp Campaigns

Add offers/campaigns pages, per-shop WhatsApp creds with test send, gender/age targeting, and conditional sending (API vs wa.me) while keeping billing share intact.

### Steps
1. Add Offers/Campaigns entry points in frontend/src/components/BottomNav.tsx and dashboard quick actions in frontend/src/app/dashboard/page.tsx.
2. Scaffold offers/campaigns CRUD pages reusing card/list patterns in frontend/src/app/services/page.tsx; fields: name, code (optional), type/value, validity, status, audience (gender/age), message template.
3. Extend customers with gender and birthdate/age fields through models/schemas (backend/app/models/customer.py, backend/app/schemas/customer.py) and forms in frontend/src/app/customers/new/page.tsx and frontend/src/app/customers/[id]/page.tsx.
4. Implement per-shop WhatsApp creds (hashed/encrypted) in config/models and new settings endpoints (backend/app/core/config.py, new route), with “Test send” endpoint to validate creds.
5. Update Settings UI to capture creds, show status, and trigger test send in frontend/src/app/settings/page.tsx; gate campaign send buttons based on status, with wa.me fallback when missing.
6. Keep billing share on wa.me in frontend/src/app/bill/[id]/receipt/page.tsx; optionally surface “Send via API” when shop creds pass test, otherwise default to wa.me.

### Further Considerations
1. Feature flags: add NEXT_PUBLIC_WHATSAPP_API_ENABLED and server toggles to cleanly switch UI/behavior.
2. Security: store creds encrypted/hashed, mask on read; admin-only access to settings endpoints.
