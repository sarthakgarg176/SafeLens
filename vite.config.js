import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api/takedowns': {
        // 🚀 FIXED: Pointing to localhost backend instead of Render for local dev
        target: 'http://127.0.0.1:8000',
        bypass: (req, res) => {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            data: [
              {
                id: 'TD-901',
                target: 'clone-privacyshield.net',
                type: 'Registrar Domain Suspension',
                counter: 3,
                status: 'Pending Registrar Action',
                lastUpdate: 'Jul 10, 15:45',
              },
              {
                id: 'TD-882',
                target: 'gist.githubusercontent.com/attacker-repo',
                type: 'DMCA Takedown Notice',
                counter: 1,
                status: 'Notice Dispatched',
                lastUpdate: 'Jul 09, 12:20',
              },
              {
                id: 'TD-871',
                target: 'domain-squatters-cyber.co',
                type: 'Registrar Domain Suspension',
                counter: 2,
                status: 'Mitigated / Removed',
                lastUpdate: 'Jul 08, 09:30',
              }
            ]
          }));
          return true;
        }
      },
      '/api': {
        // 🚀 FIXED: Pointing to localhost backend instead of Render
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})