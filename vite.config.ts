import path from "path"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    // cors: true,
    cors: {
      origin:['https://cmpf.re/*', "https://niantic-social-api.nianticlabs.com/graphql"]
    },
    watch: {
      usePolling: true
    },
     proxy: {
      // Configure un proxy pour toutes les requêtes commençant par '/api-cmpf'
      '/api-cmpf': {
        target: 'https://cmpf.re', // L'URL de l'API cible
        changeOrigin: true, // Change l'origine de la requête pour correspondre à la cible
        secure: true, // À définir sur 'true' si l'API cible utilise HTTPS (ce qui est le cas ici). Si vous rencontrez des problèmes, essayez 'false'.
        rewrite: (path) => path.replace(/^\/api-cmpf/, ''), // Réécrit le chemin en supprimant '/api-cmpf'
      },
      '/api-graphql': {
        target: 'https://niantic-social-api.nianticlabs.com/graphql', // L'URL de l'API cible
        changeOrigin: true, // Change l'origine de la requête pour correspondre à la cible
        secure: true, // À définir sur 'true' si l'API cible utilise HTTPS (ce qui est le cas ici). Si vous rencontrez des problèmes, essayez 'false'.
        rewrite: (path) => path.replace(/^\/api-graphql/, ''), // Réécrit le chemin en supprimant '/api-cmpf'
      },
    },
  },
})
