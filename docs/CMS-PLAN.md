# CMS plan

The CMS is a **separate, private project** (its own repo and Vercel project), so its plan, schema and security notes are kept there and not in this public repo.

What the public site needs from it, at a glance:
- At build time it reads one thing: the latest published content snapshot (`prebuild` writes `content/*.json`).
- The join form inserts applications straight into the club's database.
- Until the CMS ships, content is edited with Keystatic (see [CMS.md](CMS.md)).
