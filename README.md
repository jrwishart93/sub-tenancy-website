# Sub-Tenancy Portal

This repository contains a static sub-tenancy portal built with plain HTML, CSS and JavaScript. The portal allows new sub-tenants to read house rules and complete a sub-tenancy agreement, sign it via canvas or image upload, export to PDF and email the agreement. The site is designed to be hosted on GitHub Pages without any back‑end or external dependencies. It uses GOV.UK-inspired styling for clarity and accessibility.

## Structure

- `index.html` – Landing page linking to the house rules and the agreement.
- `rules.html` – House rules with sections on respect & noise, shared areas, guests, internet use, smoking/vaping, pets, safety & repairs, and parking/mail/storage.
- `agreement.html` – Interactive form to complete and sign the sub-tenancy agreement. Includes date, rent details, sub‑tenant information, and signature pads with support for time stamping and image upload. The page also supports exporting to PDF via print and sending via a prefilled mailto link.
- `css/style.css` – Base styles and print styles.
- `js/signature.js` – Signature pad implementation for drawing and capturing signatures, stamping time and uploading image.
- `js/agreement.js` – Agreement form logic, validation, localStorage autosave/restore, PDF export and email composition.
- `assets/` – Static assets such as favicon and logo.

## Usage

Open the site via GitHub Pages (see repository settings) or clone the repo and open `index.html` in a browser. The site works offline and stores form data in localStorage.

## Email delivery (Resend)

To email the completed agreement directly to the Sub-Tenant:

1. Create a `.env` file in the project root with your API key:

   ```env
   RESEND_API_KEY=your_resend_api_key
   ```

2. Install dependencies and start the local server:

   ```bash
   npm install
   npm start
   ```

3. Use the **Email Agreement** button in the Sign & Export tab. The browser sends the preview HTML to `/api/send-agreement`, which uses the Resend SDK to deliver the message without exposing the API key in client-side code.

## License

Released under the MIT License.
