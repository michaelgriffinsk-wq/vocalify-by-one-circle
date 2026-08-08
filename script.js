// --- MODAL UI LOGIC ---
const modal = document.getElementById('lessonModal');
const modalTitle = document.getElementById('modalTitle');
const modalDesc = document.getElementById('modalDesc');

function openLessonModal(title, desc) {
    modalTitle.innerText = title;
    modalDesc.innerText = desc;
    modal.style.display = 'flex';
}

function closeModal() {
    modal.style.display = 'none';
}

// Close modal if clicked outside
window.onclick = function(event) {
    if (event.target == modal) {
        closeModal();
    }
}


// --- CORE AUDIO ENGINE ---
let audioContext;
let analyser;
let microphone;

async function startAudioEngine() {
    try {
        // 1. Initialize the Audio Context
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // 2. Request Microphone Access (raw audio, no echo cancellation)
        const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                echoCancellation: false,
                autoGainControl: false,
                noiseSuppression: false
            } 
        });

        // 3. Create the Analyser Node
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048; 
        
        // 4. Route the microphone into the analyser
        microphone = audioContext.createMediaStreamSource(stream);
        microphone.connect(analyser);
        
        console.log("Audio engine started successfully! The browser is listening.");
        
        // Update UI to show success
        const startBtn = document.querySelector('.btn-start');
        if(startBtn) {
            startBtn.innerText = "Microphone Connected!";
            startBtn.style.backgroundColor = "#00b894"; // success green
            startBtn.style.boxShadow = "none";
            startBtn.style.transform = "translateY(4px)";
        }
        
        // Close modal after a brief delay so the user sees the success message
        setTimeout(() => {
            closeModal();
            // We will trigger the pitch detection loop here in the next step!
        }, 1500);
        
    } catch (error) {
        console.error("Error accessing the microphone:", error);
        alert("Vocalify requires microphone access to hear you sing!");
    }
}
