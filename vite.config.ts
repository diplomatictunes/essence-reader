import { defineConfig } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';
import Icons from 'unplugin-icons/vite';

export default defineConfig({
    plugins: [
        sveltekit(),
        Icons({
            compiler: 'svelte', // Ensure the compiler is explicitly set to 'svelte'
            autoInstall: true,  // Automatically install missing icon sets
        }),
    ],
});
