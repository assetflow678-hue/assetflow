# **App Name**: AssetFlow

## Core Features:

- Room Management: Add new rooms by specifying name and manager. List existing rooms.
- Asset Addition: Add assets to rooms by specifying the asset name and quantity. Automatically generate a unique ID and QR code for each asset.
- QR Code Generation: Generates a short link containing the asset identifier to be encoded as a QR code: https://myapp.com/i/ABC123, and creates PDFs of QR labels for easy printing.
- QR Code Scanner: Scan QR codes using the device's camera to quickly access asset details.
- Asset Detail View: Display asset details upon QR code scan or manual selection, including asset name, ID, room, manager, and date added.
- Asset Adjustment: Tool to move assets between rooms, or update their status to 'in use', 'broken', 'repairing', or 'disposed', deciding when information needs to be part of the output based on context.
- Reporting: Generate reports listing assets by room, downloadable as CSV or PDF.

## Style Guidelines:

- Primary color: HSL(47, 89%, 54%) converted to RGB Hex: #F09A28 -- This vibrant orange aims to embody efficiency, while stopping short of the aggressiveness of a pure red. This aligns with the app's goal of seamless asset management, a bit of playfulness, and confident organization.
- Background color: HSL(47, 18%, 93%) converted to RGB Hex: #F5F2EE --  This light, warm gray provides a clean and professional backdrop.
- Accent color: HSL(17, 79%, 48%) converted to RGB Hex: #D14A0F -- A strong contrasting red to call attention to key functions and alerts.
- Font pairing: 'Space Grotesk' (sans-serif) for headings, paired with 'Inter' (sans-serif) for body text.
- Mobile-first design with a clean, finger-friendly interface.
- Simple, minimalist icons for navigation and actions.
- Subtle transitions and animations to enhance user experience.