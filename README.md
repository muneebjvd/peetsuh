# 🍕 Peetsuh

**Peetsuh** is a modern, high-performance web application and conversational ordering platform built for a premium pizza restaurant in Lahore. It features a beautifully designed, zero-latency user interface and a highly intelligent rule-based chatbot that acts as a virtual cashier and customer service representative.

## ✨ Key Features

- **Conversational Intelligence:** A robust, zero-latency rule-based chatbot built from scratch using a custom fuzzy-matching engine. It handles complex intents, multi-lingual banter (e.g., Urdu queries), and multi-step order flows without relying on slow external LLM APIs.
- **Smart Ingredient Search:** Users can ask for specific flavors or dietary preferences (e.g., *"any non-spicy olive pizza"*, *"capsicum flavor"*). The bot intelligently filters the menu in real-time.
- **Dual-Channel Ordering:** Customers can place orders via the traditional **Shop** interface or through an interactive **Chat** experience.
- **Table Bookings & Reservations:** Seamless system to book tables for Dine-in, Buffet, or Hi-Tea with strict client-side and server-side validation for Pakistani phone numbers and names.
- **Admin Dashboard:** A real-time, secure portal for restaurant staff to manage active orders and table bookings via segregated tabs.
- **Hyper-Optimized UI:** Features a completely blink-free, zero-transition background hero slider utilizing absolute `z-index` stacking, ensuring peak rendering performance and a premium feel on mobile devices.

## 🛠️ Technology Stack

- **Framework:** Next.js (App Router)
- **Library:** React (Functional Components, Hooks, Zustand for state management)
- **Language:** TypeScript (Strict typing for the complex State Machine)
- **Database:** `better-sqlite3` (Lightning-fast, serverless local database for orders and admin auth)
- **Styling:** Vanilla CSS (Custom design system avoiding heavy CSS frameworks for maximum control)

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/peetsuh.git
   cd peetsuh/peetsuh-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```
   Or use the included Windows batch script:
   ```cmd
   .\Start-Peetsuh.bat
   ```

4. **Open the App**
   Navigate to `http://localhost:3000` in your browser.

## 📂 Project Structure

- `/src/app`: Next.js App Router pages (Home, Shop, Chat, Admin).
- `/src/components`: Reusable UI components (HeroSlider, ItemModal, Chatbot Interface).
- `/src/lib`: Core logic and utilities.
  - `state-machine.ts`: The brains of the chatbot handling session states and transitions.
  - `fuzzy-engine.ts`: The intent-matching engine mapping natural language to system commands.
  - `validation.ts`: Shared client/server validation logic (e.g., Pakistani phone formats).
  - `db.ts`: SQLite database connection and operations.
- `/data`: Directory where the `peetsuh.db` SQLite database is generated.

## 🛡️ Admin Access
To access the admin dashboard, navigate to `/admin`.
*(Note: An admin user must be created in the database to log in.)*

## 📄 License
This project is proprietary and built specifically for the Peetsuh brand.

CREATED BY MUHAMMAD MUNEEB JAVED
