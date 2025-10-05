import { RaytracerApp } from './app/RaytracerApp';
import { Raytracer } from './core/Raytracer';
import { getDefaultScene } from './scenes/defaultScene';

// ============= INITIALIZATION =============
let app: RaytracerApp;

console.log('🚀 Main.ts wird ausgeführt...');

window.addEventListener('DOMContentLoaded', () => {
    console.log('✅ DOM loaded, initializing...');

    try {
        console.log('🔧 Creating RaytracerApp...');
        app = new RaytracerApp('raytracer-canvas');
        console.log('✅ RaytracerApp created');

        // Globale Verfügbarkeit
        (window as any).raytracerApp = app;
        (window as any).getDefaultScene = getDefaultScene;
        console.log('✅ Global variables set');

        // Default scene laden
        console.log('📄 Loading default scene...');
        app.loadScene(JSON.stringify(getDefaultScene()))
            .then(() => {
                console.log('✅ Default scene loaded successfully');
                const sceneEditor = document.getElementById('scene-editor') as HTMLTextAreaElement;
                if (sceneEditor) {
                    sceneEditor.value = JSON.stringify(getDefaultScene(), null, 2);
                    console.log('✅ Scene editor populated');
                } else {
                    console.warn('⚠️ Scene editor not found');
                }
            })
            .catch(error => {
                console.error('❌ Error loading default scene:', error);
            });

        console.log('🎉 App initialized successfully!');
    } catch (error) {
        console.error('❌ CRITICAL ERROR initializing app:', error);
        // Zeige Fehler im UI
        const status = document.getElementById('status');
        if (status) {
            status.textContent = '❌ Fehler: ' + (error as Error).message;
            status.style.background = '#f44336';
            status.style.color = 'white';
        }
    }
});

export { RaytracerApp, Raytracer, getDefaultScene };