### CMS Generator

> **Goal (one‑shot):** Delete any generic “CMS Pages” placeholder and create a full, production‑ready content management setup for **Beeget Fashion** consisting of **four editable entities**—`Home Page`, `About Page`, `Contact Page`, and a global `Footer`—*and* wire all of them into the **Admin Dashboard** under a new menu group called **“Site Content”.** The prompt must run once and finish with every section, form, and default content in place so editors see the live site exactly like the screenshots.

---

## 1  Global guidelines

1. Use **modular blocks** so non‑technical editors can add, remove, or reorder content without touching code.
2. All text, image, link, and CTA fields: labelled, sensible defaults, image uploads + alt‑text, instantly reflected on save (live preview).
3. Follow semantic names (`hero_section`, `our_story_section`, etc.) and allow multiple instances where appropriate.
4. Provide **example content & images** that replicate the reference screenshots so the site looks complete immediately after publishing.
5. Expose `cta_text` + `cta_link` on every button.
6. Enable i18n on all text fields; slugs generate once then stay immutable.

---

## 2  Home Page entity

Create the following ordered blocks (each block = repeatable component with the described fields):

1. **Hero Section** – `background_image`, `headline`, `subheadline`, `cta_text`, `cta_link`, `overlay_style` (light/dark).
2. **Shop by Category Grid** – repeatable `categories` items: `image`, `label`, `collection_link` (6 default items).
3. **Promotional Banner** (repeatable) – `banner_image`, `headline`, `subheadline`, `cta_text`, `cta_link`, `align` (left/right). Use twice by default (“Summer Festivities” & “Work Anywhere”).
4. **Watch and Buy Carousel** – `headline` (default “WATCH AND BUY”), `products` (relation).
5. **Dresses Banner** – single banner, same fields as Promotional.
6. **Playful Florals Banner** – single banner, same fields.
7. **Plus Size Banner** – single banner, same fields.
8. **Featured Products Grid** – `headline` (default “Featured Products”), `products` (relation).
9. **Newsletter Signup Strip** – `headline`, `subtext` (email field auto‑connect to mailing list).

---

## 3  About Page entity

Ordered blocks:

1. **Page Header** – `headline`, `subheadline`.
2. **Our Story** – `rich_text_story`, `side_image`.
3. **Our Values Cards** – repeatable `value_cards`: `icon` (upload/SVG), `title`, `description`.
4. **Meet Our Team Grid** – repeatable `team_members`: `photo`, `name`, `position`.
5. **CTA Strip** (optional) – `headline`, `buttons` (repeatable `text`, `link`).

---

## 4  Contact Page entity

Blocks:

1. **Page Header** – `headline`, `subheadline`.
2. **Contact Info Panel** – `general_email`, `support_email`, `phone`, `business_hours_weekday`, `business_hours_sat`, `address_line1‑4`, `map_embed` (optional).
3. **Enquiry Form** – built‑in spam protection; fields: `name`, `email`, `subject`, `message` (all required). On submit: email to configured address **and** store in an `Enquiries` collection.
4. **Social Links Row** – repeatable `links`: `platform`, `url`, `icon`.

---

## 5  Global Footer entity

**Brand & Social**

- `brand_name` (default “Beeget Fashion”)
- `description_paragraph`
- `social_links` (repeatable): `platform`, `url`, `icon`

**Quick Links Columns**

- Column A: `title` (default “Quick Links”), `links` list (`label`, `url`)
- Column B: `title` (default “Information”), `links`
- **Newsletter Signup:** `headline`, `subtext` (email connects to same list as Home Page strip)

---

## 6  Admin Dashboard integration (critical)

1. **Create new top‑level menu group:** **Site Content**.
2. Inside Site Content show four sub‑entries in this order: `Home Page`, `About Page`, `Contact Page`, `Footer`.
3. Remove/hide the old generic **CMS Pages** section if it exists.
4. Each sub‑entry opens a dedicated editor screen containing the modular blocks listed above with drag‑and‑drop ordering and inline preview.
5. For `Enquiries` collection create a **read‑only** list under *Site Content → Enquiries* displaying submissions with filters, search, and export‑CSV action.
6. Add role‑based permissions: `Admin` = full CRUD, `Editor` = edit content but cannot delete entities, `Viewer` = read‑only.

---

## 7  System settings

- Enable **preview‑before‑publish** toggle.
- Autosave drafts every 30 seconds.
- Version history with restore for every entity.

---

## 8  Deliverables to execute right now

1. Four collection/entity schemas wired to front‑end templates.
2. Admin Dashboard menu changes as per §6.
3. Example content & images so live site mirrors screenshots on first publish.
4. Editing UI with field grouping & inline help text.
5. Confirmation message: *“CMS generation completed for Beeget Fashion”*.

**Run all steps in this single execution and confirm once done.**

