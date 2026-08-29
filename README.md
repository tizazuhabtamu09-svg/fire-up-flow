# Welcome to your Lovable project

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Open your project in the [Lovable editor](https://lovable.dev) and keep building.

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: connect the project to GitHub and every change made in Lovable is committed straight to your repository.
- **Full ownership**: this code is yours. Push to your repository and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## After remixing this project

This is a marketplace template for connecting service workers with households. Before publishing, update these:

1. **Branding**: edit `BRAND` in `src/lib/app-config.ts` (name, Amharic name, tagline, description). This updates the header, footer, SEO, and most page copy automatically.
2. **Contact details**: set your phone, email, and payment account in `.env`:
   - `VITE_CONTACT_PHONE`
   - `VITE_CONTACT_EMAIL`
   - `VITE_PAYMENT_ACCOUNT_NAME`
   - `VITE_TELEBIRR_NUMBER`
3. **Content**: update the hero copy, pricing, worker categories, and testimonials on `src/routes/index.tsx`.
4. **Service categories**: adjust the worker sectors in `src/lib/app-config.ts`.
5. **Auth and onboarding**: test the `/join` flow for employees, employers, and brokers.
6. **Payments**: review the wallet and fee values in `src/lib/app-config.ts`.

## Built with


- TanStack Start
- TypeScript
- React
- Tailwind CSS
