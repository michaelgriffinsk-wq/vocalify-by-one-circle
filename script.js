// Global variables for our audio engine
let audioContext;
let analyser;
let microphone;

async function startAudioEngine() {
    try {
        // 1. Initialize the Audio Context
        // This is the main environment where all audio processing happens
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // 2. Request Microphone Access
        // We turn off built-in processing because we want the raw vocal pitch
        const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                echoCancellation: false,
                autoGainControl: false,
                noiseSuppression: false
            } 
        });

        // 3. Create the Analyser Node
        // This node extracts time and frequency data from the audio signal
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048; // Higher number = better frequency resolution
        
        // 4. Route the microphone into the analyser
        microphone = audioContext.createMediaStreamSource(stream);
        microphone.connect(analyser);
        
        console.log("Audio engine started successfully! The browser is listening.");
        
        // Change the button appearance so the user knows it worked
        const startBtn = document.querySelector('.btn-start');
        if(startBtn) {
            startBtn.innerText = "Microphone Connected!";
            startBtn.style.backgroundColor = "#2d3436";
        }
        
    } catch (error) {
        // Handle denied permissions or missing hardware
        console.error("Error accessing the microphone:", error);
        alert("Vocalify requires microphone access to hear you sing!");
    }
}
